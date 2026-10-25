package example.build;

import java.io.InputStream;
import java.util.Properties;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class BuildPolicyTest {
    @Test void policyReady() {
        assertEquals("READY", BuildPolicy.state());
    }

    @Test void classpathResourceExists() throws Exception {
        try (InputStream stream = getClass().getResourceAsStream("/lesson.properties")) {
            assertNotNull(stream);
            Properties properties = new Properties();
            properties.load(stream);
            assertNotNull(properties.getProperty("lesson.message"));
        }
    }
}
