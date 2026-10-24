import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.*;

// 30초 이내에 끝나는 독립 JVM 관찰용 장치. 도메인 구현과 무관하다.
public class JvmSignals {
    private static volatile double value;
    public static void main(String[] args) throws Exception {
        System.out.println("PID=" + ProcessHandle.current().pid());
        switch (args[0]) {
            case "cpu" -> {
                long end = System.nanoTime() + 20_000_000_000L;
                while (System.nanoTime() < end) value = Math.sqrt(value + 17);
            }
            case "wait" -> HttpClient.newHttpClient().send(
                HttpRequest.newBuilder(URI.create(args[1])).timeout(Duration.ofSeconds(25)).build(),
                HttpResponse.BodyHandlers.discarding());
            case "heap" -> {
                List<byte[]> held = new ArrayList<>();
                for (int i=0; i<24; i++) { held.add(new byte[1024*1024]); Thread.sleep(500); }
                Thread.sleep(12000);
                System.out.println("held=" + held.size());
            }
            default -> throw new IllegalArgumentException("cpu | wait <URL> | heap");
        }
    }
}
