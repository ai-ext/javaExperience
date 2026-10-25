package example.shop;

import java.util.Optional;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class ShopApplication {
  public static void main(String[] args) { SpringApplication.run(ShopApplication.class, args); }
  @Bean AuditorAware<String> auditorAware() { return () -> Optional.of("local-user"); }
}
