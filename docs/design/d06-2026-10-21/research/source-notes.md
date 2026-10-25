# Source notes (2026-10-21)

짧은 자체 요약이며 원문 발췌가 아니다.

- Spring Boot 4.1 reference URL은 `/4.1/`에서 현재 문서로 이동했고 헤더가 4.1.1임을 보였다. 외부 속성은 config data < OS env < Java system property < CLI 순서다. Profiles는 YAML 선택에도 영향을 준다.
- Boot graceful shutdown은 embedded Tomcat 포함 기본 활성이다. 진행 중 HTTP 요청에 lifecycle timeout까지 유예하고 신규 요청을 받지 않는다. 외부 종료 제한이 더 짧으면 결과를 보장할 수 없다.
- Actuator health URL은 기본 `/actuator/health`; liveness/readiness group은 자동 활성이고 전체 health와 구성 목적이 다르다. Ready 신호는 외부 router/probe가 반영해야 트래픽 경로가 바뀐다.
- Boot 4.1.1 availability 및 web server 타입 경로를 확인했다. Tomcat은 shutdown 후 새 연결 및 기존 유휴 연결의 새 요청을 거절한다.
- Kubernetes Deployment 기본 RollingUpdate는 Pod 교체 정책이다. weighted HTTP canary 예제는 별도 stable/canary Service 및 Gateway API controller를 사용한다.
- Fowler의 canary/blue-green/feature-toggle/parallel-change 문서는 각각 트래픽 표본, 환경 cut-over, 조건부 기능 동작, 인터페이스 단계 변경을 구분하는 근거다.
- H2 in-memory 데이터는 기본적으로 JVM 범위이고 마지막 연결 종료 시 사라질 수 있다. 예시용 H2 데이터는 운영 DB 이관 검증을 뜻하지 않는다.
- systemd는 unit에 지정한 프로세스 수명·재시작 정책을 관리한다. JAR, Docker, PaaS 이름만으로 운영 승인·라우팅·복구 절차가 정해지지 않는다.

URL 목록/접근 판정은 `../source-access.json` 참조.
