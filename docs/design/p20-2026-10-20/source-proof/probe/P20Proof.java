package example.shop.probe;

import example.shop.ShopApplication;
import example.shop.domain.Order;
import example.shop.domain.OrderLine;
import example.shop.web.OrderResponse;
import jakarta.persistence.*;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.nio.file.*;
import java.sql.*;
import java.util.*;
import org.hibernate.Session;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.springframework.boot.*;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.*;
import tools.jackson.databind.json.JsonMapper;

/** 원문5파일+명시적DTO교정1파일을 쓰는 격리 추가 실험. 실제 HTTP·MySQL은 실행하지 않는다. */
public class P20Proof {
    static int checks;
    static final Map<String,Object> result=new LinkedHashMap<>();
    static final List<String> sql=new ArrayList<>();
    static final Map<String,List<String>> phases=new LinkedHashMap<>();
    static final String URL="jdbc:h2:mem:p20_extra;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=1000";
    @Configuration(proxyBeanMethods=false)
    static class Inspection {
        @Bean HibernatePropertiesCustomizer p20Inspector(){return p->p.put("hibernate.session_factory.statement_inspector",(StatementInspector)s->{sql.add(s);return s;});}
    }
    static void check(String name,boolean ok){if(!ok)throw new AssertionError(name);checks++;System.out.println("PASS "+name);}
    static void phase(String name){phases.put(name,new ArrayList<>(sql));sql.clear();}
    static Object field(Object o,String name)throws Exception{
        Class<?> c=o.getClass();while(c!=null){try{Field f=c.getDeclaredField(name);f.setAccessible(true);return f.get(o);}catch(NoSuchFieldException e){c=c.getSuperclass();}}
        throw new NoSuchFieldException(name);
    }
    @SuppressWarnings("unchecked") static List<OrderLine> internalLines(Order o)throws Exception{return(List<OrderLine>)field(o,"lines");}
    static Connection observer()throws Exception{Connection c=DriverManager.getConnection(URL,"sa","");c.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);return c;}
    static long count(Connection c,String table,long id)throws SQLException{
        String key=table.equals("orders")?"id":"order_id";
        try(var p=c.prepareStatement("select count(*) from "+table+" where "+key+"=?")){p.setLong(1,id);try(var r=p.executeQuery()){r.next();return r.getLong(1);}}
    }
    static Map<String,Object> row(Connection c,long id)throws SQLException{
        try(var p=c.prepareStatement("select o.id,o.orderer_name,l.id as line_id,l.order_id,l.product_name,l.price,l.quantity,l.status,o.created_by,o.updated_by,o.created_at,o.updated_at from orders o join order_lines l on l.order_id=o.id where o.id=?")){
            p.setLong(1,id);try(var r=p.executeQuery()){if(!r.next())return Map.of();var m=new LinkedHashMap<String,Object>();for(int i=1;i<=12;i++)m.put(r.getMetaData().getColumnLabel(i).toLowerCase(Locale.ROOT),r.getObject(i));return m;}
        }
    }
    static String causes(Throwable t){StringBuilder b=new StringBuilder();for(;t!=null;t=t.getCause())b.append(t.getClass().getName()).append(": ").append(t.getMessage()).append('\n');return b.toString();}
    public static void main(String[]args)throws Exception{
        Path out=Path.of(args[0]);JsonMapper mapper=JsonMapper.builder().build();
        Order pure=Order.create("kim");OrderLine pureLine=new OrderLine("coffee",new BigDecimal("4.50"),2);pure.addLine(pureLine);
        String a="after add: count="+pure.getLines().size()+", attached="+(field(pureLine,"order")==pure);
        check("pure-add-both-sides",pure.getLines().size()==1&&field(pureLine,"order")==pure);
        pure.removeLine(pureLine);String b="after remove: count="+pure.getLines().size()+", attached="+(field(pureLine,"order")!=null);
        check("pure-remove-both-sides",pure.getLines().isEmpty()&&field(pureLine,"order")==null);
        result.put("pureStdout",List.of(a,b));
        boolean rejected=false;try{new OrderLine("coffee",new BigDecimal("4.50"),0);}catch(IllegalArgumentException e){rejected=e.getMessage().equals("quantity must be positive");}
        check("quantity-zero-reject",rejected);
        SpringApplication app=new SpringApplication(ShopApplication.class,Inspection.class);app.setWebApplicationType(WebApplicationType.NONE);
        try(ConfigurableApplicationContext context=app.run("--spring.config.location=optional:classpath:p20-isolated-none.yml","--spring.profiles.active=p20-isolated","--spring.datasource.url="+URL,"--spring.datasource.username=sa","--spring.datasource.password=","--spring.datasource.hikari.maximum-pool-size=3","--spring.jpa.hibernate.ddl-auto=create-drop","--spring.jpa.open-in-view=false","--spring.main.banner-mode=off","--logging.level.root=OFF","--spring.sql.init.mode=never");Connection obs=observer()){
            result.put("observerIsolation",obs.getTransactionIsolation());
            EntityManagerFactory emf=context.getBean(EntityManagerFactory.class);sql.clear();
            EntityManager em=emf.createEntityManager();em.getTransaction().begin();
            Order order=Order.create("kim");OrderLine line=new OrderLine("coffee",new BigDecimal("4.50"),2);order.addLine(line);
            result.put("newObject",Map.of("orderId",order.getId()==null?"null":order.getId(),"lineId",line.getId()==null?"null":line.getId(),"lines",order.getLines().size(),"attached",field(line,"order")==order,"managed",em.contains(order)));
            check("new-ids-null-unmanaged",order.getId()==null&&line.getId()==null&&!em.contains(order));
            em.persist(order);phase("persistSql");long id=order.getId();
            check("identity-persist-ids",id==1L&&line.getId()==1L);
            check("cascade-line-managed",em.contains(order)&&em.contains(line));
            Map<String,Object> txRow=em.unwrap(Session.class).doReturningWork(c->row(c,id));result.put("afterPersistTxRow",txRow);
            check("identity-insert-before-explicit-flush",txRow.get("product_name").equals("coffee")&&new BigDecimal(txRow.get("price").toString()).compareTo(new BigDecimal("4.50"))==0);
            check("owner-fk-is-order-id",((Number)txRow.get("order_id")).longValue()==id);
            check("enum-stored-string",txRow.get("status").equals("PENDING"));
            check("audit-users-local-user",txRow.get("created_by").equals("local-user")&&txRow.get("updated_by").equals("local-user"));
            check("audit-dates-non-null",txRow.get("created_at")!=null&&txRow.get("updated_at")!=null);
            result.put("beforeCommitObserver",Map.of("orders",count(obs,"orders",id),"order_lines",count(obs,"order_lines",id)));
            check("persist-not-visible-outside",count(obs,"orders",id)==0&&count(obs,"order_lines",id)==0);
            em.flush();phase("explicitFlushSql");
            check("flush-not-commit",count(obs,"orders",id)==0&&count(obs,"order_lines",id)==0);
            OrderResponse response=OrderResponse.from(order);String dtoJson=mapper.writeValueAsString(response);result.put("dtoJson",dtoJson);
            check("dto-status-and-no-order-backref",mapper.readTree(dtoJson).get("lines").get(0).get("status").asString().equals("PENDING")&&!mapper.readTree(dtoJson).get("lines").get(0).has("order"));
            em.getTransaction().commit();phase("commitSql");em.close();
            result.put("committedRow",row(obs,id));
            check("commit-visible-outside",count(obs,"orders",id)==1&&count(obs,"order_lines",id)==1);
            check("detached-dto-serializes",mapper.writeValueAsString(response).equals(dtoJson));
            em=emf.createEntityManager();em.getTransaction().begin();Order rolled=Order.create("rolled");rolled.addLine(new OrderLine("coffee",new BigDecimal("4.50"),2));em.persist(rolled);long rollbackId=rolled.getId();em.flush();phase("rollbackBranchSql");
            result.put("rollbackBranch",Map.of("orderId",rollbackId,"txOrders",em.unwrap(Session.class).doReturningWork(c->count(c,"orders",rollbackId)),"outsideOrdersBefore",count(obs,"orders",rollbackId)));
            check("rollback-branch-inserted-inside",em.unwrap(Session.class).doReturningWork(c->count(c,"orders",rollbackId))==1&&count(obs,"orders",rollbackId)==0);
            em.getTransaction().rollback();em.close();
            check("rollback-outside-no-row",count(obs,"orders",rollbackId)==0&&count(obs,"order_lines",rollbackId)==0);
            em=emf.createEntityManager();em.getTransaction().begin();Order managed=em.find(Order.class,id);OrderLine removed=managed.getLines().get(0);sql.clear();managed.removeLine(removed);
            result.put("orphanBeforeFlush",Map.of("collectionSize",managed.getLines().size(),"ownerNull",field(removed,"order")==null,"observerLines",count(obs,"order_lines",id)));
            check("managed-remove-memory-before-flush",managed.getLines().isEmpty()&&field(removed,"order")==null&&count(obs,"order_lines",id)==1);
            em.flush();phase("orphanFlushSql");
            long insideLineCount=em.unwrap(Session.class).doReturningWork(c->count(c,"order_lines",id));result.put("orphanAfterFlush",Map.of("insideLines",insideLineCount,"outsideLines",count(obs,"order_lines",id)));
            check("orphan-flush-delete-inside",insideLineCount==0&&count(obs,"order_lines",id)==1);
            em.getTransaction().commit();phase("orphanCommitSql");em.close();
            check("orphan-commit-child-gone-parent-kept",count(obs,"order_lines",id)==0&&count(obs,"orders",id)==1);
            em=emf.createEntityManager();em.getTransaction().begin();Order broken=Order.create("broken");OrderLine brokenLine=new OrderLine("coffee",new BigDecimal("4.50"),2);internalLines(broken).add(brokenLine);
            check("inverse-only-owner-null",broken.getLines().size()==1&&field(brokenLine,"order")==null);
            String failure="";try{em.persist(broken);em.flush();}catch(Exception e){failure=causes(e);}finally{if(em.getTransaction().isActive())em.getTransaction().rollback();em.close();}
            phase("inverseOnlySql");result.put("inverseOnlyFailure",failure);
            check("inverse-only-null-owner-reject",failure.contains("PropertyValueException")&&failure.contains("OrderLine.order"));
            try(var s=obs.createStatement();var r=s.executeQuery("select count(*) from orders where orderer_name='broken'")){r.next();check("inverse-only-rollback-no-parent-row",r.getLong(1)==0);}
            var columns=new LinkedHashMap<String,Object>();try(var r=obs.getMetaData().getColumns(null,null,"ORDER_LINES",null)){while(r.next())columns.put(r.getString("COLUMN_NAME"),Map.of("type",r.getString("TYPE_NAME"),"size",r.getInt("COLUMN_SIZE"),"scale",r.getInt("DECIMAL_DIGITS"),"nullable",r.getInt("NULLABLE")));}
            result.put("orderLineColumns",columns);
            check("ddl-order-id-not-null",((Map<?,?>)columns.get("ORDER_ID")).get("nullable").equals(DatabaseMetaData.columnNoNulls));
            check("ddl-price-precision-scale",((Map<?,?>)columns.get("PRICE")).get("size").equals(19)&&((Map<?,?>)columns.get("PRICE")).get("scale").equals(2));
            var fks=new ArrayList<Map<String,Object>>();try(var r=obs.getMetaData().getImportedKeys(null,null,"ORDER_LINES")){while(r.next())fks.add(Map.of("fkColumn",r.getString("FKCOLUMN_NAME"),"pkTable",r.getString("PKTABLE_NAME"),"pkColumn",r.getString("PKCOLUMN_NAME"),"deleteRule",r.getInt("DELETE_RULE")));}result.put("foreignKeys",fks);
            check("ddl-fk-not-db-delete-cascade",fks.size()==1&&!fks.get(0).get("deleteRule").equals(DatabaseMetaData.importedKeyCascade));
        }
        result.put("sqlPhases",phases);result.put("checks",checks);
        result.put("scope","Original5Javafiles plus separate one-expression DTO correction. Boot4.1.1 non-web/JDK21/H22.4.240/Hibernate7.4.5.Final READ_COMMITTED extra fixture; no MySQL/Java25/HTTP/Docker. SQL raw strings do not include bindings. Observer JDBC queries are outside ORM SQL phases. Dynamic auditing timestamps recorded, not fixed examples. Orphan branch managed; new/detached/removed exclusions not executed.");
        Files.writeString(out.resolve("execution.json"),mapper.writerWithDefaultPrettyPrinter().writeValueAsString(result)+"\n");
    }
}
