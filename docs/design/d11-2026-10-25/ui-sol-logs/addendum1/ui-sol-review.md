## 실제 판독 교정 bounded addendum 1

**추가 spec PASS → quality PASS · C/I/M 0/0/0.** 기존 attempt3 PASS와 raw는 유지한다. 변경 범위는 D11 data/test/생성 HTML, FOCUS-DESIGN, 구현 기록5개이며 controller·원문 MD·proof source/raw·이미지는 이전 승인 입력과 같다.

- chain-rules는 정확한 원문184~197행 Java 발췌로 시작 fence만 제외했고 강조줄은 상대6~11이다. version-pinned의136행 prose와 미실행 구분은 유지했다.
- HSTS 그림을 native 크기로 재열람해 모델 호스트 learn.example.test와 기본 max-age=31536000을 확인했다. 원문 헤더의 includeSubDomains는 추가 범위/다음 장면으로 구분한다. 실제 HSTS/DNS/trust 실행 주장을 추가하지 않았다.
- preflight-allowed 표는 Allow-Methods/Allow-Headers의 허용 조건임을 명시한다. 값과 Python source 발췌는 같다.
- CSRF 그림을 다시 읽어 cookie-token의 브라우저→자동 전송→Cookie 요청 영역이 [1,56,56,24] 안에 있음을 확인했다. FOCUS-DESIGN과 독립 테스트 좌표가 같다. 실제PC 확대 수용은 부모 재관측에 남긴다.

명세를 먼저 통과시킨 뒤 기존9변이와 새4교정의 회귀 변이4개를 실행했다. 총13개 모두 AssertionError/exit1, 제어군은 exit0이다. 추가 변이는 Java fence 범위 복귀, HSTS 호스트 복귀, CORS의 모호한 라벨 복귀, cookie-token 이전 focus 복귀이며 제품 디스크 소스는 쓰지 않았다. D11/P09/reader/dark와 diff-check는 모두 exit0, 입력9,753개 SHA 전후 변경0개, W15 생성 HTML은 여전히 HEAD 바이트와 같다.

추가 spec/quality/변이raw/SHA: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/ui-sol-logs/addendum1/
