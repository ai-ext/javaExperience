package lab;

import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

// 격리된 실험 장치다. 예약·지급·재시도 정책은 구현하지 않는다.
@SpringBootApplication
@RestController
public class Probe {
    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;
    public Probe(JdbcTemplate jdbc, org.springframework.transaction.PlatformTransactionManager manager) {
        this.jdbc = jdbc;
        this.tx = new TransactionTemplate(manager);
    }
    public static void main(String[] args) { SpringApplication.run(Probe.class, args); }

    @GetMapping("/ops/smoke")
    public ResponseEntity<String> smoke() {
        String version = System.getenv().getOrDefault("OPS_VERSION", "a");
        return ResponseEntity.status(version.equals("broken") ? 503 : 200).body(version);
    }
    @GetMapping("/ops/slow")
    public String slow(@RequestParam(defaultValue="8000") long millis) throws InterruptedException {
        if (millis < 0 || millis > 30000) throw new IllegalArgumentException("0..30000ms");
        System.out.println("SLOW_ENTER " + millis);
        Thread.sleep(millis);
        System.out.println("SLOW_DONE");
        return "done";
    }
    @PostMapping("/ops/tx")
    public String marker(@RequestParam long id, @RequestParam String point) {
        if (!point.equals("beforeCommit") && !point.equals("afterCommit")) throw new IllegalArgumentException("point");
        tx.executeWithoutResult(status -> {
            jdbc.update("INSERT INTO ops_marker(id,amount) VALUES (?,100)", id);
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void beforeCommit(boolean readOnly) { if (point.equals("beforeCommit")) pause(point); }
                @Override public void afterCommit() { if (point.equals("afterCommit")) pause(point); }
            });
        });
        return "committed";
    }
    private void pause(String point) {
        Path release = Path.of("/control/" + point + ".release");
        try {
            Files.writeString(Path.of("/control/" + point + ".entered"), point);
            System.out.println("GATE_ENTER " + point);
            long deadline = System.nanoTime() + 60_000_000_000L;
            while (!Files.exists(release)) {
                if (System.nanoTime() > deadline) throw new IllegalStateException("gate timeout");
                Thread.sleep(50);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        } catch (java.io.IOException e) { throw new IllegalStateException(e); }
    }
}
