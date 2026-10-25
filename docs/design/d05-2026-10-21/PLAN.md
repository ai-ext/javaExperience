# D05 디버깅 개념 부분 보강

1. 원문 전체·9fence 여부와 실제 개수/기존 HTML 기준을 검토 → 원문·코드·앵커·Mermaid 보존을 해시/생성 HTML/live 브라우저로 검사한다.
2. 기존 research 확인·현재 direct Codex CLI Luna/OpenAI 접근 확인 후 공식 조사 → 메인은 Throwable/JPDA/jdb/jcmd/Git/Boot 등 실제 버전과 근거를 대조한다. LiteLLM/재위임/모델 전환 없음.
3. 원문 완전 Java를 그대로 별도 private Java21·Boot4.1.1에서 실행 → source/추가bootstrap·도구를 구분하고 자체 loopback/port0 JVM만 제어한다. 원문 Java25/8080/IDE·운영DB 실행으로 표시하지 않는다.
4. HTTP 정상/실패/형변환·cause/첫앱프레임/가상SQLException·추가 suppressed·로거 수준을 실제 관찰 → 메시지로 실제 DB 원인을 단정하지 않는다.
5. 자체 추가 Java에서 jdb/JDWP·step·Evaluate 영향, 자체 JVM만 jcmd Thread.print, 새 temp Git bisect의 일정한 regression criterion을 관찰 → IDE 조작/사용자JVM·heap/운영·Kubernetes 제어 없음.
6. source 보존/동일 frozen 결과/독립 재현 후 의미 장면을 확정 → 스킬 학습 계약·검수 기반 실제 imagegen/JPG만 선정/기술 오류 교정·독립 이미지 검수.
7. 작은 UI/원문·긴코드 보존/build/관련suite/필수3audit와 exactdesktop/mobile각상태·키보드·복사·history 검증 → implemented까지만 로컬 체크포인트. merge/push/PR/전체goal완료 없음.
