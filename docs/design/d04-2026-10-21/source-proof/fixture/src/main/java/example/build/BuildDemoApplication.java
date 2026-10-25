package example.build;

import java.io.InputStream;
import java.util.Properties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BuildDemoApplication {
    public static void main(String[] args) throws Exception {
        // HTTP 서버 없이 이 추가 실험의 JAR과 리소스만 관찰한다.
        try (var context = SpringApplication.run(BuildDemoApplication.class,
                "--spring.main.web-application-type=none", "--spring.main.banner-mode=off", "--logging.level.root=OFF");
             InputStream stream = BuildDemoApplication.class.getResourceAsStream("/lesson.properties")) {
            Properties properties = new Properties();
            properties.load(stream);
            System.out.println("D04_RESOURCE=" + properties.getProperty("lesson.message"));
            System.out.println("D04_POLICY=" + BuildPolicy.state());
        }
    }
}
