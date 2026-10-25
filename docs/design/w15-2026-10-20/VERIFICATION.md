# W15 페이지네이션 보충 학습 검증

2026-10-20, 별도 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night`의 개념 전용 부분 보강이다. 9질문·25상태와 선택 이미지9장(실제23회 생성·14draft)을 구현했다. 원문 전체의 모든 장면·픽셀·학습자 이해도를 완료 처리하지 않는다. merge·push·PR은 하지 않았다.

## 실행한 것과 추가한 것

W15 원문283줄을 전문 검토했고, SQL1펜스의3문장과 Java2파일은 SHA를 확인해 그대로 실행했다. Mermaid1·JSON1은 설명용이다. 기존 원문15,265자·코드4개·앵커23개·전체 개념 지도1개를 생성 HTML 검사에서 보존했다. 실제 Chrome에서는 원문 Mermaid가 SVG1개로 렌더링돼 그 부분만 분리한 나머지15,040자·코드·지도·앵커를 대조했다. Mermaid 원본 자체는 원문 추출과 생성 전 HTML 검사로 보존을 확인했다.

Article entity/schema/seed, standalone Hibernate/JpaRepositoryFactory와 JDBC 관찰 wrapper, 추가 SQL·token toy parser는 원문과 별개의 실험이다. 원문 consume 본문은 주석뿐이다. JDK21·Spring Data JPA/Commons4.1.1·Hibernate7.4.5.Final·Connector/J9.7.0과 Boot4.1.1 BOM을 실제 사용했다. Java25·Boot 앱·HTTP·DTO 전달은 실행하지 않았다. 실제 의존성35개의 SHA를 다시 확인했다.

공식 portable MySQL8.4.11을 매번 0700 run 아래 새datadir(실측0750)·0700 socket디렉터리·자체PID·새127.0.0.1 port·mysqlx OFF로 시작했다. 실제 위치·PID·bind guard를 확인한 후 추가 w15_demo만 만들었다. JDBC는 임시 SELECT-only 계정·매회 새 암호·TLS REQUIRED로 연결했다. 암호는 파일/trace에 기록하지 않았다. 기존 DB·서비스·학습자 테이블·설정·3306은 사용하지 않았고 자기 서버는 정상 종료(exit0)했다. 실제datadir/바이너리는 연구 폴더에만 있다.

## 실제 관찰의 의미

- 추가 데이터는600PUBLISHED+37DRAFT이고 첫70개 정렬 시각이12:00이다. 원문 첫50개는700049…700000, 고정 cursor의51개는699999…699949다. 원문 OFFSET450의699599…699550과 다른 페이지다.
- 동일 결과 비교는 별도 row449의11:52/id699600을 경계로 seek50을 실행했다. 원문 OFFSET450과 행·순서가 같았고 실제 idx_feed의 index iterator는500/50행이었다. 이 조건의 실제 행 수이며 물리 I/O·고정 시간·일반 속도 배수가 아니다.
- timestamp만 비교하면 남은 동률20개699999…699980을 누락했다.51개 중 반환할50번째699950을 cursor로 써야 다음699949를 읽고, peek699949를 cursor로 쓰면699948부터라1개를 누락했다. 이는 추가 결과 분할 관찰이며 실제 HTTP 응답 구현이 아니다.
- 원문 Page는 content50+COUNT total600의2SQL, Slice는 JDBC51행/반환50의1SQL이었다. 추가 DRAFT37 Page는 COUNT를 생략했다. COUNT의 ResultSet1행에600이 담긴 것과600개 객체를 읽는 것은 다르다.
- 원문 keyset loop는12Window×50=600고유행을 정렬 순서로 반환했다. 처음11개는 JDBC51행, 마지막은50행/hasNext=false였다. compare 전체는15SQL이며 setup/guard/metadata SQL은 제외했다. 원문 consume의 외부 처리는 없다.
- 추가 offset Window는 initial offset()과 offset(0)을 구분했다. 마지막 반환 위치49 다음은 SQL offset50, offset(0)은 배타적이어서 offset1부터다. 추가 publishedAt DESC-only method에서는 PK id ASC가 보강됐고 cursor에는 두 Java property가 들어갔다. 혼합DESC/ASC는 동률 id>가 필요했다.
- nullable_probe는 별도 SQL 테이블이다. NULL 꼬리는 단순<조건으로 이어지지 않았다. 추가 Article은 NOT NULL이며 JPA null keyset/projection 오류를 실행한 결과가 아니다.
- 앞 삽입/삭제·뒤늦은 입력·정렬키 이동은 같은 writer의 순서 제어 실험이다. 앞 삽입은OFFSET중복, 앞 삭제는OFFSET누락을 보였고, keyset도 뒤늦은 입력이나 정렬키 이동으로 결과 변화·누락·재등장이 가능했다. snapshot 사례만 두 연결에서 A의 명시RR snapshot/B의autocommit삽입/A의COMMIT 후 새 조회를 구분했다. 여러 HTTP 요청의 snapshot·부하시험이 아니다.
- Base64URL decode·HmacSHA256 MAC·v/status/sort 계약 비교는 공개 고정 테스트키의 추가 helper다. MAC isEqual은 변조에서false이고 !isEqual assertion은true임을 명시했다. 유효한 원래 MAC도 요청 계약이 다르면 추가 parser가 거부했다. 실제 서비스 인증·권한·만료·키 보관·HTTP 토큰 API는 미구현이고 원문JSON은 ...signature placeholder다.

Python18개·Java25개, 고유43 ASSERT ID를 기록했다.43개 독립 실험/SQL이라는 뜻이 아니다. frozen 전체JSON은 메인 새인스턴스 replay와 독립 담당자의 임시복사 실행에서 모두 일치했다. 실행계획 time은 매회 달라 raw4plan+raw4event에 그대로 보존하고 canonical에서는 actual time만 제외했다. operator/index/cost/추정rows/actualrows/loops는 유지했다. canonical trace의 raw EXPLAIN4개 제외와 최초 재현 차이·추가 SQL의 LIMIT 공백 오류도 `source-proof/attempt-notes.json`에 기록했다.

## 시안·브라우저·자동 검사

실제 image_gen23회 중 사실 검수를 통과한9장을 선택했다. 가짜 날짜·테이블·행·시각·actor, 혼합 부등호, 원문응답/SQL, MAC와계약 검사 혼동을 교정하고 이전14장은draft에 보존했다. 메인과 독립 담당자가 선택9장 전체를 실제 열람했다. 버전 스택의 중복이 그림을 밀어내는 부분은 짧은 도입부로 줄이고 전체 버전·실험 조건은 보충 근거에 보존했다.

Chrome1672×941·360×800에서 각각25상태, 총50관찰·18캡처를 확인했다. 원문값/코드/ASSERT/실제run JSON 대조/실제PNG크기/기본 로그접기/핵심자료 기본노출/본문 가로넘침없음을 확인했다. 특수10검사에는 native pan, 완료신호 뒤 실제 clipboard 문자열, 로그/zoom/resize, 키보드, 원문앵커/reload/목록Back/실제Forward가 있다. 기존지도·원문 검사2개와 사이트console0을 기록했다. 독립 담당자는 최종18캡처를 전부 실제 열람하고50관찰·특수10·기존2·console0을 검토했다. run본문은 관찰파일에 저장하지 않아 독립 브라우저 리뷰는 runMatches 검사기록 확인 범위다.

도우미가 모든PNG높이를941로 가정한 실패(window실제940), liveMermaid textContent 비교, REPL 재할당 배열의 캡처 문제는 UI오류와 구분해 기록했다. 마지막50관찰/18캡처는 명시적 로컬배열 반환으로 새로 저장했다. mobile focus crop은 일부 글이 잘려 좌우pan/전체그림 전환이 필요하며 외부 번역확장 overlay는 설정을 바꾸지 않았다. fullpage·stickyheader stitching/픽셀 전수·학습자 이해도는 미검증이다.

최종 build·15관련suite·audit:visual/audit:version-cards/audit:parity는 모두exit0다. HTML339개·링크오류0. 개념원문135개·학습자서버17개·원본worktree3403개 SHA 불변이고 루트main은clean이다. parity기존580건의바이트prefix를 유지해9건만append(589/verified0)했다. inventory44,587항목 중437implemented,6verified는 과거기록이며 이번25상태는 미검토→시안준비→구현으로만 올렸다.

근거는 이 폴더의 `source-proof/`, `research/`, `browser-*.json`, `asset-review.json`, `inventory-transitions.jsonl`, `parity-append.json`, `checks/`에 있다. 공식 조사는 Codex CLI gpt-6-luna/OpenAI 직접 경로로 실행했고 LiteLLM은 쓰지 않았다. 메인은 실제 버전·실행과 공식7개 출처를 별도로 대조했다. 원문 모든장면·물리I/O·속도비율·모든인덱스/규모/격리수준·서비스token/권한·HTTP/DTO·Java25·Boot 앱·nullableJPA/projection·학습자/전수픽셀은 남았다.

Gradle 원시 stdout2파일의2행 끝공백과 plan텍스트4파일의 writer 종결개행은6파일/SHA/줄번호로만 제한한 예외다. plan rawJSON에는 네이티브 문자열이 그대로 있고 텍스트파일은 그 문자열+종결개행1개임을 대조했다. 나머지 staged diff-check는 통과했다. authoredCSS의 여분 EOF공백만 제거한 뒤 final build/test:w15/필수3audit도 다시 통과했으며 CSS 실행 의미·controller·숫자·그림은 변하지 않았다.
