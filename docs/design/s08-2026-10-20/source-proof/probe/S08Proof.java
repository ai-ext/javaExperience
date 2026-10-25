import java.io.IOException;
import java.lang.reflect.*;
import java.nio.file.*;
import java.sql.*;
import java.util.*;
import javax.sql.DataSource;
import org.h2.jdbcx.JdbcDataSource;
import org.springframework.aop.support.AopUtils;
import org.springframework.context.annotation.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.*;
import org.springframework.transaction.*;
import org.springframework.transaction.annotation.*;
import org.springframework.transaction.support.*;
import tools.jackson.databind.json.JsonMapper;

// 원문 세 클래스에는 손대지 않고 별도 저장소·Spring 컨텍스트를 붙인 실험이다.
public class S08Proof {
    static final Map<String,Object> facts = new LinkedHashMap<>();
    static final List<Map<String,Object>> timeline = new ArrayList<>();
    static final List<String> checks = new ArrayList<>();
    static TrackedSource ds;
    static JdbcTemplate jdbc;
    static boolean failDebit, falseImport, failGateway;
    static final List<Long> notifications = new ArrayList<>();
    static Map<String,Object> row(Object... pairs) {
        Map<String,Object> m = new LinkedHashMap<>();
        for(int i=0;i<pairs.length;i+=2)m.put((String)pairs[i],pairs[i+1]);
        return m;
    }
    static void check(String name, boolean value) {
        if(!value)throw new AssertionError(name);
        checks.add(name);System.out.println("PASS "+name);
    }
    static List<Long> balances(boolean observer) throws SQLException {
        if(!observer)return jdbc.query("select cents from account order by id",(rs,n)->rs.getLong(1));
        try(Connection c=ds.raw.getConnection();Statement s=c.createStatement();ResultSet r=s.executeQuery("select cents from account order by id")) {
            List<Long> out=new ArrayList<>();while(r.next())out.add(r.getLong(1));return out;
        }
    }
    static void snap(String label) {
        Object bound=TransactionSynchronizationManager.getResource(ds);
        Integer connection=null;
        if(bound instanceof ConnectionHolder h)connection=ds.ids.get(h.getConnection());
        timeline.add(row("label",label,"active",TransactionSynchronizationManager.isActualTransactionActive(),
            "synchronization",TransactionSynchronizationManager.isSynchronizationActive(),
            "readOnly",TransactionSynchronizationManager.isCurrentTransactionReadOnly(),
            "isolation",TransactionSynchronizationManager.getCurrentTransactionIsolationLevel(),"connection",connection));
    }
    static void reset() {
        jdbc.update("delete from ledger");jdbc.update("delete from account");
        jdbc.update("insert into account(id,cents) values(1,1000),(2,100)");
        timeline.clear();ds.actions.clear();notifications.clear();failDebit=false;falseImport=false;failGateway=false;
    }
    static void capture(String key) throws SQLException {
        facts.put(key,row("timeline",new ArrayList<>(timeline),"resourceActions",new ArrayList<>(ds.actions),
            "observerBalances",balances(true),"ledger",jdbc.queryForList("select label from ledger order by label",String.class),
            "gatewayInvocations",new ArrayList<>(notifications)));
    }
    static boolean sameConnections(){return timeline.stream().filter(r->r.get("connection")!=null).map(r->r.get("connection")).distinct().count()==1;}
    static boolean action(String name,Object argument){return ds.actions.stream().anyMatch(r->r.get("method").equals(name)&&Objects.equals(r.get("argument"),argument));}
    static class TrackedSource extends AbstractDataSource {
        final JdbcDataSource raw=new JdbcDataSource();
        final IdentityHashMap<Connection,Integer> ids=new IdentityHashMap<>();
        final List<Map<String,Object>> actions=new ArrayList<>();int serial=0;
        TrackedSource(){raw.setURL("jdbc:h2:mem:s08_proof;DB_CLOSE_DELAY=-1");raw.setUser("sa");}
        public Connection getConnection() throws SQLException {return wrap(raw.getConnection());}
        public Connection getConnection(String u,String p)throws SQLException{return wrap(raw.getConnection(u,p));}
        Connection wrap(Connection target) {
            int id=++serial;
            Connection proxy=(Connection)Proxy.newProxyInstance(getClass().getClassLoader(),new Class[]{Connection.class},(p,m,a)->{
                try {
                    Object result=m.invoke(target,a);
                    if(Set.of("setAutoCommit","commit","rollback","setReadOnly","setTransactionIsolation","setSavepoint","releaseSavepoint","close").contains(m.getName()))
                        actions.add(row("connection",id,"method",m.getName(),"argument",a==null?null:(a[0] instanceof Savepoint?"savepoint":a[0])));
                    return result;
                }catch(InvocationTargetException e){throw e.getCause();}
            });ids.put(proxy,id);return proxy;
        }
    }
    @Configuration(proxyBeanMethods=false)
    @EnableTransactionManagement(proxyTargetClass=true)
    static class Config {
        @Bean DataSource dataSource(){return ds;}
        @Bean PlatformTransactionManager transactionManager(){return new DataSourceTransactionManager(ds);}
        @Bean TransferRepository transferRepository(){return new TransferRepository(){
            public void debit(long id,long cents)throws InsufficientFundsException {
                snap("original-repository-debit");jdbc.update("update account set cents=cents-? where id=?",cents,id);
                try {timeline.add(row("label","after-debit-values","writer",balances(false),"observer",balances(true)));}
                catch(SQLException e){throw new IllegalStateException(e);}
                if(failDebit)throw new InsufficientFundsException();
            }
            public void credit(long id,long cents){snap("original-repository-credit");jdbc.update("update account set cents=cents+? where id=?",cents,id);}
        };}
        @Bean TransferService transferService(TransferRepository r){return new TransferService(r);}
        @Bean ImportRepository importRepository(){return (key,value)->{
            snap("original-import-repository");jdbc.update("insert into ledger(label) values(?)",key);return !falseImport;
        };}
        @Bean ImportService importService(ImportRepository r,PlatformTransactionManager m){return new ImportService(r,m);}
        @Bean NotificationGateway notificationGateway(){return id->{snap("original-after-commit-gateway");notifications.add(id);if(failGateway)throw new IllegalStateException("gateway-failure");};}
        @Bean OrderNotificationListener listener(NotificationGateway g){return new OrderNotificationListener(g);}
        @Bean ExtraRules extraRules(ApplicationEventPublisher p){return new ExtraRules(p);}
        @Bean Inner inner(){return new Inner();}
        @Bean Outer outer(Inner inner){return new Outer(inner);}
    }
    static class ExtraRules {
        final ApplicationEventPublisher events;
        ExtraRules(ApplicationEventPublisher events){this.events=events;}
        @Transactional public void checked()throws IOException {snap("default-checked");jdbc.update("insert into ledger values('checked')");throw new IOException("checked");}
        @Transactional public void runtime(){snap("default-runtime");jdbc.update("insert into ledger values('runtime')");throw new IllegalStateException("runtime");}
        @Transactional(noRollbackFor=IllegalStateException.class) public void noRollback(){snap("no-rollback-runtime");jdbc.update("insert into ledger values('no-rollback')");throw new IllegalStateException("keep");}
        @Transactional public void caught(){snap("catch-in-same-method");jdbc.update("insert into ledger values('caught')");try{throw new IllegalStateException("caught");}catch(IllegalStateException ignored){}}
        public void selfInvoke(){this.runtime();}
        @Transactional public void event(boolean fail){snap("event-publish-before");jdbc.update("insert into ledger values('order')");events.publishEvent(new OrderCommitted(77L));snap("event-publish-after");if(fail)throw new IllegalArgumentException("event-rollback");}
        @Transactional(readOnly=true) public void readOnlyWrite(){snap("read-only-write");jdbc.update("insert into ledger values('read-only-write')");}
    }
    static class Inner {
        @Transactional public void required(){snap("inner-required");jdbc.update("insert into ledger values('inner-required')");throw new IllegalArgumentException("required-failure");}
        @Transactional(propagation=Propagation.REQUIRES_NEW) public void independent(){snap("inner-new");jdbc.update("insert into ledger values('inner-new')");}
        @Transactional(propagation=Propagation.NESTED) public void nested(){snap("inner-nested");jdbc.update("insert into ledger values('inner-nested')");throw new IllegalArgumentException("nested-failure");}
        @Transactional(propagation=Propagation.SUPPORTS) public void supports(){snap("inner-supports");}
        @Transactional(propagation=Propagation.MANDATORY) public void mandatory(){snap("inner-mandatory");}
        @Transactional(propagation=Propagation.NOT_SUPPORTED) public void notSupported(){snap("inner-not-supported");}
        @Transactional(propagation=Propagation.NEVER) public void never(){snap("inner-never");}
    }
    static class Outer {
        final Inner inner;Outer(Inner inner){this.inner=inner;}
        @Transactional public void requiredCaught(){snap("outer-required-start");jdbc.update("insert into ledger values('outer')");try{inner.required();}catch(IllegalArgumentException ignored){snap("outer-required-caught");timeline.add(row("label","outer-rollback-only","rollbackOnly",org.springframework.transaction.interceptor.TransactionAspectSupport.currentTransactionStatus().isRollbackOnly()));}}
        @Transactional public void newThenFail(){snap("outer-new-start");jdbc.update("insert into ledger values('outer')");inner.independent();snap("outer-new-resumed");throw new IllegalArgumentException("outer-failure");}
        @Transactional public void nestedCaught(){snap("outer-nested-start");jdbc.update("insert into ledger values('outer')");try{inner.nested();}catch(IllegalArgumentException ignored){snap("outer-nested-caught");}}
        @Transactional public void propagationContracts(){snap("outer-contracts");inner.supports();inner.mandatory();inner.notSupported();try{inner.never();}catch(IllegalTransactionStateException expected){snap("never-rejected");}}
    }
    public static void main(String[] args)throws Exception {
        ds=new TrackedSource();jdbc=new JdbcTemplate(ds);
        jdbc.execute("create table account(id bigint primary key,cents bigint not null)");jdbc.execute("create table ledger(label varchar(100) primary key)");
        try(AnnotationConfigApplicationContext ctx=new AnnotationConfigApplicationContext(Config.class)) {
            facts.put("versions",row("spring",org.springframework.core.SpringVersion.getVersion(),"h2",org.h2.engine.Constants.VERSION,"java",Runtime.version().feature()));
            try(Connection observer=ds.raw.getConnection()){facts.put("observerConnection",row("autoCommit",observer.getAutoCommit(),"jdbcIsolation",observer.getTransactionIsolation()));}
            TransferService transfer=ctx.getBean(TransferService.class);ImportService importer=ctx.getBean(ImportService.class);ExtraRules extra=ctx.getBean(ExtraRules.class);Inner inner=ctx.getBean(Inner.class);Outer outer=ctx.getBean(Outer.class);
            check("original-transfer-is-cglib-proxy",AopUtils.isCglibProxy(transfer));
            reset();transfer.transfer(1,2,250);check("original-transfer-commits-both",balances(true).equals(List.of(750L,350L)));check("original-transfer-repository-active",Boolean.TRUE.equals(timeline.get(0).get("active")));check("original-transfer-one-bound-connection",sameConnections());check("original-transfer-writer-uncommitted-observer-old",timeline.get(1).get("writer").equals(List.of(750L,100L))&&timeline.get(1).get("observer").equals(List.of(1000L,100L)));check("original-transfer-commit-recorded",action("commit",null));capture("originalTransfer");
            reset();failDebit=true;try{transfer.transfer(1,2,250);throw new AssertionError();}catch(InsufficientFundsException expected){}
            check("original-rollbackFor-checked-restores-both",balances(true).equals(List.of(1000L,100L)));capture("originalCheckedRollback");
            reset();failDebit=true;try{new TransferService(ctx.getBean(TransferRepository.class)).transfer(1,2,250);throw new AssertionError();}catch(InsufficientFundsException expected){}
            check("direct-new-annotation-no-transaction",Boolean.FALSE.equals(timeline.get(0).get("active")));check("direct-new-debit-autocommits",balances(true).equals(List.of(750L,100L)));capture("directOriginal");
            reset();try{extra.checked();throw new AssertionError();}catch(IOException expected){}check("default-checked-commits",jdbc.queryForObject("select count(*) from ledger",Integer.class)==1);capture("defaultChecked");
            reset();try{extra.runtime();throw new AssertionError();}catch(IllegalStateException expected){}check("default-runtime-rolls-back",jdbc.queryForObject("select count(*) from ledger",Integer.class)==0);capture("defaultRuntime");
            reset();try{extra.noRollback();throw new AssertionError();}catch(IllegalStateException expected){}check("noRollbackFor-runtime-commits",jdbc.queryForObject("select count(*) from ledger",Integer.class)==1);capture("noRollbackFor");
            reset();extra.caught();check("caught-runtime-normal-return-commits",jdbc.queryForObject("select count(*) from ledger",Integer.class)==1);capture("caughtRuntime");
            reset();try{extra.selfInvoke();throw new AssertionError();}catch(IllegalStateException expected){}check("self-invocation-bypasses-advice",Boolean.FALSE.equals(timeline.get(0).get("active")));check("self-invocation-write-autocommits",jdbc.queryForObject("select count(*) from ledger",Integer.class)==1);capture("selfInvocation");
            reset();check("original-import-true-result",importer.importOne("import-ok","value"));check("original-import-true-commits",jdbc.queryForObject("select count(*) from ledger",Integer.class)==1);capture("originalImportSuccess");
            reset();falseImport=true;check("original-import-false-result",!importer.importOne("import-false","value"));check("original-import-setRollbackOnly-removes-insert",jdbc.queryForObject("select count(*) from ledger",Integer.class)==0);capture("originalImportRollbackOnly");
            reset();extra.event(false);check("original-listener-after-commit-notifies",notifications.equals(List.of(77L)));check("original-listener-after-publish-return",timeline.get(timeline.size()-1).get("label").equals("original-after-commit-gateway"));capture("afterCommit");
            reset();try{extra.event(true);throw new AssertionError();}catch(IllegalArgumentException expected){}check("rollback-skips-original-after-commit",notifications.isEmpty());check("event-rollback-row-absent",jdbc.queryForObject("select count(*) from ledger",Integer.class)==0);capture("eventRollback");
            reset();ctx.publishEvent(new OrderCommitted(88L));check("no-transaction-skips-original-listener",notifications.isEmpty());capture("eventNoTransaction");
            reset();failGateway=true;extra.event(false);check("listener-after-completion-failure-not-propagated",true);check("listener-failure-does-not-undo-commit",jdbc.queryForObject("select count(*) from ledger",Integer.class)==1);capture("afterCommitFailure");
            reset();try{outer.requiredCaught();throw new AssertionError();}catch(UnexpectedRollbackException expected){}check("required-caught-inner-still-rolls-back-all",jdbc.queryForObject("select count(*) from ledger",Integer.class)==0);check("required-caught-is-rollback-only",Boolean.TRUE.equals(timeline.get(timeline.size()-1).get("rollbackOnly")));check("required-shares-one-bound-connection",sameConnections());check("required-physical-rollback-recorded",action("rollback",null)&&!action("commit",null));capture("requiredRollbackOnly");
            reset();try{outer.newThenFail();throw new AssertionError();}catch(IllegalArgumentException expected){}check("requires-new-survives-outer-rollback",jdbc.queryForList("select label from ledger",String.class).equals(List.of("inner-new")));check("requires-new-different-inner-connection-outer-resumes",!timeline.get(0).get("connection").equals(timeline.get(1).get("connection"))&&timeline.get(0).get("connection").equals(timeline.get(2).get("connection")));check("requires-new-inner-commit-outer-rollback",action("commit",null)&&action("rollback",null));capture("requiresNew");
            reset();outer.nestedCaught();check("nested-savepoint-keeps-outer-only",jdbc.queryForList("select label from ledger",String.class).equals(List.of("outer")));check("nested-one-physical-connection",sameConnections());check("nested-savepoint-rollback-and-final-commit",action("rollback","savepoint")&&action("releaseSavepoint","savepoint")&&action("commit",null)&&!action("rollback",null));capture("nested");
            reset();inner.supports();check("supports-without-transaction-inactive",Boolean.FALSE.equals(timeline.get(0).get("active")));check("supports-can-have-synchronization",Boolean.TRUE.equals(timeline.get(0).get("synchronization")));inner.notSupported();inner.never();try{inner.mandatory();throw new AssertionError();}catch(IllegalTransactionStateException expected){check("mandatory-without-transaction-rejects",true);}capture("contractsOutside");
            reset();outer.propagationContracts();check("not-supported-suspends-physical-transaction",timeline.stream().anyMatch(r->r.get("label").equals("inner-not-supported")&&Boolean.FALSE.equals(r.get("active"))));check("never-rejects-existing-transaction",timeline.stream().anyMatch(r->r.get("label").equals("never-rejected")));capture("contractsInside");
            reset();extra.readOnlyWrite();check("read-only-hint-does-not-block-this-h2-write",jdbc.queryForObject("select count(*) from ledger",Integer.class)==1);capture("readOnlyHint");
            facts.put("scope","Original3Java blocks unchanged. Additional JDBC repository implementations and annotated variants; standalone Spring CGLIB context/DataSourceTransactionManager/H2/JDK21 with Boot4.1.1 BOM only. No Boot app/JPA/MySQL/Java25/HTTP/Docker/reactive/broker/CDC/process-kill/outbox runtime. Observer uses separate autocommit JDBC. Tracking logs connection methods, not wire SQL or latency. gatewayInvocations are in-memory method calls, NOT broker delivery acknowledgments. The AFTER_COMMIT callback can still expose active=true thread resources after the physical commit; that flag is not proof of an uncommitted DB transaction. readOnly and propagation results limited to this manager/driver.");
            facts.put("additionalRepositoryBehavior",row("transfer","Additional account seed id1=1000/id2=100; debit fail flag throws original checked exception after an UPDATE, not a real insufficient-funds implementation.","import","Additional deliberate INSERT-then-false implementation exercises original setRollbackOnly branch; not a real insertIfAbsent/duplicate-key algorithm.","notification","Memory invocation record with controlled failure flag; not a message broker."));
            facts.put("checks",checks.size());facts.put("checkNames",checks);
            Files.writeString(Path.of(args[0],"execution.json"),JsonMapper.builder().build().writerWithDefaultPrettyPrinter().writeValueAsString(facts)+"\n");
            System.out.println("CHECKS "+checks.size());
        }
    }
}
