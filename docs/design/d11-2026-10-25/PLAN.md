# D11 task25 개념학습 실행 계획

2026-10-25 메인 설계. 기존24 우선감사와 minor9 교정 이후의 첫 대기 문서다. Task C P09는 별도 검증 사이클이며, 그 통과 전 D11 제품 코드는 수정하지 않는다. 이 파일은 D11 구현 완료가 아니다.

1. 원문314줄·공식 리서치를 대조해 의미 질문별 명세 확정 → docs/knowledge/D11-web-security-basics.md SHA a9ba3c0109c24d61fcfbaf0e013ab2b90cee5dceac5a8432326f4bc7f63e2fba 보존, source line·coverage 매핑 확인.
2. 격리 fixture의 관측·모델 구분 확정 → 기존 서버/DB/학습자와 분리된 임시 SQLite·loopback HTTP 두 출처·브라우저 결과, 실행 환경과 소스SHA/raw 기록.
3. PC 다크 시안 제작 → gpt-image-prompt/imagegen으로 독립 의미 장면별 제작, 실제숫자·코드·읽힘 검수, 최종JPG92만 저장. raw PNG는 외부 generated_images.
4. Luna high로 D11 국소 UI·테스트 구현 → 실제 관측과 설명 모델 라벨, 값·코드·원문·복사·URL/뒤로가기 계약 확인. 공통 reader는 재사용하고 프레임워크를 늘리지 않는다.
5. 하네스 후 Sol high spec → quality 독립검수 → 실패별 수정·재검토. 메인은 실제 PC 다크 장면/복사/확대/reader/소스링크를 확인한다.
6. build/visual/version-cards/parity·보존 해시·기존24 회귀 및 새D11 하네스 → inventory는 증거 범위만 갱신, 로컬 커밋. 사용자 후속 통합 전 push/merge/PR 없음.

## 중요한 전제

원문 Boot4.1.1/Java25와 live공식문서4.1.2를 혼합하지 않는다. 원문 SecurityFilterChain에는 인증 방식·사용자 저장소·Actuator endpoint 선언이 없으므로 private/health의 실제 HTTP status를 지어내지 않는다. Authentication.getName()의 숫자 변환은 별도 전제다. HTTP CORS브라우저 실험은 추가 Python fixture이며 Spring Security 실행 결과가 아니다. SQLite parameter binding은 SQL 값/구문 원리만 확인하며 MySQL/JPA/JDBC server prepare 재현으로 부르지 않는다. 원문코드는 보존하고 추가실험을 명시적으로 분리한다.

모든 기존 learner 파일과 기존 proof/frozen/초기24review는 보존한다. 모바일/라이트 추가 설계·실행·수용 기준은 제외한다. 전체134 또는 D11전체 검증은 실제 coverage와 증거가 갖춰져야 별도 판단한다.
