package v04.extra;

import javax.sql.DataSource;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import v04.support.Proof;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** 같은 문자열 입력을 두 엔진의 명시한 기본 collation 조건에서 비교한다. */
class EngineDifferentialTest {
 @Test void mysqlModeDoesNotCopyMysqlCollation(){
  DataSource mysql=Proof.mysql();DriverManagerDataSource h2=new DriverManagerDataSource("jdbc:h2:mem:v04_engine;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1","sa","");
  JdbcTemplate m=new JdbcTemplate(mysql),h=new JdbcTemplate(h2);
  h.execute("CREATE SCHEMA v04_extra");h.execute("CREATE TABLE v04_extra.case_probe(id INT PRIMARY KEY,word VARCHAR(30) NOT NULL UNIQUE)");
  m.update("DELETE FROM v04_extra.case_probe");
  for(JdbcTemplate jdbc:new JdbcTemplate[]{m,h})jdbc.update("INSERT INTO v04_extra.case_probe VALUES(1,'cafe')");
  String caseSql="SELECT CASE WHEN word='CAFE' THEN 1 ELSE 0 END FROM v04_extra.case_probe WHERE id=1",accentSql="SELECT CASE WHEN word='café' THEN 1 ELSE 0 END FROM v04_extra.case_probe WHERE id=1";
  int mysqlCase=m.queryForObject(caseSql,Integer.class),h2Case=h.queryForObject(caseSql,Integer.class),mysqlAccent=m.queryForObject(accentSql,Integer.class),h2Accent=h.queryForObject(accentSql,Integer.class);
  String collation=m.queryForObject("SELECT COLLATION_NAME FROM information_schema.columns WHERE table_schema='v04_extra'AND table_name='case_probe'AND column_name='word'",String.class);
  Proof.check("engine-same-comparison-mysql-ai-ci-vs-h2-mode",mysqlCase==1&&mysqlAccent==1&&h2Case==0&&h2Accent==0,Proof.map("mysqlCase",mysqlCase,"mysqlAccent",mysqlAccent,"h2ModeCase",h2Case,"h2ModeAccent",h2Accent,"mysqlColumnCollation",collation,"h2Settings","MODE=MySQL;DATABASE_TO_LOWER=TRUE; no IGNORECASE/collation override","caseSql",caseSql,"accentSql",accentSql));
  DataIntegrityViolationException duplicate=assertThrows(DataIntegrityViolationException.class,()->m.update("INSERT INTO v04_extra.case_probe VALUES(2,'café')"));h.update("INSERT INTO v04_extra.case_probe VALUES(2,'café')");
  int mysqlRows=m.queryForObject("SELECT COUNT(*)FROM v04_extra.case_probe",Integer.class),h2Rows=h.queryForObject("SELECT COUNT(*)FROM v04_extra.case_probe",Integer.class);Map<String,Object> error=Proof.sqlError(duplicate);
  Proof.check("engine-unique-accent-native1062-vs-h2-two",error.get("code").equals(1062)&&mysqlRows==1&&h2Rows==2,Proof.map("mysqlError",error,"mysqlRows",mysqlRows,"h2ModeRows",h2Rows,"mysqlEngine",Proof.engine(mysql),"h2Engine",Proof.engine(h2)));
  int cleaned=m.update("DELETE FROM v04_extra.case_probe");Proof.check("engine-private-probe-cleaned",cleaned==1,Proof.map("mysqlDeletedRows",cleaned));
 }
}
