# PR9 검증 범위

HEAD c9786af3 고정. 사용자 요청은 평가이며 제품 코드 수정·커밋·PR 댓글·머지는 하지 않는다.

1. P1 문서 계약: node --test tools/course/validate.test.mjs 및 node tools/course/validate.mjs. 기대: 24개 테스트/30endpoint/15일/68카드. 구조 검사이며 시나리오 실동작과 구분한다.
2. P2 기존 정답: board-server 원래 gradlew test. JDK21, Testcontainers가 소유하는 MySQL/WireMock/Toxiproxy만 사용. 기존 compose DB는 실행하지 않는다. 제한420초.
3. 사이트 빌드: 분리 worktree에서 생성 HTML 재빌드 및 변경 목록 비교.
4. 추가 반례: 정적 검토에서 발견한 결제 재시도 상태, 태그 collation 중복, BCrypt 길이, 동시 수정/카운터를 소유 임시 복사본에서 검증. 반례 테스트는 PR의 기존 검사 수에 포함하지 않는다. 각 실행 제한180초.
