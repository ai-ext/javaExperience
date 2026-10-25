package v04.toy;

import javax.sql.DataSource;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.orm.jpa.*;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.annotation.*;
import org.springframework.transaction.event.*;
import java.util.*;
import java.sql.*;
import v04.support.Proof;

@Configuration @EnableTransactionManagement(proxyTargetClass=true)
public class ToyConfig {
 @Bean DataSource dataSource(){return new DriverManagerDataSource("jdbc:h2:mem:v04_tx;DB_CLOSE_DELAY=-1","sa","");}
 @Bean LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource ds){
  var bean=new LocalContainerEntityManagerFactoryBean();bean.setDataSource(ds);bean.setPackagesToScan("v04.toy");bean.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
  bean.setJpaPropertyMap(Map.of("hibernate.hbm2ddl.auto","create-drop","hibernate.generate_statistics","true","hibernate.cache.use_second_level_cache","false","hibernate.cache.use_query_cache","false"));return bean;
 }
 @Bean JpaTransactionManager transactionManager(EntityManagerFactory emf){return new JpaTransactionManager(emf);}
 @Bean ToyService toyService(EntityManagerFactory emf){return new ToyService(SharedEntityManagerCreator.createSharedEntityManager(emf));}
 @Bean RowListener rowListener(DataSource ds){return new RowListener(ds);}
 public static class ToyService {
  private final EntityManager em;
  ToyService(EntityManager em){this.em=em;}
  @Transactional(readOnly=true) public LearnOrder getEntity(long id){return em.find(LearnOrder.class,id);}
 }
 public record Created(int id){}
 public static class RowListener {
  final DataSource ds;final List<Map<String,Object>> calls=new ArrayList<>();
  RowListener(DataSource ds){this.ds=ds;}
  @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
  public void afterCommit(Created event)throws SQLException{
   // Spring 바인딩 연결과 별도 connection에서 실제 commit된 행을 관찰한다.
   try(Connection c=ds.getConnection();PreparedStatement p=c.prepareStatement("SELECT COUNT(*)FROM event_probe WHERE id=?")){
    p.setInt(1,event.id());try(ResultSet r=p.executeQuery()){r.next();calls.add(Proof.map("id",event.id(),"independentConnectionRows",r.getInt(1)));}
   }
  }
}
}
