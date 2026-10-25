package v04.support;

import java.io.File;
import java.sql.*;
import java.util.*;
import javax.sql.DataSource;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import tools.jackson.databind.json.JsonMapper;

/** 새 격리 실험의 관찰 저장기. URL·암호·임시port/datadir를 결과에 기록하지 않는다. */
public final class Proof {
    private static final SortedMap<String,Map<String,Object>> facts=new TreeMap<>();
    private static final SortedSet<String> checks=new TreeSet<>();
    private Proof(){}
    public static Map<String,Object> map(Object... pairs){Map<String,Object> m=new LinkedHashMap<>();for(int i=0;i<pairs.length;i+=2)m.put((String)pairs[i],pairs[i+1]);return m;}
    public static synchronized void check(String id,boolean pass,Map<String,Object> value){if(!pass)throw new AssertionError(id+" "+value);checks.add(id);record(id,value);System.out.println("PASS "+id);}
    public static synchronized void record(String id,Map<String,Object> value){
        Map<String,Object> detached=JsonMapper.builder().build().convertValue(value,Map.class);
        if(facts.putIfAbsent(id,detached)!=null)throw new AssertionError("duplicate observation "+id);
        String path=System.getenv("V04_JAVA_OUTPUT");if(path==null)throw new IllegalStateException("V04 private runner environment required");
        JsonMapper.builder().build().writeValue(new File(path),map("checks",new ArrayList<>(checks),"facts",facts));
    }
    public static String url(){String value=System.getenv("V04_DB_URL");if(value==null||!value.matches("jdbc:mysql://127\\.0\\.0\\.1:[0-9]+/ds_practice\\?.*"))throw new IllegalStateException("fresh private loopback URL required");return value;}
    public static String password(){return Objects.requireNonNull(System.getenv("V04_DB_PASSWORD"));}
    public static DriverManagerDataSource mysql(){DriverManagerDataSource ds=new DriverManagerDataSource(url(),"v04_probe",password());guard(ds);return ds;}
    public static void guard(DataSource ds){
        try(Connection c=ds.getConnection();Statement s=c.createStatement();ResultSet rs=s.executeQuery("SELECT @@datadir,@@port,@@bind_address")){
            rs.next();if(!new File(rs.getString(1)).getCanonicalFile().equals(new File(System.getenv("V04_EXPECTED_DATADIR")).getCanonicalFile())||rs.getInt(2)!=Integer.parseInt(System.getenv("V04_EXPECTED_PORT"))||!rs.getString(3).equals("127.0.0.1"))throw new AssertionError("private datadir/port/bind guard");
        }catch(Exception e){throw new IllegalStateException("fresh MySQL guard failed",e);}
    }
    public static Map<String,Object> engine(DataSource ds){
        try(Connection c=ds.getConnection()){
            DatabaseMetaData m=c.getMetaData();return map("engine",m.getDatabaseProductName(),"version",m.getDatabaseProductVersion(),"dataSourceClass",ds.getClass().getName());
        }catch(SQLException e){throw new IllegalStateException(e);}
    }
    public static Map<String,Object> sqlError(Throwable t){
        for(Throwable p=t;p!=null;p=p.getCause())if(p instanceof SQLException e)return map("type",e.getClass().getName(),"code",e.getErrorCode(),"state",e.getSQLState());
        return map("type",t.getClass().getName());
    }
}
