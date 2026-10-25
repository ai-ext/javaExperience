package example.paging;

import java.io.File;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.*;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.hibernate.cfg.Configuration;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import org.springframework.jdbc.datasource.AbstractDataSource;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import tools.jackson.databind.json.JsonMapper;

/** 추가 entity/관찰기다. 원문 두 Java 파일과 consume의 빈 본문은 수정하지 않는다. */
public class W15Proof {
    static final List<String> checks=new ArrayList<>();
    static Map<String,Object> map(Object... p){Map<String,Object> m=new LinkedHashMap<>();for(int i=0;i<p.length;i+=2)m.put((String)p[i],p[i+1]);return m;}
    static void check(String name,boolean value){if(!value)throw new AssertionError(name);checks.add(name);System.out.println("PASS "+name);}
    static Object call(Object target,Method method,Object[] args)throws Throwable {try{return method.invoke(target,args);}catch(InvocationTargetException e){throw e.getCause();}}
    static Object clean(Object value){
        if(value instanceof Map<?,?> m){Map<String,Object> r=new LinkedHashMap<>();m.forEach((k,v)->r.put(k.toString(),clean(v)));return r;}
        if(value instanceof Collection<?> c)return c.stream().map(W15Proof::clean).toList();
        if(value==null||value instanceof String||value instanceof Number||value instanceof Boolean)return value;
        return value.toString();
    }
    static List<Long> ids(List<Article> rows){return rows.stream().map(Article::getId).toList();}
    static Map<String,Object> position(ScrollPosition p){
        Map<String,Object> m=map("kind",p instanceof KeysetScrollPosition?"keyset":"offset","initial",p.isInitial());
        if(p instanceof KeysetScrollPosition k)m.put("keys",clean(k.getKeys()));
        if(p instanceof OffsetScrollPosition o&&!o.isInitial())m.put("offset",o.getOffset());
        return m;
    }
    static boolean validContract(String payload,String version,String status,String sort){
        Map<String,String> fields=new LinkedHashMap<>();
        for(String pair:payload.split("&")){String[] kv=pair.split("=",2);if(kv.length!=2||fields.putIfAbsent(kv[0],kv[1])!=null)return false;}
        return version.equals(fields.get("v"))&&status.equals(fields.get("status"))&&sort.equals(fields.get("sort"));
    }
    static class Observed extends AbstractDataSource {
        final DriverManagerDataSource raw;final List<Map<String,Object>> queries=new ArrayList<>();boolean recording;
        Observed(DriverManagerDataSource raw){this.raw=raw;}
        public Connection getConnection()throws SQLException {
            Connection c=raw.getConnection();
            return (Connection)Proxy.newProxyInstance(Connection.class.getClassLoader(),new Class[]{Connection.class},(p,m,a)->{
                if(m.getName().equals("prepareStatement")&&a[0]instanceof String sql){
                    PreparedStatement ps=(PreparedStatement)call(c,m,a);
                    Map<String,Object> bindings=new LinkedHashMap<>();Map<String,Object> q=map("sql",sql,"bindings",bindings,"resultRows",0,"statementClosed",false,"resultClosed",false);
                    if(recording)queries.add(q);
                    return Proxy.newProxyInstance(PreparedStatement.class.getClassLoader(),new Class[]{PreparedStatement.class},(pp,pm,pa)->{
                        if(pm.getName().startsWith("set")&&pa!=null&&pa.length>=2&&pa[0]instanceof Integer)bindings.put(pa[0].toString(),map("method",pm.getName(),"value",clean(pa[1])));
                        Object result=call(ps,pm,pa);
                        if(pm.getName().equals("executeQuery")&&result instanceof ResultSet rs){
                            return Proxy.newProxyInstance(ResultSet.class.getClassLoader(),new Class[]{ResultSet.class},(rp,rm,ra)->{
                                Object rv=call(rs,rm,ra);
                                if(rm.getName().equals("next")&&Boolean.TRUE.equals(rv))q.put("resultRows",(int)q.get("resultRows")+1);
                                if(rm.getName().equals("close"))q.put("resultClosed",rs.isClosed());
                                return rv;
                            });
                        }
                        if(pm.getName().equals("close"))q.put("statementClosed",ps.isClosed());
                        return result;
                    });
                }
                return call(c,m,a);
            });
        }
        public Connection getConnection(String u,String p)throws SQLException{throw new SQLException("configured fixture credentials only");}
    }
    interface ExtraRepository extends JpaRepository<Article,Long> {
        Window<Article> findFirst3ByStatusOrderByPublishedAtDesc(String status,ScrollPosition position);
    }
    public static void main(String[] args)throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        DriverManagerDataSource raw=new DriverManagerDataSource();raw.setUrl(System.getenv("W15_DB_URL"));raw.setUsername("w15_probe");raw.setPassword(System.getenv("W15_DB_PASSWORD"));
        Map<String,Object> versions;
        try(Connection c=raw.getConnection();Statement s=c.createStatement();ResultSet rs=s.executeQuery("SELECT @@datadir,VERSION(),@@port,@@bind_address")){
            rs.next();check("jdbc-only-fresh-guarded-datadir",new File(rs.getString(1)).getCanonicalFile().equals(new File(System.getenv("W15_EXPECTED_DATADIR")).getCanonicalFile()));
            check("jdbc-native-mysql8.4.11-loopback",rs.getString(2).equals("8.4.11")&&rs.getInt(3)==Integer.parseInt(System.getenv("W15_EXPECTED_PORT"))&&rs.getString(4).equals("127.0.0.1"));
            versions=map("mysql",rs.getString(2),"java",Runtime.version().feature(),"driver",c.getMetaData().getDriverVersion(),"hibernate",org.hibernate.Version.getVersionString(),"springDataJpa",JpaRepository.class.getPackage().getImplementationVersion(),"springDataCommons",Page.class.getPackage().getImplementationVersion());
        }
        Observed observed=new Observed(raw);Map<String,Object> output=map("versions",versions);
        Configuration cfg=new Configuration().addAnnotatedClass(Article.class);
        cfg.getProperties().put("hibernate.connection.datasource",observed);
        cfg.setProperty("hibernate.hbm2ddl.auto","validate");cfg.setProperty("hibernate.jdbc.time_zone","UTC");cfg.setProperty("hibernate.cache.use_second_level_cache","false");cfg.setProperty("hibernate.cache.use_query_cache","false");
        try(var factory=cfg.buildSessionFactory();var em=factory.createEntityManager()){
            JpaRepositoryFactory repositories=new JpaRepositoryFactory(em);
            ArticleRepository original=repositories.getRepository(ArticleRepository.class);
            List<Map<String,Object>> calls=new ArrayList<>();
            ArticleRepository wrapper=(ArticleRepository)Proxy.newProxyInstance(ArticleRepository.class.getClassLoader(),new Class[]{ArticleRepository.class},(p,m,a)->{
                int from=observed.queries.size();Object value=call(original,m,a);
                Map<String,Object> event=map("method",m.getName(),"status",a[0]);
                if(a[1]instanceof ScrollPosition pos)event.put("inputPosition",position(pos));
                if(value instanceof Page<?> page){event.put("kind","Page");event.put("ids",ids((List<Article>)(List<?>)page.getContent()));event.put("total",page.getTotalElements());event.put("hasNext",page.hasNext());}
                else if(value instanceof Window<?> window){event.put("kind","Window");event.put("ids",ids((List<Article>)(List<?>)window.getContent()));event.put("hasNext",window.hasNext());event.put("last",window.isLast());if(!window.isEmpty())event.put("lastReturnedPosition",position(window.positionAt(window.size()-1)));}
                else if(value instanceof Slice<?> slice){event.put("kind","Slice");event.put("ids",ids((List<Article>)(List<?>)slice.getContent()));event.put("hasNext",slice.hasNext());}
                event.put("queries",new ArrayList<>(observed.queries.subList(from,observed.queries.size())));calls.add(event);return value;
            });
            observed.recording=true;new ArticlePagingExample().compare(wrapper);observed.recording=false;
            output.put("originalCalls",calls);
            List<Map<String,Object>> windows=calls.stream().filter(x->x.get("kind").equals("Window")).toList();
            List<Long> visited=windows.stream().flatMap(w->((List<Long>)w.get("ids")).stream()).toList();
            check("source-page-total600-content50",calls.get(0).get("total").equals(600L)&&((List<?>)calls.get(0).get("ids")).size()==50);
            check("source-page-first-full-requires-count",((List<Map<String,Object>>)calls.get(0).get("queries")).size()==2&&((List<Map<String,Object>>)calls.get(0).get("queries")).stream().anyMatch(q->q.get("sql").toString().contains("count(")));
            check("source-slice50-has-next-one-query",calls.get(1).get("hasNext").equals(true)&&((List<?>)calls.get(1).get("ids")).size()==50&&((List<?>)calls.get(1).get("queries")).size()==1);
            check("source-keyset12windows600unique",windows.size()==12&&visited.size()==600&&new HashSet<>(visited).size()==600);
            check("source-keyset-order-full-tuple",visited.equals(java.util.stream.LongStream.range(0,600).map(i->700049-i).boxed().toList()));
            List<Map<String,Object>> sourceQueries=calls.stream().flatMap(c->((List<Map<String,Object>>)c.get("queries")).stream()).toList();
            check("source-fifteen-sql-statements",sourceQueries.size()==15);
            check("source-slice-peeks51-returns50",((List<Map<String,Object>>)calls.get(1).get("queries")).get(0).get("resultRows").equals(51));
            check("source-window-peeks51-except-final50",java.util.stream.IntStream.range(0,12).allMatch(i->((List<Map<String,Object>>)windows.get(i).get("queries")).get(0).get("resultRows").equals(i==11?50:51)));
            check("source-statements-and-resultsets-closed",sourceQueries.stream().allMatch(q->q.get("statementClosed").equals(true)&&q.get("resultClosed").equals(true)));
            check("source-last-window-ends-loop",windows.get(11).get("last").equals(true)&&windows.get(11).get("hasNext").equals(false));
            check("source-last-returned-position700000",((Map<?,?>)((Map<?,?>)windows.get(0).get("lastReturnedPosition")).get("keys")).get("id").equals(700000L));
            check("source-subsequent-keyset-sql-has-boundary",((List<Map<String,Object>>)windows.get(1).get("queries")).get(0).get("sql").toString().contains("published_at")&&((List<Map<String,Object>>)windows.get(1).get("queries")).get(0).get("bindings").toString().contains("700000"));
            observed.queries.clear();em.clear();observed.recording=true;
            Sort order=Sort.by(Sort.Order.desc("publishedAt"),Sort.Order.desc("id"));
            Page<Article> draft=original.findByStatus("DRAFT",PageRequest.of(0,50,order));
            output.put("extraPartialPage",map("ids",ids(draft.getContent()),"total",draft.getTotalElements(),"queries",new ArrayList<>(observed.queries)));
            check("extra-short-first-page37-elides-count",draft.getTotalElements()==37&&observed.queries.size()==1&&!observed.queries.get(0).get("sql").toString().contains("count("));
            observed.queries.clear();em.clear();
            Window<Article> initial=original.findFirst50ByStatusOrderByPublishedAtDescIdDesc("PUBLISHED",ScrollPosition.offset());
            Window<Article> zero=original.findFirst50ByStatusOrderByPublishedAtDescIdDesc("PUBLISHED",ScrollPosition.offset(0));
            ScrollPosition last=initial.positionAt(initial.size()-1);
            Window<Article> next=original.findFirst50ByStatusOrderByPublishedAtDescIdDesc("PUBLISHED",last);
            output.put("extraOffsetWindows",map("initial",map("position",position(ScrollPosition.offset()),"ids",ids(initial.getContent()),"lastReturnedPosition",position(last)),"offsetZero",map("position",position(ScrollPosition.offset(0)),"ids",ids(zero.getContent())),"next",map("inputPosition",position(last),"ids",ids(next.getContent())),"queries",new ArrayList<>(observed.queries)));
            check("extra-window-offset-is-not-keyset",initial.getContent().get(0).getId()==700049L&&zero.getContent().get(0).getId()==700048L&&next.getContent().get(0).getId()==699999L);
            check("extra-offset-position-exclusive49-then50",((OffsetScrollPosition)last).getOffset()==49);
            observed.queries.clear();em.clear();
            ExtraRepository extra=repositories.getRepository(ExtraRepository.class);
            Window<Article> augmented=extra.findFirst3ByStatusOrderByPublishedAtDesc("PUBLISHED",ScrollPosition.keyset());
            output.put("extraPrimaryKeyAugmentation",map("ids",ids(augmented.getContent()),"lastPosition",position(augmented.positionAt(augmented.size()-1)),"queries",new ArrayList<>(observed.queries)));
            check("extra-missing-pk-appends-ascending-id",ids(augmented.getContent()).equals(List.of(699980L,699981L,699982L))&&observed.queries.get(0).get("sql").toString().contains("published_at desc,a1_0.id limit"));
            check("extra-keyset-appends-missing-primary-key",((KeysetScrollPosition)augmented.positionAt(augmented.size()-1)).getKeys().keySet().containsAll(List.of("id","publishedAt")));
            observed.recording=false;
        }
        // 공개된 고정 테스트키를 쓰는 보조 실험이다. 실제 서비스 인증/토큰 API가 아니다.
        String payload="v=1&status=PUBLISHED&sort=publishedAt:DESC,id:DESC&id=700000&publishedAt=2026-09-01T12:00";
        byte[] key="public-w15-fixture-only-not-a-secret".getBytes(StandardCharsets.UTF_8);
        Mac mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(key,"HmacSHA256"));
        String encoded=Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));byte[] signature=mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        String tampered=payload.replace("700000","700001");String tamperedEncoded=Base64.getUrlEncoder().withoutPadding().encodeToString(tampered.getBytes(StandardCharsets.UTF_8));
        check("extra-base64-tamper-still-decodes",new String(Base64.getUrlDecoder().decode(tamperedEncoded),StandardCharsets.UTF_8).equals(tampered));
        check("extra-hmac-tamper-fails",!MessageDigest.isEqual(signature,mac.doFinal(tampered.getBytes(StandardCharsets.UTF_8))));
        boolean signatureValid=MessageDigest.isEqual(signature,mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        check("extra-signed-payload-matching-contract-accepted",signatureValid&&validContract(payload,"1","PUBLISHED","publishedAt:DESC,id:DESC"));
        check("extra-valid-signature-wrong-filter-rejected",signatureValid&&!validContract(payload,"1","DRAFT","publishedAt:DESC,id:DESC"));
        check("extra-valid-signature-wrong-sort-rejected",signatureValid&&!validContract(payload,"1","PUBLISHED","id:ASC"));
        check("extra-valid-signature-wrong-version-rejected",signatureValid&&!validContract(payload,"2","PUBLISHED","publishedAt:DESC,id:DESC"));
        output.put("extraToken",map("payload",payload,"base64",encoded,"tamperedBase64",tamperedEncoded,"signatureHex",HexFormat.of().formatHex(signature),"algorithm","HmacSHA256","key","public fixture string in helper; no production secret","scope","manual payload/contract illustration; not source JSON API, no authorization or HTTP implementation"));
        output.put("scope","original repository and compare unchanged; added Article mapping + standalone JPA factory + observing proxy. Original consume body has no implementation. No Boot app/HTTP/DTO/Java25 execution.");output.put("checks",checks);
        JsonMapper.builder().build().writeValue(new File(System.getenv("W15_JAVA_OUTPUT")),clean(output));
    }
}
