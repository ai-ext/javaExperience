package example;

import jakarta.persistence.*;
import java.lang.reflect.Field;
import java.nio.file.*;
import java.sql.*;
import java.util.*;
import org.hibernate.Hibernate;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.*;
import org.hibernate.engine.spi.SessionImplementor;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import tools.jackson.databind.json.JsonMapper;

/** 원문4파일과 추가ProbePost를 격리 native Hibernate/H2에서 실행한다. Spring프록시·HTTP는 실행하지 않는다. */
public class S09Proof {
    static int checks;
    static final Map<String,Object> result=new LinkedHashMap<>();
    static final List<String> sql=new ArrayList<>();
    static final Map<String,List<String>> phases=new LinkedHashMap<>();
    static void check(String name,boolean ok){if(!ok)throw new AssertionError(name);checks++;System.out.println("PASS "+name);}
    static List<String> phase(String name){List<String> copy=List.copyOf(sql);phases.put(name,copy);sql.clear();return copy;}
    record Isolated(StandardServiceRegistry registry,SessionFactory factory,String url)implements AutoCloseable{
        Connection observer()throws SQLException{Connection c=DriverManager.getConnection(url,"sa","");c.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);return c;}
        public void close(){factory.close();StandardServiceRegistryBuilder.destroy(registry);}
    }
    static Isolated open(String name){
        String url="jdbc:h2:mem:"+name+";DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=1000";
        var registry=new StandardServiceRegistryBuilder()
            .applySetting("hibernate.connection.driver_class","org.h2.Driver")
            .applySetting("hibernate.connection.url",url)
            .applySetting("hibernate.connection.username","sa")
            .applySetting("hibernate.connection.password","")
            .applySetting("hibernate.connection.isolation",2)
            .applySetting("hibernate.hbm2ddl.auto","create-drop")
            .applySetting("hibernate.default_batch_fetch_size",0)
            .applySetting("hibernate.jdbc.batch_size",0)
            .applySetting("hibernate.cache.use_second_level_cache",false)
            .applySetting("hibernate.cache.use_query_cache",false)
            .applySetting("hibernate.session_factory.statement_inspector",(StatementInspector)s->{sql.add(s);return s;})
            .build();
        var factory=new MetadataSources(registry).addAnnotatedClass(ProbePost.class).addAnnotatedClass(PurchaseOrder.class).addAnnotatedClass(OrderLine.class).buildMetadata().buildSessionFactory();sql.clear();return new Isolated(registry,factory,url);
    }
    static Map<String,Object> row(Connection c)throws SQLException{
        try(var s=c.createStatement();var r=s.executeQuery("select id,title,version from probe_post where id=42")){
            return r.next()?Map.of("exists",true,"id",r.getLong(1),"title",r.getString(2),"version",r.getLong(3)):Map.of("exists",false);
        }
    }
    static Object field(Object o,String name)throws Exception{Field f=o.getClass().getDeclaredField(name);f.setAccessible(true);return f.get(o);}
    static Map<String,Object> view(EntityManager em,ProbePost p){
        var m=new LinkedHashMap<String,Object>();m.put("id",p.getId());m.put("title",p.getTitle());m.put("version",p.getVersion());m.put("managed",em!=null&&em.isOpen()&&em.contains(p));
        var snapshot=new LinkedHashMap<String,Object>();String status="no-entry";
        if(em!=null&&em.isOpen()){
            var entry=em.unwrap(SessionImplementor.class).getPersistenceContextInternal().getEntry(p);
            if(entry!=null){status=entry.getStatus().name();Object[] loaded=entry.getLoadedState();String[] names=entry.getPersister().getPropertyNames();if(loaded!=null)for(int i=0;i<names.length;i++)snapshot.put(names[i],loaded[i]);}
        }
        m.put("hibernateEntryStatus",status);m.put("hibernateLoadedState",snapshot);return m;
    }
    static void seed(Isolated db){try(EntityManager em=db.factory.createEntityManager()){em.getTransaction().begin();em.persist(new ProbePost(42L,"첫 글"));em.getTransaction().commit();}sql.clear();}
    static String causes(Throwable e){StringBuilder b=new StringBuilder();for(;e!=null;e=e.getCause())b.append(e.getClass().getName()).append(": ").append(e.getMessage()).append('\n');return b.toString();}
    public static void main(String[]args)throws Exception{
        Path out=Path.of(args[0]);JsonMapper mapper=JsonMapper.builder().build();
        try(Isolated db=open("s09_main");Connection observer=db.observer()){
            EntityManager em=db.factory.createEntityManager();em.getTransaction().begin();ProbePost fresh=new ProbePost(42L,"첫 글");
            result.put("newPost",view(em,fresh));check("assigned-id-can-still-be-new",fresh.getId()==42L&&!em.contains(fresh));
            em.persist(fresh);result.put("persistedBeforeFlush",view(em,fresh));check("persist-registered-managed",em.contains(fresh));check("assigned-persist-delays-insert",phase("seedPersistSql").isEmpty());
            check("persist-before-flush-observer-empty",row(observer).equals(Map.of("exists",false)));
            em.flush();result.put("seedAfterFlushInside",em.unwrap(Session.class).doReturningWork(S09Proof::row));result.put("seedAfterFlushOutside",row(observer));check("seed-flush-insert-one",phase("seedFlushSql").size()==1);check("seed-flush-not-commit",!(boolean)row(observer).get("exists"));
            em.getTransaction().commit();phase("seedCommitSql");em.close();check("seed-commit-row-visible",row(observer).get("title").equals("첫 글")&&row(observer).get("version").equals(0L));
            em=db.factory.createEntityManager();em.getTransaction().begin();ProbePost first=em.find(ProbePost.class,42L);check("first-find-one-select",phase("firstFindSql").size()==1);result.put("firstFind",view(em,first));ProbePost second=em.find(ProbePost.class,42L);check("second-find-same-instance",first==second);check("second-find-no-select",phase("secondFindSql").isEmpty());
            first.setTitle("수정된 글");result.put("changedBeforeFlush",view(em,first));result.put("changedBeforeFlushInside",em.unwrap(Session.class).doReturningWork(S09Proof::row));result.put("changedBeforeFlushOutside",row(observer));
            check("changed-java-before-flush",first.getTitle().equals("수정된 글")&&((Map<?,?>)view(em,first).get("hibernateLoadedState")).get("title").equals("첫 글"));
            check("changed-before-flush-db-old",em.unwrap(Session.class).doReturningWork(S09Proof::row).get("title").equals("첫 글")&&row(observer).get("title").equals("첫 글"));check("setter-no-sql",phase("setterSql").isEmpty());
            em.flush();List<String> update=phase("dirtyFlushSql");result.put("changedAfterFlush",view(em,first));result.put("dirtyAfterFlushInside",em.unwrap(Session.class).doReturningWork(S09Proof::row));result.put("dirtyAfterFlushOutside",row(observer));
            check("dirty-flush-one-update",update.size()==1&&update.get(0).startsWith("update probe_post "));
            check("loaded-state-refreshes-after-flush",((Map<?,?>)view(em,first).get("hibernateLoadedState")).get("title").equals("수정된 글")&&first.getVersion()==1L);
            check("flush-inside-new-outside-old",em.unwrap(Session.class).doReturningWork(S09Proof::row).get("title").equals("수정된 글")&&row(observer).get("title").equals("첫 글"));
            em.getTransaction().commit();phase("dirtyCommitSql");em.close();result.put("committedPost",row(observer));check("commit-outside-new-version-one",row(observer).get("title").equals("수정된 글")&&row(observer).get("version").equals(1L));
            first.setTitle("준영속 수정");em=db.factory.createEntityManager();em.getTransaction().begin();ProbePost merged=em.merge(first);phase("mergeReadSql");
            check("merge-original-remains-detached",!em.contains(first));check("merge-returns-distinct-managed",merged!=first&&em.contains(merged));
            check("merge-copies-current-state",merged.getTitle().equals("준영속 수정"));result.put("mergeOriginal",view(em,first));result.put("mergeReturned",view(em,merged));
            first.setTitle("원본만 변경");check("detached-edit-does-not-follow-merge",merged.getTitle().equals("준영속 수정"));merged.setTitle("반환 객체 수정");result.put("mergeEditedOriginal",view(em,first));result.put("mergeEditedReturned",view(em,merged));
            em.getTransaction().commit();phase("mergeCommitSql");em.close();result.put("mergeCommittedRow",row(observer));check("merge-returned-edit-committed",row(observer).get("title").equals("반환 객체 수정")&&row(observer).get("version").equals(2L));
            em=db.factory.createEntityManager();em.getTransaction().begin();ProbePost removed=em.find(ProbePost.class,42L);sql.clear();em.remove(removed);result.put("removedBeforeFlush",view(em,removed));
            check("removed-not-contained",!em.contains(removed));check("remove-schedules-no-sql-yet",phase("removeScheduleSql").isEmpty());check("removed-before-flush-outside-row-kept",(boolean)row(observer).get("exists"));
            em.flush();check("remove-flush-one-delete",phase("removeFlushSql").size()==1);result.put("removedInsideAfterFlush",em.unwrap(Session.class).doReturningWork(S09Proof::row));result.put("removedOutsideAfterFlush",row(observer));
            check("removed-inside-gone-outside-kept",!(boolean)em.unwrap(Session.class).doReturningWork(S09Proof::row).get("exists")&&(boolean)row(observer).get("exists"));em.getTransaction().commit();phase("removeCommitSql");em.close();check("remove-commit-outside-gone",!(boolean)row(observer).get("exists"));
            // 원문PurchaseOrder/OrderLine을새transaction에서seed한다. 각주문자식수는2다.
            em=db.factory.createEntityManager();em.getTransaction().begin();for(int i=1;i<=3;i++){PurchaseOrder order=new PurchaseOrder();order.addLine(new OrderLine(i));order.addLine(new OrderLine(i+10));em.persist(order);}em.getTransaction().commit();em.close();sql.clear();
            em=db.factory.createEntityManager();em.getTransaction().begin();List<PurchaseOrder> orders=em.createQuery("select o from PurchaseOrder o order by o.id",PurchaseOrder.class).getResultList();check("original-list-root-one-query",phase("batchRootSql").size()==1);check("original-list-three-parents",orders.size()==3);check("original-collections-initially-lazy",orders.stream().noneMatch(o->Hibernate.isInitialized(o.getLines())));
            var accesses=new ArrayList<Map<String,Object>>();int childTotal=0;for(PurchaseOrder o:orders){int n=o.getLines().size();childTotal+=n;accesses.add(Map.of("orderId",o.getId(),"lines",n,"newSqlSoFar",sql.size()));}result.put("originalBatchAccesses",accesses);List<String> batch=phase("batchCollectionSql");check("original-batch32-one-additional-query",batch.size()==1&&childTotal==6);em.getTransaction().commit();em.close();sql.clear();
            em=db.factory.createEntityManager();em.getTransaction().begin();OrderReadService readService=new OrderReadService();Field emField=OrderReadService.class.getDeclaredField("entityManager");emField.setAccessible(true);emField.set(readService,em);List<PurchaseOrder> fetched=readService.findOrdersWithLines();List<String> join=phase("originalFetchJoinSql");int fetchedChildren=fetched.stream().mapToInt(o->o.getLines().size()).sum();check("original-read-service-one-query",join.size()==1&&fetched.size()==3&&fetchedChildren==6);check("original-fetchjoin-access-no-extra-query",phase("fetchJoinAccessSql").isEmpty());
            int jdbcRows=0;try(Statement statement=observer.createStatement();ResultSet rows=statement.executeQuery(join.get(0))){while(rows.next())jdbcRows++;}result.put("originalFetchJoin",Map.of("ormParents",fetched.size(),"children",fetchedChildren,"separateRawSqlRows",jdbcRows));check("fetchjoin-six-jdbc-rows-not-three",jdbcRows==6);em.getTransaction().commit();em.close();sql.clear();
            em=db.factory.createEntityManager();em.getTransaction().begin();EntityGraph<PurchaseOrder> graph=em.createEntityGraph(PurchaseOrder.class);graph.addAttributeNodes("lines");List<PurchaseOrder> graphed=em.createQuery("select o from PurchaseOrder o order by o.id",PurchaseOrder.class).setHint("jakarta.persistence.fetchgraph",graph).getResultList();int graphChildren=graphed.stream().mapToInt(o->o.getLines().size()).sum();result.put("extraFetchGraph",Map.of("parents",graphed.size(),"children",graphChildren,"sqlCount",sql.size()));check("extra-fetchgraph-one-query-here",phase("extraFetchGraphSql").size()==1&&graphChildren==6);em.getTransaction().commit();em.close();sql.clear();
            // 추가 pagination은 원하는 결과를 가정하지 않고 실제 query 설정·SQL·반환값을 보관한다.
            String fetchHql="select distinct o from PurchaseOrder o left join fetch o.lines order by o.id";
            var paginationCases=new ArrayList<Map<String,Object>>();
            for(String variant:List.of("fetch-api-max1","fetch-api-first0-max1","fetch-memory-hint-max1","fetch-hql-limit1","plain-root-api-max1")){
                try(EntityManager pageEm=db.factory.createEntityManager()){
                    pageEm.getTransaction().begin();boolean collectionFetch=!variant.startsWith("plain");TypedQuery<PurchaseOrder> query=pageEm.createQuery(collectionFetch?fetchHql+(variant.equals("fetch-hql-limit1")?" limit 1":""):"select o from PurchaseOrder o order by o.id",PurchaseOrder.class);
                    if(!variant.equals("fetch-hql-limit1"))query.setMaxResults(1);
                    if(variant.equals("fetch-api-first0-max1"))query.setFirstResult(0);
                    if(variant.equals("fetch-memory-hint-max1"))query.setHint("org.hibernate.limitInMemory",true);
                    int configuredMax=query.getMaxResults(),configuredFirst=query.getFirstResult();List<PurchaseOrder> actual=query.getResultList();List<Long> ids=actual.stream().map(PurchaseOrder::getId).toList();List<Integer> sizes=collectionFetch?actual.stream().map(o->o.getLines().size()).toList():List.of();
                    List<String> emitted=phase(variant+"Sql");var observation=new LinkedHashMap<String,Object>();observation.put("variant",variant);observation.put("configuredMaxResults",configuredMax);observation.put("configuredFirstResult",configuredFirst);observation.put("parentIds",ids);observation.put("collectionSizes",sizes);observation.put("limitInMemoryHint",query.getHints().getOrDefault("org.hibernate.limitInMemory","not-exposed"));observation.put("sqlPhase",variant+"Sql");
                    int rawRows=0,parameterCount;try(PreparedStatement statement=observer.prepareStatement(emitted.get(0))){parameterCount=statement.getParameterMetaData().getParameterCount();if(parameterCount==1)statement.setInt(1,1);if(parameterCount<=1){try(ResultSet rows=statement.executeQuery()){while(rows.next())rawRows++;}}else rawRows=-1;}
                    observation.put("rawObserverParameterCount",parameterCount);observation.put("rawObserverExplicitLimitBinding",parameterCount==1?"1 -> 1":"none or skipped");observation.put("rawObserverRows",rawRows);paginationCases.add(observation);
                    check("pagination-"+variant+"-one-statement-observed",emitted.size()==1);
                    if(!variant.equals("fetch-hql-limit1"))check("pagination-"+variant+"-configured-max-one",configuredMax==1);
                    if(variant.equals("plain-root-api-max1"))check("pagination-plain-root-control-one-parent",actual.size()==1&&ids.equals(List.of(1L)));
                    pageEm.getTransaction().rollback();
                }
            }
            result.put("paginationCases",paginationCases);result.put("runtimeVersions",Map.of("hibernate",org.hibernate.Version.getVersionString(),"h2",observer.getMetaData().getDatabaseProductVersion()));Files.writeString(out.resolve("pagination-observations.json"),mapper.writerWithDefaultPrettyPrinter().writeValueAsString(paginationCases)+"\n");
            em=db.factory.createEntityManager();em.getTransaction().begin();PurchaseOrder target=em.find(PurchaseOrder.class,1L);int before=target.getLines().size();sql.clear();new OrderService(em).addLine(1L,99);result.put("originalService",Map.of("beforeLines",before,"afterLines",target.getLines().size(),"versionAfterFlush",field(target,"version")));List<String> serviceSql=phase("originalAddLineServiceSql");check("original-service-direct-java-add-and-flush",target.getLines().size()==before+1&&!serviceSql.isEmpty());em.getTransaction().rollback();em.close();
            // 닫힌 컨텍스트에서 원문 컬렉션의 LAZY 접근을 확인한다.
            em=db.factory.createEntityManager();PurchaseOrder closed=em.find(PurchaseOrder.class,1L);check("original-closed-collection-starts-lazy",!Hibernate.isInitialized(closed.getLines()));em.close();sql.clear();boolean lazyFailed=false;try{closed.getLines().size();}catch(org.hibernate.LazyInitializationException e){lazyFailed=true;result.put("closedLazyCause",e.getClass().getName());}check("original-closed-collection-lazy-fails",lazyFailed);check("closed-lazy-emits-no-query",phase("closedLazyFailureSql").isEmpty());
        }
        try(Isolated db=open("s09_rollback");Connection observer=db.observer()){
            seed(db);EntityManager em=db.factory.createEntityManager();em.getTransaction().begin();ProbePost p=em.find(ProbePost.class,42L);sql.clear();p.setTitle("수정된 글");em.flush();phase("rollbackDirtyFlushSql");result.put("rollbackAfterFlush",Map.of("java",view(em,p),"inside",em.unwrap(Session.class).doReturningWork(S09Proof::row),"outside",row(observer)));check("rollback-branch-flush-inside-new-outside-old",em.unwrap(Session.class).doReturningWork(S09Proof::row).get("title").equals("수정된 글")&&row(observer).get("title").equals("첫 글"));em.getTransaction().rollback();em.close();result.put("rollbackAfterCompletionJava",view(null,p));check("rollback-does-not-revert-java-title-here",p.getTitle().equals("수정된 글"));result.put("rollbackFinalRow",row(observer));check("rollback-restores-db-first-version-zero",row(observer).get("title").equals("첫 글")&&row(observer).get("version").equals(0L));
        }
        try(Isolated db=open("s09_lock");Connection observer=db.observer()){
            seed(db);EntityManager a=db.factory.createEntityManager(),b=db.factory.createEntityManager();a.getTransaction().begin();b.getTransaction().begin();ProbePost pa=a.find(ProbePost.class,42L),pb=b.find(ProbePost.class,42L);phase("lockBothReadsSql");result.put("lockInitial",Map.of("a",view(a,pa),"b",view(b,pb)));check("two-contexts-read-version-zero",pa.getVersion()==0L&&pb.getVersion()==0L&&pa!=pb);pa.setTitle("A 수정");a.getTransaction().commit();phase("lockACommitSql");a.close();check("lock-a-commit-version-one",row(observer).get("version").equals(1L));pb.setTitle("B 수정");String failed="";try{b.flush();}catch(Exception e){failed=causes(e);}result.put("optimisticFailure",failed);phase("lockBFailureSql");check("stale-version-flush-rejected",failed.contains("OptimisticLockException"));if(b.getTransaction().isActive())b.getTransaction().rollback();b.close();result.put("optimisticFinalRow",row(observer));check("stale-update-does-not-overwrite-a",row(observer).get("title").equals("A 수정")&&row(observer).get("version").equals(1L));
        }
        try(Isolated db=open("s09_auto");Connection observer=db.observer()){
            seed(db);EntityManager em=db.factory.createEntityManager();em.getTransaction().begin();em.persist(new PurchaseOrder());em.getTransaction().commit();em.close();sql.clear();em=db.factory.createEntityManager();em.getTransaction().begin();ProbePost p=em.find(ProbePost.class,42L);sql.clear();p.setTitle("쿼리 전 변경");check("default-flush-mode-auto",em.getFlushMode()==FlushModeType.AUTO);em.createQuery("select o from PurchaseOrder o",PurchaseOrder.class).getResultList();List<String> unrelated=phase("autoUnrelatedQuerySql");result.put("autoAfterUnrelated",view(em,p));check("unrelated-query-no-post-update",unrelated.size()==1&&unrelated.get(0).startsWith("select ")&&p.getVersion()==0L);em.createQuery("select p from ProbePost p",ProbePost.class).getResultList();List<String> overlap=phase("autoOverlappingQuerySql");result.put("autoAfterOverlap",view(em,p));check("overlap-auto-update-before-select",overlap.size()==2&&overlap.get(0).startsWith("update probe_post ")&&overlap.get(1).startsWith("select ")&&p.getVersion()==1L);check("auto-flush-still-not-commit",row(observer).get("title").equals("첫 글"));em.getTransaction().rollback();em.close();
        }
        result.put("checks",checks);result.put("sqlPhases",phases);result.put("scope","Exact original4Javafiles compiled; original services called as direct Java inside manually opened JPA transactions, NO Spring proxies/Boot app/HTTP/OSIV. Additional ProbePost(id42,title,version) is not in S09 source. Native Hibernate7.4.5.Final with Boot4.1.1 BOM/H22.4.240/JDK21; separate READ_COMMITTED autocommit JDBC outside ORM SQL phases; no MySQL/Java25/Docker. Hibernate loadedState is provider internals, not standard JPA snapshot API. @BatchSize32 retained; root3parents/6children, cachesoff/defaultbatch0. Separate DBs for commit/rollback/locking/AUTO; locking uses interleaved resource-local transactions, not HTTP requests or thread latency. RawSQL has no bindings. Extra fetchgraph not original service. Additional pagination API/HQL/hint/control variants observed on H2 without presuming one-parent result; separate JDBC observer binds sole limit parameter1 when present and skips raw rows if more than one parameter. No pessimistic locks/MySQLpagination/upgrade runtime tests.");
        Files.writeString(out.resolve("execution.json"),mapper.writerWithDefaultPrettyPrinter().writeValueAsString(result)+"\n");
    }
}
