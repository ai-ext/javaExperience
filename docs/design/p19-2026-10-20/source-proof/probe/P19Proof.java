package com.example.p19;

import java.nio.file.*;
import java.sql.*;
import java.util.*;
import java.util.concurrent.*;
import javax.tools.*;
import com.zaxxer.hikari.*;
import org.springframework.boot.*;
import org.springframework.context.ConfigurableApplicationContext;
import tools.jackson.databind.json.JsonMapper;

/** 별도 H2/Hikari/Boot non-web 실험. Docker·MySQL·원문 Java25 전체 구성을 실행하지 않는다. */
public class P19Proof {
    static int count;
    static final Map<String,Object> result=new LinkedHashMap<>();
    static void check(String label,boolean ok){if(!ok)throw new AssertionError(label);count++;System.out.println("PASS "+label);}
    static String chain(Throwable error){StringBuilder s=new StringBuilder();for(Throwable e=error;e!=null;e=e.getCause())s.append(e.getClass().getName()).append(": ").append(e.getMessage()).append("\n");return s.toString();}
    static ConfigurableApplicationContext boot(String database){
        SpringApplication application=new SpringApplication(P19Application.class);
        application.setWebApplicationType(WebApplicationType.NONE);
        return application.run(
            "--spring.config.location=optional:classpath:p19-isolated-no-file.yml",
            "--spring.profiles.active=p19-isolated",
            "--spring.datasource.url=jdbc:h2:mem:"+database+";MODE=MySQL;DB_CLOSE_DELAY=-1",
            "--spring.datasource.username=sa","--spring.datasource.password=",
            "--spring.datasource.hikari.maximum-pool-size=2","--spring.datasource.hikari.minimum-idle=1",
            "--spring.jpa.hibernate.ddl-auto=validate","--spring.sql.init.mode=never",
            "--spring.jpa.hibernate.naming.physical-strategy=org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy",
            "--spring.jpa.open-in-view=false","--spring.main.banner-mode=off",
            "--logging.level.root=OFF");
    }
    static Map<String,Integer> pool(HikariDataSource source){var p=source.getHikariPoolMXBean();return Map.of("total",p.getTotalConnections(),"active",p.getActiveConnections(),"idle",p.getIdleConnections(),"waiting",p.getThreadsAwaitingConnection());}
    public static void main(String[]args)throws Exception{
        Path out=Path.of(args[0]);JsonMapper mapper=JsonMapper.builder().build();
        boolean missing=false;try(var ignored=boot("p19_missing")){}catch(Exception error){String details=chain(error);missing=details.contains("missing table [customer]");result.put("validateMissingCause",details);}
        check("validate-missing-table-reject",missing);
        try(Connection observer=DriverManager.getConnection("jdbc:h2:mem:p19_missing","sa","");ResultSet table=observer.getMetaData().getTables(null,null,"CUSTOMER",null)){check("validate-did-not-create-table",!table.next());}
        try(Connection connection=DriverManager.getConnection("jdbc:h2:mem:p19_ready;MODE=MySQL;DB_CLOSE_DELAY=-1","sa","");Statement statement=connection.createStatement()){
            statement.execute("CREATE TABLE customer (id BIGINT NOT NULL AUTO_INCREMENT, display_name VARCHAR(255) NOT NULL, PRIMARY KEY (id))");
        }
        try(var context=boot("p19_ready")){
            var ds=context.getBean(javax.sql.DataSource.class);check("boot-configures-hikari",ds instanceof HikariDataSource);
            HikariDataSource hikari=(HikariDataSource)ds;check("driver-inferred-h2",hikari.getDriverClassName().equals("org.h2.Driver"));
            check("additional-pool-max-two",hikari.getMaximumPoolSize()==2);
            CustomerController controller=context.getBean(CustomerController.class);
            Customer customer=controller.create(new CustomerController.CreateCustomer("Kim"));
            check("direct-controller-identity-id",customer.getId()!=null&&customer.getId()==1L);
            check("direct-controller-display-name",customer.getDisplayName().equals("Kim"));
            check("repository-list-one",controller.findAll().size()==1);
            String json=mapper.writeValueAsString(customer);result.put("customerJson",json);
            check("customer-json",mapper.readTree(json).get("id").asLong()==1&&mapper.readTree(json).get("displayName").asString().equals("Kim"));
            try(Connection observer=DriverManager.getConnection("jdbc:h2:mem:p19_ready","sa","");Statement statement=observer.createStatement();ResultSet row=statement.executeQuery("select id,display_name from customer")){
                check("separate-jdbc-row",row.next()&&row.getLong(1)==1&&row.getString(2).equals("Kim"));
                result.put("observerRow",Map.of("id",row.getLong(1),"display_name",row.getString(2)));
            }
            check("original-naming-strategy-class-present",Class.forName("org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy")!=null);
        }
        HikariConfig config=new HikariConfig();config.setJdbcUrl("jdbc:h2:mem:p19_pool;DB_CLOSE_DELAY=-1");config.setUsername("sa");config.setPassword("");config.setMaximumPoolSize(1);config.setMinimumIdle(1);config.setConnectionTimeout(250);config.setPoolName("P19AdditionalPool");
        try(HikariDataSource one=new HikariDataSource(config)){
            try(Connection initialize=one.getConnection()){}
            result.put("poolIdle",pool(one));check("pool-idle-one",one.getHikariPoolMXBean().getIdleConnections()==1);
            Connection held=one.getConnection();result.put("poolBorrowed",pool(one));check("pool-borrowed-one",one.getHikariPoolMXBean().getActiveConnections()==1&&one.getHikariPoolMXBean().getIdleConnections()==0);
            ExecutorService executor=Executors.newSingleThreadExecutor();
            try{
                Future<String> waiting=executor.submit(()->{try(Connection impossible=one.getConnection()){return "unexpected-success";}catch(SQLTransientConnectionException expected){return expected.getClass().getName();}});
                long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(2);
                while(one.getHikariPoolMXBean().getThreadsAwaitingConnection()==0&&!waiting.isDone()&&System.nanoTime()<deadline)Thread.sleep(5);
                Map<String,Integer> snapshot=pool(one);result.put("poolWaiting",snapshot);check("pool-waiting-one",snapshot.get("waiting")==1&&snapshot.get("active")==1);
                String failure=waiting.get(3,TimeUnit.SECONDS);check("pool-timeout-fails",failure.equals("java.sql.SQLTransientConnectionException"));result.put("poolFailure",failure);
                held.close();long closeDeadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(1);while(one.getHikariPoolMXBean().getIdleConnections()!=1&&System.nanoTime()<closeDeadline)Thread.sleep(5);
                result.put("poolReturned",pool(one));check("pool-close-returns-idle",one.getHikariPoolMXBean().getIdleConnections()==1&&one.getHikariPoolMXBean().getActiveConnections()==0);
            }finally{held.close();executor.shutdownNow();}
        }
        Class<?> mysqlType=Class.forName("org.testcontainers.mysql.MySQLContainer",false,P19Proof.class.getClassLoader());check("tc2-mysql-no-type-parameters",mysqlType.getTypeParameters().length==0);
        JavaCompiler compiler=ToolProvider.getSystemJavaCompiler();Path compileRoot=Files.createTempDirectory("p19-tc-type-");
        try{
            for(boolean generic:new boolean[]{true,false}){
                String type=generic?"MySQLContainer<?>":"MySQLContainer";String constructor=generic?"new MySQLContainer<>(\"mysql:8.4\")":"new MySQLContainer(\"mysql:8.4\")";
                Path source=compileRoot.resolve("TypeCase.java");Files.writeString(source,"import org.testcontainers.mysql.MySQLContainer; class TypeCase { "+type+" db = "+constructor+"; }");
                DiagnosticCollector<JavaFileObject> diagnostics=new DiagnosticCollector<>();
                try(var files=compiler.getStandardFileManager(diagnostics,null,null)){
                    boolean compiled=compiler.getTask(null,files,diagnostics,List.of("-classpath",System.getProperty("java.class.path"),"-d",compileRoot.toString()),null,files.getJavaFileObjects(source.toFile())).call();
                    check(generic?"tc2-original-generic-reject":"tc2-nongeneric-compiles",compiled!=generic);
                    result.put(generic?"genericDiagnostics":"correctedDiagnostics",diagnostics.getDiagnostics().stream().map(d->d.getMessage(Locale.ENGLISH)).toList());
                }
            }
        }finally{try(var paths=Files.walk(compileRoot)){paths.sorted(Comparator.reverseOrder()).forEach(path->{try{Files.delete(path);}catch(Exception ignored){}});}}
        result.put("checks",count);result.put("scope","SpringBoot4.1.1 original4Javafiles with additional JDK21/H2 non-web configuration; directController call; original schema SQL; separateJDBC observer; additional Hikari maximum1/timeout250ms differs from source10/30000ms; Testcontainers type compile ONLY, NO Docker/MySQL/HTTP/Actuator/Java25");
        Files.writeString(out.resolve("execution.json"),mapper.writerWithDefaultPrettyPrinter().writeValueAsString(result)+"\n");
    }
}
