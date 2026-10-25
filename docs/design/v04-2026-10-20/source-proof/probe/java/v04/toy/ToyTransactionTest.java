package v04.toy;

import javax.sql.DataSource;
import jakarta.persistence.*;
import org.hibernate.Hibernate;
import org.hibernate.LazyInitializationException;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.context.transaction.TestTransaction;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.*;
import org.springframework.transaction.support.TransactionTemplate;
import v04.support.Proof;
import static org.junit.jupiter.api.Assertions.*;

@SpringJUnitConfig(ToyConfig.class) @Transactional @TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ToyTransactionTest {
 @Autowired DataSource ds;
 @Autowired EntityManagerFactory emf;
 @Autowired PlatformTransactionManager tm;
 @Autowired ToyConfig.ToyService service;
 @Autowired ToyConfig.RowListener listener;
 @Autowired ApplicationEventPublisher publisher;
 @PersistenceContext EntityManager em;
 JdbcTemplate jdbc;SessionFactory sf;
 @BeforeAll void seedOutsideTestTransaction(){
  jdbc=new JdbcTemplate(ds);sf=emf.unwrap(SessionFactory.class);jdbc.execute("CREATE TABLE event_probe(id INT PRIMARY KEY)");
  boolean testTx=TestTransaction.isActive();new TransactionTemplate(tm).executeWithoutResult(s->{LearnOrder order=new LearnOrder(1);order.add(101);em.persist(order);});
  Proof.check("toy-beforeall-seed-is-not-test-managed-tx",!testTx,Proof.map("beforeAllTestTransactionActive",testTx,"committedSeedOrder",1,"committedSeedLine",101));
 }
 @BeforeEach void resetObserver(){listener.calls.clear();sf.getStatistics().clear();}
 @Test void outerTestTransactionKeepsLazyOpen(){
  LearnOrder order=service.getEntity(1);boolean before=Hibernate.isInitialized(order.getLines());int n=order.getLines().size();long statements=sf.getStatistics().getPrepareStatementCount();
  Proof.check("toy-outer-test-tx-hides-lazy-boundary",TestTransaction.isActive()&&!before&&n==1&&statements==2,Proof.map("testTransactionActive",TestTransaction.isActive(),"initializedBeforeSize",before,"lines",n,"hibernatePreparedStatements",statements,"scope","additional H2 model/service, no DTO/HTTP"));
 }
 @Test @Transactional(propagation=Propagation.NOT_SUPPORTED)
 void serviceAloneClosesLazyContext(){
  LearnOrder order=service.getEntity(1);boolean before=Hibernate.isInitialized(order.getLines());assertThrows(LazyInitializationException.class,()->order.getLines().size());
  Proof.check("toy-no-outer-test-tx-lazy-exception",!TestTransaction.isActive()&&!before&&sf.getStatistics().getPrepareStatementCount()==1,Proof.map("testTransactionActive",TestTransaction.isActive(),"initializedBeforeSize",before,"error","LazyInitializationException","hibernatePreparedStatements",sf.getStatistics().getPrepareStatementCount()));
 }
 @Test void noFlushRollbackNeverChecksDeferredConstraint(){
  em.persist(new DeferredProbe(81,-1));long statements=sf.getStatistics().getPrepareStatementCount();TestTransaction.end();int rows=jdbc.queryForObject("SELECT COUNT(*)FROM deferred_probe WHERE id=81",Integer.class);
  Proof.check("toy-no-flush-rollback-has-zero-insert-statements",statements==0&&rows==0,Proof.map("negativeAmount",-1,"hibernatePreparedBeforeRollback",statements,"rowsAfterRollback",rows,"scope","passing persist call alone did not test DB CHECK"));
 }
 @Test void explicitFlushExposesAssignedIdConstraint(){
  em.persist(new DeferredProbe(82,-1));long before=sf.getStatistics().getPrepareStatementCount();PersistenceException error=assertThrows(PersistenceException.class,()->em.flush());long after=sf.getStatistics().getPrepareStatementCount();var details=Proof.sqlError(error);TestTransaction.end();
  Proof.check("toy-assigned-id-check-fails-at-flush",before==0&&after==1&&details.get("code").equals(23513),Proof.map("beforeFlushHibernatePrepared",before,"afterFlushHibernatePrepared",after,"error",details,"rowsAfterRollback",jdbc.queryForObject("SELECT COUNT(*)FROM deferred_probe WHERE id=82",Integer.class)));
 }
 @Test void identityNeedsInsertDuringPersist(){
  PersistenceException error=assertThrows(PersistenceException.class,()->em.persist(new IdentityProbe(-1)));long statements=sf.getStatistics().getPrepareStatementCount();var details=Proof.sqlError(error);TestTransaction.end();
  Proof.check("toy-identity-check-fails-during-persist",statements==1&&details.get("code").equals(23513),Proof.map("hibernatePreparedAtPersist",statements,"error",details,"rowsAfterRollback",jdbc.queryForObject("SELECT COUNT(*)FROM identity_probe",Integer.class)));
 }
 @Test void rollbackDoesNotInvokeAfterCommit(){
  jdbc.update("INSERT INTO event_probe VALUES(71)");publisher.publishEvent(new ToyConfig.Created(71));int before=listener.calls.size();TestTransaction.end();int rows=jdbc.queryForObject("SELECT COUNT(*)FROM event_probe WHERE id=71",Integer.class);
  Proof.check("toy-default-test-rollback-no-aftercommit",before==0&&listener.calls.isEmpty()&&rows==0,Proof.map("callsBeforeEnd",before,"callsAfterRollback",listener.calls.size(),"rowsAfterRollback",rows));
 }
 @Test void flagForCommitWaitsForEndAndListenerObservesCommit(){
  jdbc.update("INSERT INTO event_probe VALUES(72)");publisher.publishEvent(new ToyConfig.Created(72));TestTransaction.flagForCommit();int flaggedCalls=listener.calls.size();boolean active=TestTransaction.isActive();TestTransaction.end();int rows=jdbc.queryForObject("SELECT COUNT(*)FROM event_probe WHERE id=72",Integer.class);
  Proof.check("toy-flagforcommit-alone-does-not-fire-listener",active&&flaggedCalls==0,Proof.map("activeAfterFlagBeforeEnd",active,"callsAfterFlagBeforeEnd",flaggedCalls));
  Proof.check("toy-end-commit-fires-once-and-observes-committed-row",listener.calls.size()==1&&rows==1&&listener.calls.get(0).get("independentConnectionRows").equals(1),Proof.map("calls",listener.calls,"rowsAfterEnd",rows));
  int cleaned=jdbc.update("DELETE FROM event_probe WHERE id=72");Proof.check("toy-committed-test-row-explicit-cleanup",cleaned==1,Proof.map("deletedRows",cleaned,"remainingRows",jdbc.queryForObject("SELECT COUNT(*)FROM event_probe WHERE id=72",Integer.class)));
 }
 @Test void requiresNewEscapesOuterTestRollback(){
  jdbc.update("INSERT INTO event_probe VALUES(74)");var inner=new TransactionTemplate(tm);inner.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);inner.executeWithoutResult(s->jdbc.update("INSERT INTO event_probe VALUES(73)"));TestTransaction.end();
  int outerRows=jdbc.queryForObject("SELECT COUNT(*)FROM event_probe WHERE id=74",Integer.class),innerRows=jdbc.queryForObject("SELECT COUNT(*)FROM event_probe WHERE id=73",Integer.class);
  Proof.check("toy-requiresnew-commit-survives-test-rollback",outerRows==0&&innerRows==1,Proof.map("outer74AfterRollback",outerRows,"inner73AfterOuterRollback",innerRows));jdbc.update("DELETE FROM event_probe WHERE id=73");
 }
}
