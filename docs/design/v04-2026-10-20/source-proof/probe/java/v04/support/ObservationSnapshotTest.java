package v04.support;

import java.io.File;
import java.util.*;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

/** 이후 테스트의 clear/수정이 이미 기록한 관찰값을 바꾸면 안 된다. */
class ObservationSnapshotTest {
 @Test void storesValueAtObservationTime(){
  var nested=new LinkedHashMap<String,Object>();nested.put("id",1);var rows=new ArrayList<Map<String,Object>>();rows.add(nested);
  Proof.record("observer-mutable-source",Proof.map("values",rows));nested.put("id",99);rows.clear();
  Proof.record("observer-trigger-rewrite",Proof.map("phase","after original nested mutation and list clear"));
  var actual=JsonMapper.builder().build().readTree(new File(System.getenv("V04_JAVA_OUTPUT"))).path("facts").path("observer-mutable-source").path("values");
  int count=actual.size(),id=actual.path(0).path("id").asInt(-1);
  Proof.check("observer-deep-snapshot-preserves-record-time",count==1&&id==1,Proof.map("capturedRows",count,"capturedNestedId",id,"originalListAfterClear",rows.size(),"originalNestedAfterChange",nested.get("id")));
 }
}
