# D06 배포 개념 부분 보강

1. 원문 전문·실제fence를 읽고 SHA/원문 사본/기존 HTML 기준을 고정 → 본문·코드·앵커·Mermaid·기존 지도 보존 검사.
2. 기존 연구와 현재 direct Codex Luna/OpenAI 접근·도움말 확인 뒤 공식 조사 → 메인은 Boot graceful/external config/Actuator/probe와 배포전략 근거·현재 버전을 대조한다. LiteLLM/재위임/다른 모델 전환 없음.
3. 원문은 기존 앱을 가정하므로 모든 Java/bootstrap은 추가 fixture라고 표시 → 원문 Gradle Actuator블록·YAML20s 보존, 실제 Java21·Boot4.1.1·ownloopback/port0·새0700실행사본만 사용한다. 원문 Java25/8080·운영 배포 미실행.
4. 추가 JAR의 SHA와 외부 설정·profile 우선순위·health/business readiness 경계를 실제 HTTP로 관찰 → 같은 산출물과 환경·기능 공개를 구분한다. secret나 사용자자원 변경 없음.
5. 자체 요청이 진행 중인 JVM에만 종료 신호를 보내 graceful 완료/명시 제한초과를 관찰 → 무중단·모든 비동기 작업완료·일반 latency 보장으로 확대하지 않는다.
6. own Python router/두 버전·명시분배의 한정된 요청으로 traffic전환·rollback을 관찰 → 실제Nginx/LB/Kubernetes/운영canary·SLA 검증이 아닌 추가 로컬 모델/실험임을 구분한다.
7. 필요시 별도 in-memory H2 schema에서 full_name→given/family의 추가·수동backfill·옛컬럼제거와 oldquery 호환을 관찰 → 원문DB·실제Flyway/대량온라인DDL·이름보편분리·데이터복구 보장으로 쓰지 않는다. 기존practice데이터는 읽기/변경하지 않는다.
8. native fact freeze/fresh/독립재현 후 스킬 학습계약·검수 기반 실제 imagegen/JPG만 선정·교정 → 작은UI에현재코드/값/그림초점을 연결하고 긴원문·전체추가코드·모델근거를 보존한다.
9. build/관련검사/필수3audit와 actualviewport 전후·desktop/mobile·copy/keyboard/history/pan/live원문 대조 → implemented로만 로컬체크포인트. merge/push/PR·실제클라우드/registry/K8s 배포 없이 전체goal진행.
