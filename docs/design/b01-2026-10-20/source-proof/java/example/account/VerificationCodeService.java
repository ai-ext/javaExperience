package example.account;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import org.springframework.stereotype.Service;

interface VerificationSender { void sendEmail(String address, String code); void sendSms(String e164, String code); }
interface VerificationChallengeStore {
    void enforceCooldownAndDailyLimit(long id, String channel, Instant now);
    void replaceActive(long id, String purpose, String channel, String mac, Instant now, Instant expires);
}

@Service
class VerificationCodeService {
    private final SecureRandom random; private final Clock clock;
    private final VerificationChallengeStore store; private final CodeMac codeMac;
    private final VerificationSender sender;
    VerificationCodeService(SecureRandom r, Clock c, VerificationChallengeStore s,
                            CodeMac m, VerificationSender out) {
        random=r; clock=c; store=s; codeMac=m; sender=out;
    }
    void issue(long memberId, String purpose, String channel, String target) {
        Instant now=clock.instant(); store.enforceCooldownAndDailyLimit(memberId,channel,now);
        String code=String.format(Locale.ROOT,"%06d",random.nextInt(1_000_000));
        store.replaceActive(memberId,purpose,channel,codeMac.mac(code),now,now.plus(Duration.ofMinutes(5)));
        if (channel.equals("EMAIL")) sender.sendEmail(target,code); else sender.sendSms(target,code);
    }
}
