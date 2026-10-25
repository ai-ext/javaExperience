# 하네스 범위 확장 독립 검수

판정: **한정 승인(PASS_BOUNDED)**. 사양 PASS 후 별도 quality PASS, C/I/M 모두 0건이다.

`--task`는 등록된 task1~134의 유일한 정수 number와 taskId가 동일 행일 때만 진행한다. task135 등록 반례도 거부한다. 기존 24개 순서·내용과 `--existing24` 구현은 보존했다. AST 기준 변경 함수는 `_task_for_id`와 도움말 `_parse_args`뿐이며, 파생 exact npm argv·package script·queued·원문 SHA·경로·symlink·timeout·raw exclusive 생성·최신 포인터·HEAD·코드 fingerprint 검사는 기존과 동일하다.

독립 실행한 단위 검사 26/26과 임시 fixture 53개가 통과했다. 정상 task1/24/25/134, 등록135·미등록·malformed·중복·형식 불일치·변조 argv·queued26·문서 ID·source SHA/경로·package·timeout·append-only 전체 raw 바이트·실패한 최신 포인터·fixture 기존24 순서를 대조했다. 실제 24개 및 task25 하네스는 실행하지 않았다.

Luna의 최초 RED 원시 로그는 보존되지 않았다. durable 증거는 HEAD runner와 현재 두 양성 테스트의 **사후 재현 RED**이며, task25/134가 기존 >24 guard에서 각각 실패함을 메타데이터와 raw hash로 확인했다. reviewer도 임시 복사본에서 같은 RED2/2를 독립 재현했다. 현재 GREEN26과 대비할 수 있으나 최초 시간순 TDD까지 인증하지 않는다.

원문135·학습자 서버17·기존 proof1366·초기 리뷰24·사전 dirty2의 SHA가 기준과 일치했고, 고정 입력1,331개는 검토 전후 변경0이다. reviewer의 초기 fixture는 macOS /var와 /private/var 경로 비교 때문에 실패했으며 fixture root.resolve()로 교정 후 53개를 재실행했다. 이 실패 로그를 별도 보존했고 제품은 수정하지 않았다.

근거는 같은 폴더의 `harness-sol-review.json`과 `harness-sol-logs/01-spec-review.json`, `07-quality-review.json`, `08-luna-provenance-review.json`, `09-final-preservation.json`에 있다. 승인 범위는 프로젝트 하네스 선택 기능이며 실제 npm 결과·콘텐츠 전체 완성·외부 권한 정책은 별도다.
