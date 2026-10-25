package example.order;

import java.math.BigDecimal;
import java.nio.file.*;
import java.lang.reflect.*;
import java.sql.*;
import java.util.*;
import org.hibernate.*;
import org.hibernate.boot.*;
import org.hibernate.boot.registry.*;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import tools.jackson.databind.json.JsonMapper;

/** 원문 엔티티/mapper를 별도 H2 메모리 DB에서 관찰한다. Boot/OSIV/HTTP 실험이 아니다. */
public class W09Proof {
    static final List<String> sql = new ArrayList<>();
    static final Map<String,Object> results = new LinkedHashMap<>();
    static int checks;
    static void set(Object object,String name,Object value) {
        try { Field field=object.getClass().getDeclaredField(name); field.setAccessible(true);field.set(object,value); }
        catch(ReflectiveOperationException e){throw new RuntimeException(e);}
    }
    static void check(String label,boolean valid) {
        if(!valid)throw new AssertionError(label);checks++;System.out.println("PASS "+label);
    }
    static List<String> finishSql(String phase) {
        List<String> copy=List.copyOf(sql);results.put(phase+"Sql",copy);sql.clear();return copy;
    }
    static String causes(Throwable error) {
        StringBuilder out=new StringBuilder();for(Throwable e=error;e!=null;e=e.getCause()){out.append(e.getClass().getName()).append(" -> ");if(e.getCause()==e)break;}return out.toString();
    }
    public static void main(String[] args)throws Exception {
        JsonMapper mapper=JsonMapper.builder().build();
        StandardServiceRegistry registry=new StandardServiceRegistryBuilder()
          .applySetting("hibernate.connection.driver_class","org.h2.Driver")
          .applySetting("hibernate.connection.url","jdbc:h2:mem:w09_concept;DB_CLOSE_DELAY=-1")
          .applySetting("hibernate.hbm2ddl.auto","create-drop")
          .applySetting("hibernate.generate_statistics",true)
          .applySetting("hibernate.default_batch_fetch_size",0)
          .applySetting("hibernate.cache.use_second_level_cache",false)
          .applySetting("hibernate.session_factory.statement_inspector",(StatementInspector) query->{sql.add(query);return query;})
          .build();
        try(SessionFactory factory=new MetadataSources(registry).addAnnotatedClass(OrderEntity.class)
          .addAnnotatedClass(OrderItemEntity.class).addAnnotatedClass(CustomerEntity.class).buildMetadata().buildSessionFactory()) {
            try(Session session=factory.openSession()){
                var tx=session.beginTransaction();
                for(int i=1;i<=3;i++){
                    CustomerEntity customer=new CustomerEntity();set(customer,"name",i==1?"Mina":"Customer-"+i);set(customer,"email","customer"+i+"@example.com");set(customer,"internalMemo","internal-"+i);session.persist(customer);
                    OrderEntity order=new OrderEntity();set(order,"status","PAID");set(order,"total",new BigDecimal(i==1?"12000.00":"24000.00"));set(order,"customer",customer);session.persist(order);
                    OrderItemEntity item=new OrderItemEntity();set(item,"order",order);session.persist(item);
                }
                tx.commit();
            }
            sql.clear();
            OrderEntity detached;
            try(Session session=factory.openSession()) {
                detached=session.find(OrderEntity.class,1L);
                check("closed-initial-customer-lazy",!Hibernate.isInitialized(detached.getCustomer()));
                check("closed-initial-items-lazy",!Hibernate.isInitialized(detached.getItems()));
            }
            finishSql("closedFind");
            boolean lazy=false;try { detached.getCustomer().getName(); }catch(LazyInitializationException e){lazy=true;results.put("closedCause",e.getClass().getName());}
            check("closed-session-lazy-error",lazy);check("closed-error-no-query",sql.isEmpty());finishSql("closedFailure");
            try(Connection observer=DriverManager.getConnection("jdbc:h2:mem:w09_concept");Statement statement=observer.createStatement();ResultSet row=statement.executeQuery("select o.id, o.status, o.total, c.name from orders o join customers c on c.id=o.customer_id where o.id=1")) {
                check("closed-independent-observer-row",row.next() && row.getLong(1)==1L && row.getString(2).equals("PAID") && row.getBigDecimal(3).compareTo(new BigDecimal("12000.00"))==0 && row.getString(4).equals("Mina"));
                results.put("independentObserver",Map.of("id",row.getLong(1),"status",row.getString(2),"total",row.getBigDecimal(3),"customerName",row.getString(4),"scope","separate JDBC connection AFTER Session close/lazy failure; its own SELECT is not part of ORM query counters"));
            }


            try(Session session=factory.openSession()) {
                var tx=session.beginTransaction();OrderEntity order=session.find(OrderEntity.class,1L);finishSql("openFind");
                check("open-before-customer-lazy",!Hibernate.isInitialized(order.getCustomer()));
                String name=order.getCustomer().getName();check("open-customer-name",name.equals("Mina"));
                check("open-getter-one-query",finishSql("openGetter").size()==1);
                tx.commit();
            }
            // 열린 Session의 직접 직렬화. OSIV/HTTP 요청은 아니다.
            try(Session session=factory.openSession()) {
                var tx=session.beginTransaction();OrderEntity order=session.find(OrderEntity.class,1L);sql.clear();
                boolean serializationFailed=false;String chain="";
                try { mapper.writeValueAsString(order); }catch(Throwable e){serializationFailed=true;chain=causes(e);}
                check("entity-serialization-fails",serializationFailed);results.put("serializationCauseChain",chain);
                List<String> serializedSql=finishSql("entitySerialization");results.put("entitySerializationSqlCount",serializedSql.size());
                check("entity-serialization-triggered-query",!serializedSql.isEmpty());tx.rollback();
            }
            // 순환 자체는 프록시를 제외한 뒤 같은 원문 객체 그래프로 별도 검사한다.
            OrderEntity cycle=new OrderEntity();set(cycle,"status","PAID");set(cycle,"total",new BigDecimal("12000.00"));
            CustomerEntity plainCustomer=new CustomerEntity();set(plainCustomer,"name","Mina");set(plainCustomer,"email","m@example.com");set(plainCustomer,"internalMemo","internal-only");set(cycle,"customer",plainCustomer);
            OrderItemEntity cycleItem=new OrderItemEntity();set(cycleItem,"order",cycle);set(cycle,"items",new ArrayList<>(List.of(cycleItem)));
            boolean cycleFailed=false;try{mapper.writeValueAsString(cycle);}catch(Throwable e){cycleFailed=true;results.put("plainCycleCauseChain",causes(e));}
            check("plain-bidirectional-cycle-fails",cycleFailed);
            String customerJson=mapper.writeValueAsString(plainCustomer);results.put("directCustomerJson",customerJson);
            check("direct-customer-internal-visible",mapper.readTree(customerJson).get("internalMemo").asString().equals("internal-only"));
            record CustomerPublic(String name) {}
            String publicCustomer=mapper.writeValueAsString(new CustomerPublic(plainCustomer.getName()));
            check("customer-dto-only-name",mapper.readTree(publicCustomer).size()==1 && mapper.readTree(publicCustomer).get("name").asString().equals("Mina"));results.put("publicCustomerJson",publicCustomer);


            sql.clear();List<OrderSummary> summaries;
            try(Session session=factory.openSession()) {
                var tx=session.beginTransaction();List<OrderEntity> orders=session.createQuery("from OrderEntity o order by o.id",OrderEntity.class).list();
                check("list-three-orders",orders.size()==3);check("list-root-one-query",finishSql("listRoot").size()==1);
                summaries=orders.stream().map(OrderSummaryMapper::from).toList();check("manual-three-customer-queries",finishSql("manualMapping").size()==3);tx.commit();
            }
            results.put("listSummaries",summaries);
            check("dto-values-after-close",summaries.get(0).customerName().equals("Mina")&&summaries.get(0).total().compareTo(new BigDecimal("12000.00"))==0);
            sql.clear();String summaryJson=mapper.writeValueAsString(summaries.get(0));check("dto-serialization-no-query",sql.isEmpty());
            check("dto-excludes-internal-fields",!mapper.readTree(summaryJson).has("internalMemo")&&!mapper.readTree(summaryJson).has("email")&&!mapper.readTree(summaryJson).has("customer")&&!mapper.readTree(summaryJson).has("items"));results.put("summaryJson",summaryJson);

            try(Session session=factory.openSession()) {
                var tx=session.beginTransaction();sql.clear();List<OrderEntity> orders=session.createQuery("from OrderEntity o order by o.id",OrderEntity.class).list();finishSql("mapstructRoot");
                OrderSummaryMapStruct mapping=new OrderSummaryMapStructImpl();List<OrderSummary> mapped=orders.stream().map(mapping::toSummary).toList();
                check("mapstruct-values-equal",mapped.equals(summaries));check("mapstruct-three-customer-queries",finishSql("mapstructMapping").size()==3);tx.commit();
            }
            OrderSummary singleProjection;
            try(Session session=factory.openSession()) {
                var tx=session.beginTransaction();sql.clear();OrderSummary single=session.createQuery("select new example.order.OrderSummary(o.id, o.status, c.name, o.total) from OrderEntity o join o.customer c where o.id = :id",OrderSummary.class).setParameter("id",1L).getSingleResult();
                singleProjection=single;check("original-single-projection-values",single.equals(summaries.get(0)));check("original-single-projection-one-query",finishSql("originalSingleProjection").size()==1);tx.commit();
            }
            sql.clear();String projectionJson=mapper.writeValueAsString(singleProjection);
            check("projection-serialization-after-close",sql.isEmpty() && mapper.readTree(projectionJson).equals(mapper.readTree(summaryJson)));results.put("projectionJson",projectionJson);
            try(Session session=factory.openSession()) {
                var tx=session.beginTransaction();sql.clear();List<OrderSummary> projected=session.createQuery("select new example.order.OrderSummary(o.id, o.status, c.name, o.total) from OrderEntity o join o.customer c order by o.id",OrderSummary.class).list();
                check("projection-values-equal",projected.equals(summaries));check("projection-one-query",finishSql("projection").size()==1);tx.commit();
            }
        }finally {StandardServiceRegistryBuilder.destroy(registry);}
        record ItemList(List<String> items) {}
        List<String> original=new ArrayList<>(List.of("one"));ItemList shallow=new ItemList(original);original.add("two");check("record-shallow-change",shallow.items().equals(List.of("one","two")));
        ItemList copied=new ItemList(List.copyOf(original));original.add("three");check("record-copy-stays-two",copied.items().size()==2);
        results.put("checks",checks);results.put("scope","Hibernate7.4.5.Final/H2 2.4.240/JDK21/Jackson3.1.5/MapStruct1.6.3; isolated additional fixture; no MySQL/Boot/OSIV/HTTP/Java25; three distinct customers and orders; batching0/cacheoff");
        Files.writeString(Path.of(args[0],"execution.json"),mapper.writerWithDefaultPrettyPrinter().writeValueAsString(results)+"\n");
    }
}
