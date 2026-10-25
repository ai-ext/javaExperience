package example.account;

import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import tools.jackson.databind.json.JsonMapper;

/** 원문 서비스/CodeMac은 그대로 두고 추가 메모리 관찰자를 주입한다. */
public class B01Proof {
 static final JsonMapper JSON=JsonMapper.builder().build();
 static final Map<String,Object> facts=new TreeMap<>();
 static final List<String> checks=new ArrayList<>();
 static final Instant NOW=Instant.parse("2026-10-20T00:00:00Z");
 static final Clock CLOCK=Clock.fixed(NOW,ZoneOffset.UTC);
 static Map<String,Object> map(Object... pairs){var m=new LinkedHashMap<String,Object>();for(int i=0;i<pairs.length;i+=2)m.put((String)pairs[i],pairs[i+1]);return m;}
 static void check(String id,boolean ok,Map<String,Object> value){if(!ok)throw new AssertionError(id);checks.add(id);facts.put(id,JSON.convertValue(value,Map.class));System.out.println("PASS "+id);}
 static class DemoRandom extends SecureRandom {
  final int value;DemoRandom(int n){value=n;}
  @Override public int nextInt(int bound){if(value<0||value>=bound)throw new AssertionError("demo range");return value;}
  @Override public void nextBytes(byte[] bytes){Arrays.fill(bytes,(byte)0x1a);}
 }
 static class Store implements VerificationChallengeStore {
  final List<String> trace;String mac;Instant issued,expires;int writes;boolean reject;
  Store(List<String> events){trace=events;}
  public void enforceCooldownAndDailyLimit(long id,String channel,Instant now){trace.add("limit");if(reject)throw new IllegalStateException("demo cooldown");}
  public void replaceActive(long id,String purpose,String channel,String value,Instant now,Instant until){trace.add("replace");mac=value;issued=now;expires=until;writes++;}
 }
 static class Sender implements VerificationSender {
  final List<String> trace;String lastCode;int emails,sms;boolean fail;
  Sender(List<String> events){trace=events;}
  public void sendEmail(String address,String code){trace.add("email");lastCode=code;emails++;if(fail)throw new IllegalStateException("demo sender failure");}
  public void sendSms(String address,String code){trace.add("sms");lastCode=code;sms++;}
 }
 public static void main(String[] args)throws Exception {
  // 공개 재현용 테스트 키이며 실제 pepper/계정/토큰을 사용하지 않는다.
  var mac=new CodeMac("public-b01-demo-key-not-a-production-secret");
  String known=new CodeMac("\u000b".repeat(20)).mac("Hi There");
  check("source-codemac-known-vector",known.equals("b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7"),map("algorithm","HmacSHA256","hexCharacters",known.length(),"knownVectorMatches",true,"scope","public fixed test input; no production key"));
  byte[] a=HexFormat.of().parseHex(mac.mac("000042")),b=HexFormat.of().parseHex(mac.mac("000042")),c=HexFormat.of().parseHex(mac.mac("000043"));
  check("extra-mac-byte-comparison",MessageDigest.isEqual(a,b)&&!MessageDigest.isEqual(a,c),map("equalInputMatches",true,"changedInputMatches",false,"digestBytes",a.length,"scope","extra MessageDigest.isEqual call; timing not measured; original verifier absent"));
  var trace=new ArrayList<String>();var store=new Store(trace);var sender=new Sender(trace);
  new VerificationCodeService(new DemoRandom(42),CLOCK,store,mac,sender).issue(90001,"SIGNUP","EMAIL","learner@example.invalid");
  check("source-issue-fixed-clock-memory-email",trace.equals(List.of("limit","replace","email"))&&store.issued.equals(NOW)&&store.expires.equals(NOW.plusSeconds(300))&&sender.lastCode.equals("000042")&&store.mac.equals(mac.mac(sender.lastCode)),map("order",trace,"codeDigits",sender.lastCode.length(),"leadingZeroPreserved",sender.lastCode.startsWith("0"),"storedMacCharacters",store.mac.length(),"issuedAt",store.issued.toString(),"expiresAt",store.expires.toString(),"ttlSeconds",300,"emailStubCalls",sender.emails,"scope","direct new source service; extra memory store/sender; not DB/Spring proxy/email delivery"));
  trace.clear();new VerificationCodeService(new DemoRandom(999999),CLOCK,store,mac,sender).issue(90001,"PHONE_CONFIRM","SMS","+12025550123");
  check("source-issue-memory-sms-six-digits",trace.equals(List.of("limit","replace","sms"))&&sender.lastCode.length()==6&&sender.lastCode.chars().allMatch(Character::isDigit)&&sender.sms==1,map("order",trace,"codeDigits",6,"digitsOnly",true,"smsStubCalls",1,"scope","SMS branch only; no provider/network/delivery"));
  trace.clear();store.reject=true;int before=store.writes;boolean rejected=false;
  try{new VerificationCodeService(new DemoRandom(42),CLOCK,store,mac,sender).issue(90001,"SIGNUP","EMAIL","learner@example.invalid");}catch(IllegalStateException e){rejected=true;}
  check("source-limit-stub-stops-before-replace",rejected&&trace.equals(List.of("limit"))&&store.writes==before,map("order",trace,"rejectedByStub",true,"newStoreWrites",store.writes-before,"scope","extra limit stub; real cooldown/day/IP policy absent"));
  trace.clear();store.reject=false;sender.fail=true;before=store.writes;boolean sendFailed=false;
  try{new VerificationCodeService(new DemoRandom(42),CLOCK,store,mac,sender).issue(90001,"SIGNUP","EMAIL","learner@example.invalid");}catch(IllegalStateException e){sendFailed=true;}
  check("source-sender-failure-after-memory-store-write",sendFailed&&trace.equals(List.of("limit","replace","email"))&&store.writes==before+1,map("order",trace,"senderFailure",true,"memoryStoreWrites",1,"scope","added memory store not DB commit; source outbox/retry implementation absent"));
  var reset=new ResetFragmentAdapter();var resetObservation=reset.issue(new DemoRandom(0),CLOCK);
  check("source-reset-fragment-extra-wrapper",resetObservation.rawBytes()==32&&resetObservation.urlCharacters()==43&&resetObservation.digestBytes()==32&&resetObservation.digestMatches()&&resetObservation.expiresAt().equals(NOW.plusSeconds(900))&&resetObservation.mailStubCalls()==1,map("randomInputBytes",32,"base64urlCharacters",43,"paddingPresent",false,"storedDigestBytes",32,"sentValueHashesToStoredDigest",true,"expiresAt",resetObservation.expiresAt().toString(),"ttlSeconds",900,"mailStubCalls",1,"scope","original fragment inside extra wrapper; deterministic demo bytes, no actual link or mail"));
  var encoder=PasswordEncoderFactories.createDelegatingPasswordEncoder();String encoded=encoder.encode("public-demo-password-not-a-real-account");
  check("extra-password-encoder-delegating-matches",encoded.startsWith("{bcrypt}")&&encoder.matches("public-demo-password-not-a-real-account",encoded)&&!encoder.matches("public-demo-wrong-password",encoded),map("factory","PasswordEncoderFactories.createDelegatingPasswordEncoder","securityVersion",PasswordEncoderFactories.class.getPackage().getImplementationVersion(),"storedPrefix","{bcrypt}","correctMatches",true,"wrongMatches",false,"scope","extra standalone encoder call; no login handler/HTTP/cost benchmark"));
  // 추가 version 값 비교일 뿐 실제 JWT 검증 필터가 아니다.
  int issuedVersion=0,currentVersion=1;
  check("extra-version-comparison-is-not-jwt-revocation",issuedVersion!=currentVersion,map("issuedVersion",issuedVersion,"currentVersion",currentVersion,"extraVersionCheckAccepts",false,"scope","extra integer comparison; no JWT parse/signature/filter/session authentication"));
  trace.clear();
  check("observer-record-time-deep-snapshot",((List<?>)((Map<?,?>)facts.get("source-issue-fixed-clock-memory-email")).get("order")).size()==3&&trace.isEmpty(),map("recordTimeOrderSize",3,"sourceTraceAfterClear",trace.size()));
  var result=map("runtime",map("javaVersion",System.getProperty("java.version"),"springVersion",org.springframework.core.SpringVersion.getVersion(),"securityCryptoVersion",PasswordEncoderFactories.class.getPackage().getImplementationVersion()),"checks",checks.stream().sorted().toList(),"facts",facts);
  Path target=Path.of(System.getenv().getOrDefault("B01_JAVA_OUTPUT","../java-execution.json"));Files.writeString(target,JSON.writerWithDefaultPrettyPrinter().writeValueAsString(result)+"\n");
 }
}
