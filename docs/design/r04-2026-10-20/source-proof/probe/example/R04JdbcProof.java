package example;

import java.io.File;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.core.SpringVersion;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.AbstractDataSource;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import tools.jackson.databind.json.JsonMapper;

/** 원문 저장소에 추가한 연결·statement·바인딩·자원 종료 관찰용 fixture다. */
public class R04JdbcProof {
    static final List<String> checks=new ArrayList<>();
    static Map<String,Object> map(Object... pairs) {
        Map<String,Object> m=new LinkedHashMap<>();
        for(int i=0;i<pairs.length;i+=2)m.put((String)pairs[i],pairs[i+1]);
        return m;
    }
    static void check(String name,boolean value) {
        if(!value)throw new AssertionError(name);
        checks.add(name);System.out.println("PASS "+name);
    }
    static Object call(Object target,Method method,Object[] args)throws Throwable {
        try{return method.invoke(target,args);}catch(InvocationTargetException e){throw e.getCause();}
    }
    static class ObservedDataSource extends AbstractDataSource {
        final DriverManagerDataSource delegate;
        final List<Map<String,Object>> queries=new ArrayList<>();
        int opened,closed;
        ObservedDataSource(DriverManagerDataSource delegate){this.delegate=delegate;}
        public Connection getConnection()throws SQLException {
            Connection connection=delegate.getConnection();opened++;
            return (Connection)Proxy.newProxyInstance(Connection.class.getClassLoader(),new Class[]{Connection.class},(proxy,method,args)->{
                if(method.getName().equals("prepareStatement")&&args[0]instanceof String sql){
                    PreparedStatement statement=(PreparedStatement)call(connection,method,args);
                    Map<String,Object> bindings=new LinkedHashMap<>();
                    Map<String,Object> event=map("sql",sql,"bindings",bindings,"statementClass",statement.getClass().getName(),"statementClosed",false,"resultClosed",false);
                    queries.add(event);
                    return Proxy.newProxyInstance(PreparedStatement.class.getClassLoader(),new Class[]{PreparedStatement.class},(p,m,a)->{
                        if(m.getName().equals("setLong"))bindings.put(String.valueOf(a[0]),map("method","setLong","value",a[1]));
                        Object value=call(statement,m,a);
                        if(m.getName().equals("executeQuery")&&value instanceof ResultSet rs){
                            return Proxy.newProxyInstance(ResultSet.class.getClassLoader(),new Class[]{ResultSet.class},(rp,rm,ra)->{
                                Object rv=call(rs,rm,ra);
                                if(rm.getName().equals("close"))event.put("resultClosed",rs.isClosed());
                                return rv;
                            });
                        }
                        if(m.getName().equals("close"))event.put("statementClosed",statement.isClosed());
                        return value;
                    });
                }
                Object value=call(connection,method,args);
                if(method.getName().equals("close")){if(!connection.isClosed())throw new AssertionError("connection not closed");closed++;}
                return value;
            });
        }
        public Connection getConnection(String username,String password)throws SQLException {throw new SQLException("fixture only supports configured credentials");}
    }
    public static void main(String[] args)throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        DriverManagerDataSource raw=new DriverManagerDataSource();
        raw.setUrl(System.getenv("R04_DB_URL"));raw.setUsername("r04_probe");raw.setPassword(System.getenv("R04_DB_PASSWORD"));
        Map<String,Object> versions;
        try(Connection c=raw.getConnection();var s=c.createStatement();var rs=s.executeQuery("SELECT @@datadir, VERSION(), @@port, @@bind_address")){
            rs.next();check("jdbc-connects-only-guarded-new-datadir",new File(rs.getString(1)).getCanonicalFile().equals(new File(System.getenv("R04_EXPECTED_DATADIR")).getCanonicalFile()));
            check("jdbc-native-mysql8.4.11-loopback",rs.getString(2).equals("8.4.11")&&rs.getInt(3)==Integer.parseInt(System.getenv("R04_EXPECTED_PORT"))&&rs.getString(4).equals("127.0.0.1"));
            versions=map("spring",SpringVersion.getVersion(),"java",Runtime.version().feature(),"driver",c.getMetaData().getDriverVersion(),"mysql",rs.getString(2));
        }
        ObservedDataSource observed=new ObservedDataSource(raw);
        OrderReadRepository source=new OrderReadRepository(new JdbcTemplate(observed));
        List<OrderReadRepository.OrderSummary> member1=source.findByMemberId(1L),member181=source.findByMemberId(181L);
        check("original-jdbc-member1-six-ordered-summaries",member1.stream().map(OrderReadRepository.OrderSummary::id).toList().equals(List.of(1L,901L,721L,541L,361L,181L)));
        check("original-jdbc-member181-empty",member181.isEmpty());
        check("original-rowmapper-bigdecimal",member1.stream().allMatch(row->row.totalAmount()instanceof BigDecimal));
        check("original-setLong-index1-values1-and181",observed.queries.size()==2&&observed.queries.get(0).get("bindings").equals(map("1",map("method","setLong","value",1L)))&&observed.queries.get(1).get("bindings").equals(map("1",map("method","setLong","value",181L))));
        check("jdbc-two-source-connections-closed",observed.opened==2&&observed.closed==2);
        check("jdbc-statements-and-resultsets-closed",observed.queries.stream().allMatch(q->q.get("statementClosed").equals(true)&&q.get("resultClosed").equals(true)));
        List<Map<String,Object>> summaries=member1.stream().map(row->map("id",row.id(),"orderNo",row.orderNo(),"totalAmount",row.totalAmount().toPlainString())).toList();
        Map<String,Object> result=map("versions",versions,"scope","original OrderReadRepository unchanged; added JDK21 standalone JdbcTemplate/DataSource/observer; Boot4.1.1 BOM only; Java25/Boot app/YAML/HTTP not executed","member1",summaries,"member181",member181,"queries",observed.queries,"trackedSourceConnections",map("opened",observed.opened,"closed",observed.closed,"excludes","setup/native guard/metadata queries"),"checks",checks);
        JsonMapper.builder().build().writeValue(new File(System.getenv("R04_JDBC_OUTPUT")),result);
    }
}
