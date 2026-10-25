# D07 조사 출처와 정정

REPORT.md와 sources.json은 직접 Codex의 gpt-6-luna/OpenAI 조사 원본이다. 호출은 `--ignore-user-config`와 모델·제공자 명시 옵션을 사용했고, 접근 확인 ACCESS_OK와 조사 exit0/웹 도구13회/turn completed를 확인했다. LiteLLM·다른 모델 전환·LLM 재위임은 없다.

원본 보고서의 “기본 설정에서 Luna 접근을 확인할 수 없었다”는 문장은 이번 호출의 명시적 설정을 반영하지 못한 추정이다. 실제 조사 실패나 저장공간·사용량 부족의 증거로 쓰지 않는다. 원본은 보존하고 direct-command.json과 main-verification.json에서 정정했다.

메인은 공식 페이지24개를 열어 결과를 대조했다. 원본이 선택한 Actuator3.4 문헌은 현재 canonical 페이지의 Spring Boot4.1.1 근거로 보완했다. Azure HNS는 디렉터리 의미와 원자적 디렉터리 조작을 뜻하며 모든 POSIX 동작의 인증으로 확대하지 않는다. SaaS Applications의 넓은 Shared 행도 서비스 설정·사용자 코드·접근 제어와 공급자 제품 코드의 운영을 구분해 읽는다.

원문의 /health는 literal ok 응답이다. HTTP 호출과 프로브 응답에 사용할 수 있으나 DB·노드·리전 진단이나 Actuator readiness를 구현한 것은 아니다. 실제 원문 Java21 빌드와 자체 loopback 관측은 메인이 별도로 기록한다. 조사 모델이 네이티브 실행이나 실제 클라우드 배포를 했다고 표시하지 않는다.

추가 시안 검수에서 S3 일반화를 좁혔다. 이 화면의 flat key 예시는 general purpose bucket에 한정하며 directory bucket의 hierarchical namespace는 다른 옵션이다. prefix는 화면 장식만이 아니라 listing과 정책 조건 등에도 쓰인다. 실제 버킷·정책을 생성하거나 변경하지 않았다. 고정 native execution은 바꾸지 않고 화면의 적용 범위를 분명히 한다.
