package com.example.practice.product;

import javax.sql.DataSource;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import com.example.practice.ProofJpaApp;
import v04.support.Proof;

// 모든 교체 사례는 ddl-auto=none으로 실제 연결을 확인하기 전 DDL을 실행하지 않는다.
@DataJpaTest(properties={"spring.jpa.hibernate.ddl-auto=none","spring.sql.init.mode=never","spring.jpa.show-sql=false","logging.level.root=ERROR","spring.datasource.hikari.maximum-pool-size=2","spring.datasource.hikari.minimum-idle=0"})
@ContextConfiguration(classes=ProofJpaApp.class)
@TestPropertySource(properties={"spring.datasource.url=${V04_DB_URL}","spring.datasource.username=v04_probe","spring.datasource.password=${V04_DB_PASSWORD}"})
class DefaultStaticReplaceTest {
 @Autowired DataSource ds;
 @Test void staticUrlDefaultNonTestUsesH2()throws Exception{
  Object value=AutoConfigureTestDatabase.class.getDeclaredMethod("replace").getDefaultValue();Map<String,Object> facts=Proof.engine(ds);facts.put("annotationDefault",value.toString());
  Proof.check("replace-default-static-is-h2",value.toString().equals("NON_TEST")&&facts.get("engine").equals("H2"),facts);
 }
}
@DataJpaTest(properties={"spring.jpa.hibernate.ddl-auto=none","spring.sql.init.mode=never","spring.jpa.show-sql=false","logging.level.root=ERROR","spring.datasource.hikari.maximum-pool-size=2","spring.datasource.hikari.minimum-idle=0"})
@ContextConfiguration(classes=ProofJpaApp.class)
class DefaultDynamicReplaceTest extends NativeProperties {
 @Autowired DataSource ds;
 @Test void dynamicUrlDefaultNonTestKeepsMySQL(){Proof.guard(ds);Map<String,Object> facts=Proof.engine(ds);facts.put("origin","DynamicPropertySource URL, not Testcontainers");Proof.check("replace-default-dynamic-keeps-mysql",facts.get("engine").equals("MySQL"),facts);}
}
@DataJpaTest(properties={"spring.jpa.hibernate.ddl-auto=none","spring.sql.init.mode=never","spring.jpa.show-sql=false","logging.level.root=ERROR","spring.datasource.hikari.maximum-pool-size=2","spring.datasource.hikari.minimum-idle=0"})
@ContextConfiguration(classes=ProofJpaApp.class)
@AutoConfigureTestDatabase(replace=AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties={"spring.datasource.url=${V04_DB_URL}","spring.datasource.username=v04_probe","spring.datasource.password=${V04_DB_PASSWORD}"})
class ExplicitNoneReplaceTest {
 @Autowired DataSource ds;
 @Test void explicitNoneKeepsStaticMySQL(){Proof.guard(ds);Map<String,Object> facts=Proof.engine(ds);facts.put("replace","NONE");Proof.check("replace-none-static-keeps-mysql",facts.get("engine").equals("MySQL"),facts);}
}
@DataJpaTest(properties={"spring.jpa.hibernate.ddl-auto=none","spring.sql.init.mode=never","spring.jpa.show-sql=false","logging.level.root=ERROR","spring.datasource.hikari.maximum-pool-size=2","spring.datasource.hikari.minimum-idle=0"})
@ContextConfiguration(classes=ProofJpaApp.class)
@AutoConfigureTestDatabase(replace=AutoConfigureTestDatabase.Replace.ANY)
class ExplicitAnyReplaceTest extends NativeProperties {
 @Autowired DataSource ds;
 @Test void explicitAnyReplacesDynamicWithH2(){Map<String,Object> facts=Proof.engine(ds);facts.put("replace","ANY");Proof.check("replace-any-dynamic-is-h2",facts.get("engine").equals("H2"),facts);}
}
