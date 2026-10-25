package example.account;
import java.util.*;
import java.security.*;
import java.time.*;
import java.nio.charset.StandardCharsets;
/** 원문 reset 부분코드를 삽입하는 추가 메모리 adapter다. */
class ResetFragmentAdapter {
 record Observation(int rawBytes,int urlCharacters,int digestBytes,boolean digestMatches,Instant expiresAt,int mailStubCalls){}
 static class ResetStore {byte[] digest;Instant expires;void replacePrevious(long id,byte[] value,Instant end){digest=value.clone();expires=end;}}
 static class Mailer {String token;int calls;void sendResetLink(String address,String value){token=value;calls++;}}
 Observation issue(SecureRandom secureRandom,Clock clock)throws Exception {
  long memberId=90001;String verifiedAddress="learner@example.invalid";
  ResetStore resetStore=new ResetStore();Mailer mailer=new Mailer();
byte[] bytes = new byte[32];
secureRandom.nextBytes(bytes);
String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
byte[] digest = MessageDigest.getInstance("SHA-256")
        .digest(rawToken.getBytes(StandardCharsets.US_ASCII));
resetStore.replacePrevious(memberId, digest, clock.instant().plus(Duration.ofMinutes(15)));
mailer.sendResetLink(verifiedAddress, rawToken); // rawToken은 URL 조립 직후 폐기, 로그 금지

  return new Observation(bytes.length,rawToken.length(),resetStore.digest.length,
   MessageDigest.isEqual(resetStore.digest,MessageDigest.getInstance("SHA-256").digest(mailer.token.getBytes(StandardCharsets.US_ASCII))),resetStore.expires,mailer.calls);
 }
}
