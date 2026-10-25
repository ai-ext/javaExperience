# W15 원문 실행과 추가 실험

확인일은2026-10-20이다. 원문 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W15-paging-offset-vs-cursor.md`의 SQL3과 Java2파일은 SHA를 확인해 그대로 실행했다. `Article`의 실제 entity/schema는 원문에 없어 별도 추가했다. `consume`는 주석뿐이다. Mermaid/JSON은 설명용이고 JSON의 signature는 placeholder다.

`execution.json`과 `checkpoints/expected-current-execution.json`은 새 인스턴스 replay에서 동일했다. Python18개/Java25개 고유 ASSERT ID를 기록했다. 이는43번의 독립 실험 또는43개 SQL이라는 뜻이 아니다. 원문 Java compare가 만든 SQL은15개(Page2+Slice1+Window12)이고 추가 guard/setup/metadata는 포함하지 않는다.

```bash
cd LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night
LOCAL_HOME/research/javaexperience-r03-20261020/_data/venv/bin/python docs/design/w15-2026-10-20/source-proof/run-proof.py \
  --mysql-base LOCAL_HOME/research/javaexperience-r03-20261020/_data/portable/mysql-8.4.11-macos15-arm64 \
  --runtime-root LOCAL_HOME/research/javaexperience-w15-20261020/_data/runtime
```

매 실행마다 0700 run 아래 새datadir(실측0750)·0700 socket디렉터리·loopback전용임시port·자체PID를 확인하고 `w15_demo`를 만든다. R03/R04의외부원본/schema사본/기존DB·3306은 사용하지 않는다. JDBC에는 새 SELECT-only 계정·매회 암호·TLS REQUIRED를 쓴다. 실제datadir/socket/port/PID가 맞아야 실험을 시작하며 자기 서버를 정상 종료한다. 인증값은 파일·SQL trace·로그에 넣지 않는다. 실제datadir는 연구폴더에만 있고 Git에 포함하지 않는다.

추가 entity의DATETIME(6)/LocalDateTime/NOT NULL, JavaUTC, MySQL+00:00은 이 실험 조건이다. 원문 JSON의Z 직렬화·Java25·Boot 앱·HTTP·DTO·실제서비스consume를 실행하지 않았다. 의존성 버전과 SHA는 `dependencies.json`에 있다. BOM4.1.1/Spring Data JPA+Commons4.1.1/Hibernate7.4.5.Final/JDK21/ConnectorJ9.7.0을 실제 사용했다.

추가 seed는600PUBLISHED+37DRAFT로 첫70행 timestamp가12:00이다. 원문 첫50행의 마지막id700000과 고정커서literal이 연결된다. 원문 OFFSET450은 다른 페이지이므로 원문 literal 커서와 같은 결과 비교를 하면 안 된다. 별도로 row449의11:52/id699600 경계에서 seek50을 실행해 OFFSET450과 행·순서가 같음을 확인했다. 이 fixture의 covering idx_feed에서 실제 index iterator는 각각500/50행이었다. 쿼리계획 출력의 DESC 인덱스 내부 range 표기는 원문 predicate의 반대 방향으로 읽지 않는다.

`EXPLAIN ANALYZE`는 실제 SELECT를 실행한다. `plans/`에는 마지막 replay의 raw plan·SQL·parameter가 그대로 있다. elapsed time은 매회 바뀌어 canonical 실행결과에는 넣지 않았다. 실제 operator/index/cost/추정 rows/actual rows/loops는 유지했다. canonical trace에서도 raw EXPLAIN4개를 제외하고 별도 plans에 연결한다. 첫 replay 차이는 이4개 timing문자열뿐임을 재귀 대조했고 수정 후 새 replay가 일치했다. 원자료는 run별 별도 폴더에 남긴다. 고정시간·속도배수·물리I/O 보장은 없다.

Source Page는 content50+count600의2SQL, Slice는51행을 확인하고50반환하는1SQL, keyset은12windows×50=600unique였다. 처음11windows는 JDBC51행, 마지막은50행이며 hasNext=false다. added draft37 Page는COUNT를 생략했다. 추가 offset Window의 initial은OFFSET0, offset(0)은 배타적이어서OFFSET1, 마지막 반환position49 다음은OFFSET50이었다. Window 자체가 keyset인 것은 아니다. 추가method에서 publishedAt DESC만 지정하자 PK id ASC가 보강됐고 tuple에 둘 다 들어갔다.

앞 삽입·삭제, 뒤늦은 행·정렬키 변경은 같은 writer 세션에서 순서대로 제어한 추가 사례다. snapshot만 두 연결에서 A의명시적RR snapshot/B의autocommit삽입/A의COMMIT후 새 읽기를 관찰했다. 여러 HTTP 요청의 snapshot 유지나 동시 부하를 검증한 것이 아니다. 별도 nullable SQL 테이블에서 NULL이 부등식으로 이어지지 않는 것을 보였으며 JPA nullable keyset/projection 오류는 실행하지 않았다.

Token은 공개된 고정 테스트키의 HmacSHA256와 단순 contract parser를 쓴 추가 Java다. 원문 JSON/API를 실행한 결과가 아니다. Base64 변조 decode·MAC 비교 실패·유효서명에 잘못된status/sort/version일 때 contract거부를 관찰했다. 서비스권한·인증·만료·키보관·정식토큰구문은 미구현이다.

추가 SQL 토큰에 공백을 빠뜨린 최초1064와 이후 수정, timing 재현 차이는 `attempt-notes.json`에 기록했다. 원문 코드는 고치지 않았다. 원본 원문·학습자 서버·원본 worktree 보존은 최종 VERIFICATION에서 따로 확인한다.

EXPLAIN 텍스트 파일은 네이티브 문자열에 writer가 파일 종결 개행1개를 더한 형태다. 원래 문자열은 같은 이름의 explain-raw.json의 rows[0].EXPLAIN에 정확히 보존했다. 이6개 raw 근거 파일의 Gradle 끝 공백/plan EOF 개행은 SHA와 줄 번호로만 예외를 제한하며 결과를 잘라 Git 검사를 맞추지 않는다.
