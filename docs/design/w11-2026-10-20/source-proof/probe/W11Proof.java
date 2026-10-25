import java.lang.reflect.*;
import java.nio.file.*;
import java.sql.*;
import java.util.*;
import javax.sql.DataSource;
import org.h2.jdbcx.JdbcDataSource;
import org.springframework.aop.support.AopUtils;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.*;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import tools.jackson.databind.json.JsonMapper;

// 원문 B/C는 동명 대안이므로 서로 다른 source set/JVM에서 실행한다.
public class W11Proof {
    static TrackedSource ds;
    static boolean riskAllowed=true;
    static final List<Map<String,Object>> timeline=new ArrayList<>();
    static final List<Map<String,Object>> sqlEvents=new ArrayList<>();
    static final List<Map<String,Object>> listeners=new ArrayList<>();
    static final List<Map<String,Object>> risks=new ArrayList<>();
    static final List<String> checks=new ArrayList<>();
    static final Map<String,Object> facts=new LinkedHashMap<>();
    static int sequence;
    static Map<String,Object> row(Object... pairs){Map<String,Object> m=new LinkedHashMap<>();for(int i=0;i<pairs.length;i+=2)m.put((String)pairs[i],pairs[i+1]);return m;}
    static void check(String name,boolean good){if(!good)throw new AssertionError(name);checks.add(name);System.out.println("PASS "+name);}
    static Map<String,Object> state(Connection c)throws SQLException {
        List<Map<String,Object>> orders=new ArrayList<>();int stock;
        try(Statement s=c.createStatement();ResultSet r=s.executeQuery("select product_id,quantity from orders order by product_id,quantity")){
            while(r.next())orders.add(row("productId",r.getLong(1),"quantity",r.getInt(2)));
        }
        try(Statement s=c.createStatement();ResultSet r=s.executeQuery("select quantity from inventory where product_id=7")){r.next();stock=r.getInt(1);}
        return row("orders",orders,"stock",stock);
    }
    static Map<String,Object> observer()throws SQLException {try(Connection c=ds.raw.getConnection()){return state(c);}}
    static int orders(Map<String,Object> state){return ((List<?>)state.get("orders")).size();}
    static void reset()throws SQLException {
        try(Connection c=ds.raw.getConnection();Statement s=c.createStatement()){
            s.executeUpdate("delete from orders");s.executeUpdate("delete from inventory");s.executeUpdate("insert into inventory(product_id,quantity) values(7,5)");
        }
        timeline.clear();sqlEvents.clear();listeners.clear();risks.clear();sequence=0;ds.serial=0;ds.ids.clear();riskAllowed=true;
    }
    static Map<String,Object> flags(){
        Object holder=TransactionSynchronizationManager.getResource(ds);Integer connection=null;
        if(holder instanceof ConnectionHolder h)connection=ds.ids.get(h.getConnection());
        return row("active",TransactionSynchronizationManager.isActualTransactionActive(),"synchronization",TransactionSynchronizationManager.isSynchronizationActive(),"connection",connection);
    }
    static void observeListener(long product,int quantity)throws SQLException {
        Map<String,Object> event=row("sequence",++sequence,"kind","additional-listener-observer","productId",product,"quantity",quantity,"springFlags",flags(),"independentObserver",observer(),"scope","Additional subclass invoked original empty listener via super; no notification/broker call.");
        timeline.add(event);listeners.add(event);
    }
    static void capture(String name,String result)throws SQLException {
        facts.put(name,row("callResult",result,"timeline",new ArrayList<>(timeline),"sourceSql",new ArrayList<>(sqlEvents),"listenerObservations",new ArrayList<>(listeners),"riskObservations",new ArrayList<>(risks),"finalObserver",observer(),"trackedConnectionsOpened",ds.serial));
    }
    static long actions(String method){return timeline.stream().filter(e->method.equals(e.get("action"))).count();}
    static boolean sameSqlConnection(){return sqlEvents.stream().map(e->e.get("connection")).distinct().count()==1;}
    static class TrackedSource extends AbstractDataSource {
        final JdbcDataSource raw=new JdbcDataSource();final IdentityHashMap<Connection,Integer> ids=new IdentityHashMap<>();int serial;
        TrackedSource(){raw.setURL("jdbc:h2:mem:w11_proof;DB_CLOSE_DELAY=-1");raw.setUser("sa");}
        public Connection getConnection()throws SQLException{return wrap(raw.getConnection());}
        public Connection getConnection(String u,String p)throws SQLException{return wrap(raw.getConnection(u,p));}
        Connection wrap(Connection target){
            int id=++serial;
            Connection proxy=(Connection)Proxy.newProxyInstance(getClass().getClassLoader(),new Class[]{Connection.class},(p,m,a)->{
                if(m.getDeclaringClass()==Object.class){if(m.getName().equals("equals"))return p==a[0];if(m.getName().equals("hashCode"))return System.identityHashCode(p);if(m.getName().equals("toString"))return "tracked-connection-"+id;}
                try {
                    Object value=m.invoke(target,a);
                    if(m.getName().equals("prepareStatement")&&a[0] instanceof String sql&&(sql.startsWith("insert into orders")||sql.startsWith("update inventory")))return statement((PreparedStatement)value,target,id,sql);
                    if(Set.of("setAutoCommit","commit","rollback","close").contains(m.getName()))timeline.add(row("sequence",++sequence,"kind","connection","connection",id,"action",m.getName(),"argument",a==null?null:a[0]));
                    return value;
                }catch(InvocationTargetException e){throw e.getCause();}
            });ids.put(proxy,id);return proxy;
        }
        PreparedStatement statement(PreparedStatement target,Connection writer,int connection,String sql){
            Map<Integer,Object> parameters=new TreeMap<>();
            return (PreparedStatement)Proxy.newProxyInstance(getClass().getClassLoader(),new Class[]{PreparedStatement.class},(p,m,a)->{
                if(m.getDeclaringClass()==Object.class){if(m.getName().equals("equals"))return p==a[0];if(m.getName().equals("hashCode"))return System.identityHashCode(p);if(m.getName().equals("toString"))return "tracked-source-statement";}
                try {
                    Object value=m.invoke(target,a);
                    if(m.getName().startsWith("set")&&a!=null&&a.length>=2&&a[0] instanceof Integer index)parameters.put(index,m.getName().equals("setNull")?null:a[1]);
                    if(m.getName().equals("clearParameters"))parameters.clear();
                    if(m.getName().equals("executeUpdate")){
                        Map<String,Object> e=row("sequence",++sequence,"kind","source-sql","connection",connection,"sql",sql,"parameters",new TreeMap<>(parameters),"affectedRows",value,"springFlags",flags(),"writerAfterStatement",state(writer),"independentObserverAfterStatement",observer());
                        timeline.add(e);sqlEvents.add(e);
                    }
                    return value;
                }catch(InvocationTargetException e){throw e.getCause();}
            });
        }
    }
    @Configuration(proxyBeanMethods=false)
    @EnableTransactionManagement(proxyTargetClass=true)
    static class Config {
        @Bean DataSource dataSource(){return ds;}
        @Bean PlatformTransactionManager transactionManager(){return new DataSourceTransactionManager(ds);}
        @Bean JdbcTemplate jdbcTemplate(){return new JdbcTemplate(ds);}
        @Bean OrderRepository orderRepository(JdbcTemplate j){return new OrderRepository(j);}
        @Bean InventoryRepository inventoryRepository(JdbcTemplate j){return new InventoryRepository(j);}
        @Bean OrderController controller(OrderRepository o,InventoryRepository i){return new OrderController(o,i);}
        @Bean RiskClient riskClient(){return command->{
            Map<String,Object> e=row("sequence",++sequence,"kind","additional-risk-stub","productId",command.productId(),"quantity",command.quantity(),"springFlags",flags(),"allowed",riskAllowed,"scope","Controlled memory stub, no network/side effect.");timeline.add(e);risks.add(e);return riskAllowed;
        };}
        @Bean CheckedOrderUseCase checked(RiskClient r,OrderRepository o,InventoryRepository i,PlatformTransactionManager m){return new CheckedOrderUseCase(r,o,i,m);}
    }
    @SuppressWarnings({"unchecked","rawtypes"})
    public static void main(String[] args)throws Exception {
        String variant=args[1];ds=new TrackedSource();
        try(Connection c=ds.raw.getConnection();Statement s=c.createStatement()){
            s.execute("create table orders(product_id bigint not null,quantity int not null)");s.execute("create table inventory(product_id bigint primary key,quantity int not null)");
            facts.put("observerConnection",row("autoCommit",c.getAutoCommit(),"jdbcIsolation",c.getTransactionIsolation()));
        }
        facts.put("variant",variant);facts.put("versions",row("spring",org.springframework.core.SpringVersion.getVersion(),"h2",org.h2.engine.Constants.VERSION,"java",Runtime.version().feature()));
        try(AnnotationConfigApplicationContext ctx=new AnnotationConfigApplicationContext()){
            ctx.register(Config.class);
            ctx.registerBean("useCase",OrderUseCase.class,()->{
                try {
                    Constructor<?> ctor=OrderUseCase.class.getDeclaredConstructors()[0];
                    return (OrderUseCase)ctor.newInstance(ctor.getParameterCount()==2?new Object[]{ctx.getBean(OrderRepository.class),ctx.getBean(InventoryRepository.class)}:new Object[]{ctx.getBean(OrderRepository.class),ctx.getBean(InventoryRepository.class),ctx});
                }catch(ReflectiveOperationException e){throw new IllegalStateException(e);}
            });
            if(variant.equals("C"))ctx.registerBean("observedListener",(Class)Class.forName("ObservedListener"));
            ctx.refresh();
            OrderUseCase useCase=ctx.getBean(OrderUseCase.class);OrderController controller=ctx.getBean(OrderController.class);CheckedOrderUseCase template=ctx.getBean(CheckedOrderUseCase.class);
            facts.put("sourceBeans",row("useCaseCglib",AopUtils.isCglibProxy(useCase),"controllerCglib",AopUtils.isCglibProxy(controller),"ordersCglib",AopUtils.isCglibProxy(ctx.getBean(OrderRepository.class)),"inventoryCglib",AopUtils.isCglibProxy(ctx.getBean(InventoryRepository.class))));
            check(variant+"-repositories-are-proxies",AopUtils.isCglibProxy(ctx.getBean(OrderRepository.class))&&AopUtils.isCglibProxy(ctx.getBean(InventoryRepository.class)));
            if(variant.equals("B")){
                check("B-usecase-has-no-transaction-proxy",!AopUtils.isAopProxy(useCase));
                reset();try{useCase.place(new PlaceOrder(7,6));throw new AssertionError();}catch(IllegalStateException expected){facts.put("sourceInventoryFailure",expected.getMessage());}
                check("B-partial-order-commit-survives-stock-failure",orders(observer())==1&&(int)observer().get("stock")==5);
                check("B-repositories-use-two-connections",sqlEvents.size()==2&&!sameSqlConnection()&&ds.serial==2);
                check("B-inventory-guard-affects-zero",sqlEvents.get(1).get("affectedRows").equals(0));
                check("B-one-commit-one-rollback",actions("commit")==1&&actions("rollback")==1);capture("repositoryFailure","IllegalStateException");
                reset();useCase.place(new PlaceOrder(7,2));check("B-success-final-order-stock3",orders(observer())==1&&(int)observer().get("stock")==3);check("B-success-two-independent-commits",actions("commit")==2&&ds.serial==2);capture("repositorySuccess","normal return");
                check("A-controller-is-cglib-proxy",AopUtils.isCglibProxy(controller));
                reset();try{controller.place(new PlaceOrder(7,6));throw new AssertionError();}catch(IllegalStateException expected){}
                check("A-controller-java-proxy-rolls-back-both",orders(observer())==0&&(int)observer().get("stock")==5);
                check("A-controller-repositories-share-one-connection",sqlEvents.size()==2&&sameSqlConnection()&&ds.serial==1);
                check("A-controller-one-rollback-no-commit",actions("rollback")==1&&actions("commit")==0);capture("controllerFailure","IllegalStateException");
                reset();controller.place(new PlaceOrder(7,2));check("A-controller-java-proxy-success",orders(observer())==1&&(int)observer().get("stock")==3);check("A-controller-one-commit",actions("commit")==1&&sameSqlConnection());capture("controllerSuccess","normal Java return; HTTP not invoked");
                reset();riskAllowed=false;try{template.place(new PlaceOrder(7,2));throw new AssertionError();}catch(IllegalArgumentException expected){check("D-risk-rejection-message",expected.getMessage().equals("주문할 수 없습니다"));}
                check("D-rejected-risk-opens-no-tracked-connection",ds.serial==0&&sqlEvents.isEmpty());
                check("D-risk-outside-transaction",Boolean.FALSE.equals(((Map<?,?>)risks.get(0).get("springFlags")).get("active")));capture("templateRejected","IllegalArgumentException");
                reset();template.place(new PlaceOrder(7,2));check("D-template-allowed-order-stock3",orders(observer())==1&&(int)observer().get("stock")==3);check("D-template-repositories-share-one-connection",sameSqlConnection()&&ds.serial==1&&actions("commit")==1);check("D-risk-precedes-first-source-sql",(int)risks.get(0).get("sequence")<(int)sqlEvents.get(0).get("sequence"));capture("templateSuccess","normal return");
                reset();try{template.place(new PlaceOrder(7,6));throw new AssertionError();}catch(IllegalStateException expected){}check("D-template-stock-failure-rolls-back-both",orders(observer())==0&&(int)observer().get("stock")==5);check("D-template-one-rollback",actions("rollback")==1&&actions("commit")==0);capture("templateFailure","IllegalStateException");
            }else{
                check("C-service-is-cglib-proxy",AopUtils.isCglibProxy(useCase));
                reset();useCase.place(new PlaceOrder(7,2));check("C-service-success-order-stock3",orders(observer())==1&&(int)observer().get("stock")==3);check("C-service-one-connection-one-commit",sameSqlConnection()&&ds.serial==1&&actions("commit")==1);check("C-additional-observer-invokes-original-empty-listener",listeners.size()==1);check("C-listener-sees-committed-state",orders((Map<String,Object>)listeners.get(0).get("independentObserver"))==1&&((Map<?,?>)listeners.get(0).get("independentObserver")).get("stock").equals(3));capture("serviceSuccess","normal return");
                reset();try{useCase.place(new PlaceOrder(7,6));throw new AssertionError();}catch(IllegalStateException expected){}check("C-service-stock-failure-rolls-back-both",orders(observer())==0&&(int)observer().get("stock")==5);check("C-failure-no-listener-observation",listeners.isEmpty());check("C-service-failure-one-connection-one-rollback",sameSqlConnection()&&ds.serial==1&&actions("rollback")==1&&actions("commit")==0);capture("serviceFailure","IllegalStateException");
            }
            facts.put("scope","Exact original5Java blocks compiled in separate B/C source sets/JVMs because OrderUseCase is an alternative same-named class. Common original repositories/Controller/CheckedOrderUseCase run with additional H2 schema(product7 stock5), Spring7.0.9 CGLIB/DataSourceTransactionManager/JDK21/Boot4.1.1 BOM only. Controller is a proxied Java call, no HTTP/MVC/serialization. RiskClient is a controlled memory stub; C listener is an additional subclass calling the original empty handler, no notification/broker. Source SQL events record actual prepared SQL/setter bindings/affected rows and writer/independent READ_COMMITTED autocommit observer snapshots. Observation SELECTs/setup/assert queries excluded from source SQL. Connection IDs are run-local wrapper IDs, not DB sessions/pool counts. No Boot app/JPA/MySQL/Java25/Docker/network/payment/broker/outbox/CDC/OSIV/pool/latency/reactive runtime.");
            facts.put("checks",checks.size());facts.put("checkNames",checks);
            Files.writeString(Path.of(args[0],"variant-"+variant+".json"),JsonMapper.builder().build().writerWithDefaultPrettyPrinter().writeValueAsString(facts)+"\n");
            System.out.println("VARIANT "+variant+" CHECKS "+checks.size());
        }
    }
}
