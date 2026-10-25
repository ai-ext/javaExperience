package example.account;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

@Component
public class CodeMac {
    private final byte[] key;
    public CodeMac(@Value("${app.verification.pepper}") String pepper) { key=pepper.getBytes(StandardCharsets.UTF_8); }
    public String mac(String code) {
        try {
            Mac mac=Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(key,"HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(code.getBytes(StandardCharsets.US_ASCII)));
        } catch (java.security.GeneralSecurityException e) {
            throw new IllegalStateException("HMAC-SHA-256 unavailable", e);
        }
    }
}
