package v04.http;

import javax.sql.DataSource;
import java.net.InetAddress;
import java.util.Map;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration;
import org.springframework.boot.data.jpa.autoconfigure.DataJpaRepositoriesAutoConfiguration;
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.*;
import org.springframework.test.context.transaction.TestTransaction;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.*;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.bind.annotation.*;
import v04.support.Proof;

/** 원문에 없는 JDBC/H2 전용 HTTP toy app. 실제 상품/주문 API 구현이 아니다. */
@SpringBootConfiguration
@EnableAutoConfiguration(exclude={HibernateJpaAutoConfiguration.class,DataJpaRepositoriesAutoConfiguration.class})
@EnableTransactionManagement(proxyTargetClass=true)
public class HttpApp {
 @Bean TomcatServletWebServerFactory servletWebServerFactory()throws Exception{var f=new TomcatServletWebServerFactory(0);f.setAddress(InetAddress.getByName("127.0.0.1"));return f;}
 @Bean DataSource dataSource(){return new DriverManagerDataSource("jdbc:h2:mem:v04_http;DB_CLOSE_DELAY=-1","sa","");}
 @Bean JdbcTemplate jdbcTemplate(DataSource ds){return new JdbcTemplate(ds);}
 @Bean PlatformTransactionManager transactionManager(DataSource ds){return new DataSourceTransactionManager(ds);}
 @Bean InitializingBean privateSchema(JdbcTemplate jdbc){return()->jdbc.execute("CREATE TABLE http_probe(id INT PRIMARY KEY)");}
 @Bean ProbeService probeService(JdbcTemplate jdbc){return new ProbeService(jdbc);}
 public static class ProbeService {
  final JdbcTemplate jdbc;
  ProbeService(JdbcTemplate jdbc){this.jdbc=jdbc;}
  @Transactional public Map<String,Object> write(int id,int marker){
   int seen=jdbc.queryForObject("SELECT COUNT(*)FROM http_probe WHERE id=?",Integer.class,marker);jdbc.update("INSERT INTO http_probe VALUES(?)",id);
   return Proof.map("id",id,"markerSeen",seen,"applicationTxActive",TransactionSynchronizationManager.isActualTransactionActive(),"testManagedTxActive",TestTransaction.isActive(),"threadId",Thread.currentThread().threadId());
  }
 }
 @RestController public static class ProbeController {
  final ProbeService service;
  ProbeController(ProbeService service){this.service=service;}
  @PostMapping("/v04/probe") public ResponseEntity<Map<String,Object>> create(@RequestParam("id")int id,@RequestParam("marker")int marker){return ResponseEntity.status(201).body(service.write(id,marker));}
 }
}
