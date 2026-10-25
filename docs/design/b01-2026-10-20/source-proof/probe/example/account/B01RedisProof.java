package example.account;

import java.nio.file.*;import java.nio.charset.StandardCharsets;import java.time.Duration;import java.util.*;import java.util.concurrent.*;
import org.springframework.data.redis.connection.*;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.*;
import static example.account.B01Proof.*;

/** 두 독립 client가 새 private Redis에만 연결하는 추가 관찰자다. */
public class B01RedisProof {
 static LettuceConnectionFactory factory(int port,String password){var c=new RedisStandaloneConfiguration("127.0.0.1",port);c.setPassword(password);var f=new LettuceConnectionFactory(c);f.afterPropertiesSet();f.start();return f;}
 static StringRedisTemplate template(LettuceConnectionFactory f){var t=new StringRedisTemplate(f);t.afterPropertiesSet();return t;}
 static long expiry(StringRedisTemplate t,String key){return t.execute(new org.springframework.data.redis.core.script.DefaultRedisScript<Long>("return redis.call('PEXPIRETIME',KEYS[1])",Long.class),List.of(key));}
 public static void main(String[] args)throws Exception {
  int port=Integer.parseInt(System.getenv("B01_REDIS_PORT"));String password=System.getenv("B01_REDIS_PASSWORD");
  var fa=factory(port,password);var fb=factory(port,password);
  try{
   var a=template(fa);var b=template(fb);Properties info;
   try(var c=fa.getConnection()){info=c.serverCommands().info("server");}
   if(!info.getProperty("process_id").equals(System.getenv("B01_REDIS_PID"))||!info.getProperty("tcp_port").equals(Integer.toString(port)))throw new AssertionError("private Redis identity");
   long clientA,clientB;
   try(var ca=fa.getConnection();var cb=fb.getConnection()){
    ca.serverCommands().setClientName("b01-client-a".getBytes(StandardCharsets.US_ASCII));cb.serverCommands().setClientName("b01-client-b".getBytes(StandardCharsets.US_ASCII));
    var clients=ca.serverCommands().getClientList();clientA=Long.parseLong(clients.stream().filter(c->"b01-client-a".equals(c.getName())).findFirst().orElseThrow().get("id"));clientB=Long.parseLong(clients.stream().filter(c->"b01-client-b".equals(c.getName())).findFirst().orElseThrow().get("id"));
   }
   check("private-redis-two-independent-clients",clientA!=clientB,map("redisVersion",info.getProperty("redis_version"),"differentClientIds",true,"scope","new loopback/password/ownPID guard; not existing Redis"));
   var aa=new SourceRedisAdapter(a);var bb=new SourceRedisAdapter(b);
   long first=aa.failed("b01:fixed",Duration.ofSeconds(60));long expiry1=expiry(a,"b01:fixed");
   long second=bb.failed("b01:fixed",Duration.ofSeconds(60));long expiry2=expiry(b,"b01:fixed");
   long ttl=a.getExpire("b01:fixed",TimeUnit.MILLISECONDS);
   check("source-lua-first-expiry-fixed-window",first==1&&second==2&&expiry1==expiry2&&ttl>0&&ttl<=60000,map("first",first,"second",second,"sameAbsoluteExpiry",true,"positiveTtlWithin60s",true,"scope","first request expiry not sliding refresh; raw expiry perrun only"));
   Files.writeString(Path.of(System.getenv("B01_REDIS_RAW_OUTPUT")),JSON.writerWithDefaultPrettyPrinter().writeValueAsString(map("clientA",clientA,"clientB",clientB,"expiry1",expiry1,"expiry2",expiry2,"pttlObserved",ttl))+"\n");
   var start=new CountDownLatch(1);var pool=Executors.newFixedThreadPool(2);
   try{
    Callable<List<Long>> nodeA=()->{start.await();var results=new ArrayList<Long>();for(int i=0;i<30;i++)results.add(aa.failed("b01:shared",Duration.ofSeconds(60)));return results;};
    Callable<List<Long>> nodeB=()->{start.await();var results=new ArrayList<Long>();for(int i=0;i<30;i++)results.add(bb.failed("b01:shared",Duration.ofSeconds(60)));return results;};
    var x=pool.submit(nodeA);var y=pool.submit(nodeB);start.countDown();var xa=x.get(10,TimeUnit.SECONDS);var xb=y.get(10,TimeUnit.SECONDS);var all=new ArrayList<Long>(xa);all.addAll(xb);all.sort(Long::compare);
    var expected=new ArrayList<Long>();for(long i=1;i<=60;i++)expected.add(i);
    check("source-lua-two-client-shared-count60",all.equals(expected)&&"60".equals(a.opsForValue().get("b01:shared")),map("callsPerClient",List.of(xa.size(),xb.size()),"uniqueResults",new HashSet<>(all).size(),"resultMin",all.getFirst(),"resultMax",all.getLast(),"finalSharedCount",60,"scope","two independent clients/workerthreads same key, not production app nodes/HTTP"));
    check("extra-local-vs-shared-threshold40",xa.size()==30&&xb.size()==30&&all.stream().filter(n->n<=40).count()==40,map("addedThreshold",40,"separateLocalCounts",List.of(30,30),"localCountsWouldPermit",60,"sharedCountWouldPermit",40,"scope","extra decision calculation; original Lua only returns count, no HTTP limiter implemented"));
   }finally{pool.shutdownNow();}
   a.opsForValue().increment("b01:split");long missing=a.getExpire("b01:split");
   check("extra-split-incr-without-expire-leaves-key",missing==-1,map("count",1,"ttl",missing,"scope","deliberately stop after INCR; EXPIRE not sent; not process crash test"));
   boolean scriptFailed=false;try{aa.failWithInvalidExpiry("b01:error");}catch(org.springframework.dao.DataAccessException e){scriptFailed=true;}
   check("extra-lua-runtime-error-does-not-undo-incr",scriptFailed&&"1".equals(a.opsForValue().get("b01:error"))&&a.getExpire("b01:error")==-1,map("runtimeError",true,"countAfterError",1,"ttlAfterError",-1,"scope","same source Lua with extra invalid expiry argument; atomic is not error rollback"));
   long z1=aa.failed("b01:zero",Duration.ofMillis(999)),z2=aa.failed("b01:zero",Duration.ofMillis(999));
   check("source-subsecond-window-truncates-to-zero",z1==1&&z2==1&&!a.hasKey("b01:zero"),map("inputMillis",999,"windowToSeconds",0,"returns",List.of(z1,z2),"keyExists",false,"scope","source lacks positive whole-second config validation; not 999ms rate protection"));
   long one=aa.failed("b01:short",Duration.ofSeconds(1));long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(4);while(a.hasKey("b01:short")&&System.nanoTime()<deadline)Thread.sleep(30);
   boolean absent=!a.hasKey("b01:short");long after=bb.failed("b01:short",Duration.ofSeconds(1));
   check("source-lua-expiry-next-window-starts-one",one==1&&absent&&after==1,map("firstWindowCount",one,"expiredKeyAbsent",absent,"nextWindowCount",after,"scope","actual TTL wait bounded4s; no latency or throughput claim"));
   long deleted=a.delete(List.of("b01:fixed","b01:shared","b01:split","b01:error"));a.delete("b01:short");
   check("private-redis-probe-keys-explicit-cleanup",deleted==4&&a.keys("b01:*").isEmpty(),map("deletedLongLivingKeys",deleted,"remainingProbeKeys",0));
   Files.writeString(Path.of(System.getenv("B01_REDIS_JAVA_OUTPUT")),JSON.writerWithDefaultPrettyPrinter().writeValueAsString(map("checks",checks.stream().sorted().toList(),"facts",facts))+"\n");
  }finally{fa.destroy();fb.destroy();}
 }
}
