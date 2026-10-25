# D03 REST API 개발 과정 부분 보강

1. 원문332줄6fence를 전문 검토·추출 → SHA/코드/기존지도·Mermaid/앵커 기준을 기록한다.
2. Codex CLI gpt-6-luna/OpenAI 직접 공식 조사 → HTTP 의미·OpenAPI/springdoc·ProblemDetail·검증·호환성 주장과 접근 한계를 대조한다.
3. 원문 TaskController/ApiErrors Java 그대로와 추가 bootstrap·Java21 Gradle/Boot4.1.1 환경 → 새 loopback/port0 실제 POST/GET·Location·JSON·validation·404 오류를 확인한다. 원문 Java25/8080 전체 구성 실행과 구분한다.
4. 실제 springdoc3.1.1 /v3/api-docs·Swagger 경로 → 생성 명세의 경로/응답/스키마를 실제 HTTP와 대조한다. 201을 추론한다고 미리 가정하거나 원문에 없는 annotation을 몰래 넣지 않는다.
5. POST 중복·GET 재호출·입력 경계·프로세스 재시작 → 원문 메모리 map의 범위를 관찰한다. DB·트랜잭션·분산 멱등 키·인증/인가·성능으로 일반화하지 않는다.
6. 소비자 호환·합의·테스트 계층·릴리스 관문은 명시 모델 또는 문헌 → 실제 PR/CI/배포/클라우드/가상 소비자 운영 실험과 구분한다.
7. main freeze/fresh replay·독립 temp 재현 → 원문·의존성 SHA/전체 frozen·실제 raw UUID/port 로그와 자체 자원 종료를 확인한다.
8. 실제 image_gen→좁은 UI→desktop/mobile/copy/history/원문 보존→build/관련 suite/3audit 뒤 local checkpoint. 학습자 src·practice·원래 worktree와 원문을 보존하고 verified/merge/push/PR은 하지 않는다.
