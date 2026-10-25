package com.example.practice.product;

import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.context.jdbc.SqlConfig;
import org.springframework.test.context.transaction.TestTransaction;
import com.example.practice.ProofJpaApp;
import v04.support.Proof;
import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties={"spring.jpa.hibernate.ddl-auto=validate","spring.sql.init.mode=never","spring.jpa.show-sql=false","logging.level.root=ERROR","spring.datasource.hikari.maximum-pool-size=2","spring.datasource.hikari.minimum-idle=0"})
@ContextConfiguration(classes=ProofJpaApp.class)
@AutoConfigureTestDatabase(replace=AutoConfigureTestDatabase.Replace.NONE)
class SqlFixtureTest extends NativeProperties {
 @Autowired ProductRepository productRepository;
 @Autowired DataSource ds;
 @Test @Sql("/sql/product-fixture.sql")
 void inferredJoinsTestRollback(){
  assertThat(productRepository.findByIdAndDeletedAtIsNull(9001L)).isPresent();
  boolean active=TestTransaction.isActive();TestTransaction.end();
  JdbcTemplate jdbc=new JdbcTemplate(ds);int product=jdbc.queryForObject("SELECT COUNT(*)FROM product WHERE id=9001",Integer.class),category=jdbc.queryForObject("SELECT COUNT(*)FROM category WHERE id=9001",Integer.class);
  Proof.check("sql-inferred-fixture-rolled-back",active&&product==0&&category==0,Proof.map("activeBeforeEnd",active,"productAfterRollback",product,"categoryAfterRollback",category));
 }
 @Test @Sql(scripts="/sql/product-fixture.sql",config=@SqlConfig(transactionMode=SqlConfig.TransactionMode.ISOLATED))
 void isolatedCommitNeedsCleanup(){
  assertThat(productRepository.findByIdAndDeletedAtIsNull(9001L)).isPresent();TestTransaction.end();JdbcTemplate jdbc=new JdbcTemplate(ds);
  int product=jdbc.queryForObject("SELECT COUNT(*)FROM product WHERE id=9001",Integer.class),category=jdbc.queryForObject("SELECT COUNT(*)FROM category WHERE id=9001",Integer.class);
  Proof.check("sql-isolated-fixture-survives-test-rollback",product==1&&category==1,Proof.map("productAfterTestRollback",product,"categoryAfterTestRollback",category));
  int deletedProduct=jdbc.update("DELETE FROM product WHERE id=9001"),deletedCategory=jdbc.update("DELETE FROM category WHERE id=9001");
  Proof.check("sql-isolated-explicit-child-first-cleanup",deletedProduct==1&&deletedCategory==1&&jdbc.queryForObject("SELECT COUNT(*)FROM product WHERE id=9001",Integer.class)==0,Proof.map("deletedProduct",deletedProduct,"deletedCategory",deletedCategory,"productAfterCleanup",jdbc.queryForObject("SELECT COUNT(*)FROM product WHERE id=9001",Integer.class)));
 }
}
