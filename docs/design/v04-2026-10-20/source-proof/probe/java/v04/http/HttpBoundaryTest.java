package v04.http;

import java.io.File;
import java.net.URI;
import java.net.http.*;
import java.nio.file.Path;
import java.util.Map;
import org.apache.coyote.AbstractProtocol;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.tomcat.TomcatWebServer;
import org.springframework.boot.web.server.servlet.context.ServletWebServerApplicationContext;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.transaction.TestTransaction;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;
import v04.support.Proof;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes=HttpApp.class,webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"server.address=127.0.0.1","spring.sql.init.mode=never","logging.level.root=ERROR"})
@AutoConfigureMockMvc @Transactional @TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DirtiesContext(classMode=DirtiesContext.ClassMode.AFTER_CLASS)
class HttpBoundaryTest {
 @LocalServerPort int port;
 @Autowired ServletWebServerApplicationContext context;
 @Autowired JdbcTemplate jdbc;
 @Autowired MockMvc mvc;
 final JsonMapper mapper=JsonMapper.builder().build();
 File raw(String name){return Path.of(System.getenv("V04_RUNTIME_DIR"),name).toFile();}
 @BeforeAll void captureOnlyOwnListener(){
  TomcatWebServer server=(TomcatWebServer)context.getWebServer();AbstractProtocol<?> protocol=(AbstractProtocol<?>)server.getTomcat().getConnector().getProtocolHandler();
  Proof.check("http-private-loopback-bound",protocol.getAddress().isLoopbackAddress()&&protocol.getLocalPort()==port,Proof.map("address",protocol.getAddress().getHostAddress(),"portMatchesActualConnector",protocol.getLocalPort()==port,"scope","additional Boot4.1.1/Tomcat11/JDBC H2 app, source OrderHttpTest not executed"));
  mapper.writeValue(raw("http-listener.json"),Proof.map("port",port,"address",protocol.getAddress().getHostAddress(),"pid",ProcessHandle.current().pid()));
 }
 @Test void actualTcpServerCommitEscapesTestRollback()throws Exception{
  jdbc.update("INSERT INTO http_probe VALUES(100)");long testThread=Thread.currentThread().threadId();Map<String,Object> body;int responseStatus;String text;String url="http://127.0.0.1:"+port+"/v04/probe?id=201&marker=100";
  try(HttpClient client=HttpClient.newHttpClient()){
   HttpResponse<String> response=client.send(HttpRequest.newBuilder(URI.create(url)).POST(HttpRequest.BodyPublishers.noBody()).build(),HttpResponse.BodyHandlers.ofString());responseStatus=response.statusCode();text=response.body();body=mapper.readValue(text,Map.class);
  }
  mapper.writeValue(raw("actual-http-response.json"),Proof.map("url",url,"status",responseStatus,"bodyExact",text,"testThreadId",testThread));
  boolean different=((Number)body.get("threadId")).longValue()!=testThread;
  Proof.check("http-tcp-uses-other-thread-and-transaction",responseStatus==201&&TestTransaction.isActive()&&different&&body.get("markerSeen").equals(0)&&body.get("applicationTxActive").equals(true)&&body.get("testManagedTxActive").equals(false),Proof.map("status",responseStatus,"serverThreadDifferent",different,"uncommittedTestMarkerSeenByServer",body.get("markerSeen"),"serverApplicationTxActive",body.get("applicationTxActive"),"serverTestManagedTxActive",body.get("testManagedTxActive"),"testThreadTestTransactionActive",TestTransaction.isActive()));
  TestTransaction.end();int marker=jdbc.queryForObject("SELECT COUNT(*)FROM http_probe WHERE id=100",Integer.class),server=jdbc.queryForObject("SELECT COUNT(*)FROM http_probe WHERE id=201",Integer.class);
  Proof.check("http-server-commit-survives-test-rollback",marker==0&&server==1,Proof.map("testMarker100AfterRollback",marker,"server201AfterRollback",server));int deleted=jdbc.update("DELETE FROM http_probe WHERE id=201");Proof.check("http-committed-row-explicit-cleanup",deleted==1,Proof.map("deletedServerRows",deleted));
 }
 @Test void synchronousMockMvcSharesTestTransaction()throws Exception{
  jdbc.update("INSERT INTO http_probe VALUES(110)");long testThread=Thread.currentThread().threadId();String text=mvc.perform(post("/v04/probe").param("id","211").param("marker","110")).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();Map<String,Object> body=mapper.readValue(text,Map.class);
  mapper.writeValue(raw("mockmvc-response.json"),Proof.map("status",201,"bodyExact",text,"testThreadId",testThread));boolean same=((Number)body.get("threadId")).longValue()==testThread;
  Proof.check("http-sync-mockmvc-joins-test-thread-tx",same&&body.get("markerSeen").equals(1)&&body.get("applicationTxActive").equals(true)&&body.get("testManagedTxActive").equals(true),Proof.map("sameThread",same,"markerSeen",body.get("markerSeen"),"applicationTxActive",body.get("applicationTxActive"),"testManagedTxActive",body.get("testManagedTxActive"),"scope","synchronous dispatcher only, async MVC not tested"));
  TestTransaction.end();int marker=jdbc.queryForObject("SELECT COUNT(*)FROM http_probe WHERE id=110",Integer.class),write=jdbc.queryForObject("SELECT COUNT(*)FROM http_probe WHERE id=211",Integer.class);
  Proof.check("http-sync-mockmvc-write-rolled-back-with-test",marker==0&&write==0,Proof.map("marker110AfterRollback",marker,"mockmvc211AfterRollback",write));
 }
}
