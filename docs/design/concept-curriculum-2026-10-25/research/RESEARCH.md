# 공식 근거와 새 실행의 구분

확인일 2026-10-25. 조사 범위는 C01–C06의 기본 주장 22개와 공식 출처 19개다. 전체 기존 134개 원문의 내용·실행 검증을 마쳤다는 뜻이 아니다.

## 공식 문서 본문 확인 경로

최종 sources ledger는 직접 Codex CLI의 OpenAI `gpt-6-luna/high` 조사 실행과, 메인이 지시한 동일 모델·제공자·강도의 S14 표적 후속 조회 결과를 함께 반영한다. 첫 실행은 native web 조회 8개, shell 0, nested delegation 0이다. 그때 19개 중 18개는 native 본문을 열어 대조했으나 S14 `ConfigurableApplicationContext`는 검색 snippet만 있었고 ledger의 `read` 상태가 잘못됐다.

메인의 요청으로 수행한 표적 후속 1회에서 S14 공식 API 본문을 직접 열어 확인했다. 이 조회도 shell 0, nested delegation 0이며 모델·제공자는 첫 실행과 같다. 재위임이나 모델 변경은 없었다. 따라서 최종 본문 대조는 19/19이며, S14의 `read` 판정과 C06 claim C21의 근거·범위를 본문 기준으로 바로잡았다. 세부 실행 ID와 최초/최종 대조 수는 `sources.json`의 `provenance.followups` 및 `provenance.sourceReadAudit`에 기록했다.

초기 조사 때 내부 CLI를 재호출한 재귀 실행은 승인된 직접 조사 경로와 맞지 않아 채택하지 않았다. 이 미채택 시도와 위 표적 후속 조회는 별개의 사건이다. 미채택 원자료는 연구 폴더에 보존했다.

메인은 DI, 초기화/소멸 콜백, Lombok 생성자·Gradle·delombok, Retention, SpringBootApplication 관련 공식 페이지 7개의 본문을 표본 대조했다. 이는 7개 표본 확인이며, 메인이 전체 19개를 재열람했다는 의미가 아니다. 현재 웹 페이지와 fixture 버전의 차이도 claim 범위에 남겼다.

현재 공식 웹 페이지는 Framework 7.0.10·Boot 4.1.2·Lombok Gradle 예시 1.18.48이었다. 새 실행 fixture는 Java 21.0.6·Boot 4.1.1·Framework 7.0.9·Lombok 1.18.46이다. 기본 원리와 fixture에서 실제 관찰한 결과를 연결했으며 버전 간 모든 차이를 검증한 것은 아니다.

출처 확인은 공식 본문이 특정 주장을 뒷받침하는지에 대한 기록이며 코드 실행과 구분한다. 실제 새 실행은 `proof/execution.json`에 명령·원문 SHA·assertion·출력·버전·한계로 기록했다. 기존 P11의 delombok 출력이나 W19의 일부 Java 실행 기록을 이번 실행으로 대체하거나 확대하지 않았다.
