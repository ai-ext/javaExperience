package example.deploy;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.availability.ApplicationAvailability;
import org.springframework.boot.availability.AvailabilityChangeEvent;
import org.springframework.boot.availability.ReadinessState;
import org.springframework.context.ApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.PropertySource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class DeployApplication {
    public static void main(String[] args) { SpringApplication.run(DeployApplication.class, args); }
}

// 이 Controller는 원문에 없는 자체 loopback 실험 도구다.
@RestController
class DeployController {
    private final ConfigurableEnvironment environment;
    private final ApplicationContext context;
    private final ApplicationAvailability availability;
    @Value("${demo.artifact}") private String artifact;
    @Value("${demo.greeting}") private String greeting;
    @Value("${demo.feature:false}") private boolean feature;
    @Value("${demo.business-ok:true}") private boolean businessOk;
    @Value("${demo.enter-file:}") private String entered;
    @Value("${demo.release-file:}") private String release;

    DeployController(ConfigurableEnvironment environment, ApplicationContext context, ApplicationAvailability availability) {
        this.environment = environment; this.context = context; this.availability = availability;
    }

    @GetMapping("/fixture/state")
    Map<String, Object> state() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("artifact", artifact);
        result.put("greeting", greeting);
        result.put("profiles", List.of(environment.getActiveProfiles()));
        result.put("feature", feature);
        result.put("businessOk", businessOk);
        result.put("readiness", availability.getReadinessState().name());
        result.put("shutdownTimeout", environment.getProperty("spring.lifecycle.timeout-per-shutdown-phase"));
        List<Map<String, Object>> sources = new ArrayList<>();
        for (PropertySource<?> source : environment.getPropertySources()) {
            String name = source.getName(), tier = null;
            if (name.equals("commandLineArgs")) tier = "CLI";
            else if (name.equals("systemProperties")) tier = "system";
            else if (name.equals("systemEnvironment")) tier = "environment";
            else if (name.contains("application-local.properties")) tier = "profile-local";
            else if (name.contains("application-stg.properties")) tier = "profile-stg";
            else if (name.contains("application.properties")) tier = "base-properties";
            Object value = source.getProperty("demo.greeting");
            if (tier != null && value != null) sources.add(Map.of("tier", tier, "value", value));
        }
        result.put("greetingSources", sources); // 자체 공개 demo.greeting만 보며 전체 환경값을 출력하지 않는다.
        return result;
    }

    @GetMapping("/feature")
    ResponseEntity<Map<String, Object>> feature() {
        return ResponseEntity.status(feature ? 200 : 404).body(Map.of("artifact", artifact, "released", feature));
    }

    @GetMapping("/business")
    ResponseEntity<Map<String, Object>> business() {
        return ResponseEntity.status(businessOk ? 200 : 500).body(Map.of("artifact", artifact, "business", businessOk ? "OK" : "FAILED"));
    }

    // 자체 실험에서만 호출한다. 운영 배포 제어 API 예제가 아니다.
    @PostMapping("/__fixture/readiness/{state}")
    Map<String, Object> readiness(@PathVariable String state) {
        AvailabilityChangeEvent.publish(context, state.equals("refuse") ? ReadinessState.REFUSING_TRAFFIC : ReadinessState.ACCEPTING_TRAFFIC);
        return Map.of("readiness", availability.getReadinessState().name());
    }

    @GetMapping("/slow")
    ResponseEntity<Map<String, Object>> slow() throws Exception {
        if (entered.isBlank() || release.isBlank()) return ResponseEntity.status(503).body(Map.of("fixture", "gate not configured"));
        Files.writeString(Path.of(entered), "entered\n");
        long deadline = System.nanoTime() + 30_000_000_000L;
        while (!Files.exists(Path.of(release)) && System.nanoTime() < deadline) Thread.sleep(20);
        if (!Files.exists(Path.of(release))) return ResponseEntity.status(504).body(Map.of("fixture", "gate not released"));
        return ResponseEntity.ok(Map.of("artifact", artifact, "slow", "completed"));
    }
}
