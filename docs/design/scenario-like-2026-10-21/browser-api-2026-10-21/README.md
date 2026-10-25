# 좋아요 폼의 실제 HTTP·SQL 검증

정본4-1의 새 reference.zip을 별도 임시 프로젝트에 실제 압축 해제해 실행했다. 파일별 정본82개와 실행 보충7개를 독립 구성한 정본과 바이트로 대조했다. 브라우저는 별도 문서 origin127.0.0.1:53379, 앱은127.0.0.1:53700, MySQL은127.0.0.1:53668이었다. 이 주소들은 검증 당시 주소이며 앱·DB·QA문서 서버는 끝난 뒤 정리했다. 기본 미리보기53323과 학생 src·기존 DB는 변경하지 않았다.

`browser-observations.json`은 실제 CUA의 입력·전송 클릭 이후 DOM에 표시된 원문 응답23건이다. evaluate로 HTTP를 보내거나 fetch를 교체하지 않았다. `report.json`의 requests는0건으로, Runner가 과제 HTTP를 대신 호출하지 않았음을 구분한다. report의18개 likeObservations는 별도 SQL 관찰 묶음이며 SQL문18개라는 뜻은 아니다. UI의 빈 본문은 `(본문 없음)` 표지로 기록된다.

## 확인한 흐름

| 장면 | 실제 결과 |
|---|---|
| 다른 회원의 새 글 | 작성자4의 POST201·Location·실제 id22 |
| 새 글의 PUT/PUT/DELETE/DELETE | 200과0→1→1→0→0, 첫 PUT 관계id12·시각이 재요청에서 유지 |
| 다른 두 회원이 있는 경우 | 2→3→3→2→2, 회원3·6의 관계id13·14·시각 보존 |
| 본인 글 | 별도 POST id23/작성자2, PUT400·관계 없는 DELETE200·false·0 |
| 인증/상태/없음 | DELETE401+노출된 WWW-Authenticate, 정지403, 없는 글 PUT404 |
| 홈 복귀 | 명시 시작과3/4 확인, 홈의 LikeService#like 이어하기, reload의3개 체크·id22·서버주소 복원. 토큰과 실제 응답은 새 페이지에서 초기화 |
| 개념 새 탭 | S08의 공개 caller·흰 읽기 톤·좋아요 과제 링크. 닫은 뒤 id·선택 시점·입력 유지 |
| 다음 과제 | 수동4/4의 자동 채점 아님 안내, 홈에서 취소 시작 후 id22와 빈 토큰, 실제 DELETE200·숫자2 |
| 다른 과제 탐색 | 이미 완료한 좋아요를 다시 보거나 CRUD를 둘러봐도 활성 ‘좋아요 취소 완료’ 기록 유지 |
| 알려진 삭제 연결 수정 | 수정 전 삭제id22가 좋아요에 남는 문제 재현. 새 글24로 수정 후 PUT200→글DELETE204, 좋아요id는 빈 값·CRUD의 확인id24는 유지 |
| 삭제 후 접근 | 글22/24는 PUT404. SQL에는 글과 관계가 남고 id24의 삭제 후404도 추가 변경 없음 |

다른 두 회원의 관계는 **소유한 일회용 DB에만 SQL로 직접 준비한 fixture**다. 모든 관계를 API로 만들었다고 표현하지 않는다. 해당 사례의 두 번째 PUT 직후 SQL은 따로 관찰하지 않았으며, 원시 HTTP의 숫자3과 후속 SQL의 타회원 보존을 구분한다. 새 글 사례에는 각 요청 후 SQL을 남겼다.

첫19개 HTTP는 기존 클라이언트6922ae8c의 코드이고, 뒤4개는 삭제 연결 수정 후 코드다. `baseline-client.json`·`patched-client.json`과 재현 전후 JSON을 남겼다. 수정은 글 DELETE 응답을 처리한 페이지에서 실행된다. 반환한 좋아요 페이지의 script URL에 이전 캐시 버전이 보여도 삭제 안내와 빈 id의 실제 관찰을 대체하지 않는다. 현재 생성물은 새 JS의 캐시 키를 사용한다.

## 입력 보존 판정

`concept-parent-preserved.json`의 tokenStillManual=false는 비밀번호 DOM 조회의 literal 비교 결과여서 입력 손실로 판정하지 않았다. 알려진 공개 fixture를 입력한 페이지가 직접 생성한 curl의 Authorization을 새 탭 전후로 비교했고 둘 다 일치했다. 기존 clipboard는 복원했으며 토큰 문자열이나 원래 clipboard 내용은 저장하지 않았다. `concept-token-copy-proof.json`이 이 판정의 증거다. DOM에서 보이는 비밀번호 길이 역시 실제 비밀 값 길이라고 사용하지 않는다.

## 기술·검증 범위

MySQL8.4.11의 post 시각 컬럼은 DATETIME_PRECISION=0이었다. 예를 들어 Java 응답의 createdAt 소수부와 SQL 행의 초 단위 시각은 문자열 전체가 같지 않을 수 있다. 시각 비교를 빼먹은 것으로 숨기지 않고 schema-observation에 실제 정밀도와 SQL mode를 기록했다. 같은 DB 행의 시각·조회수·본문이 좋아요 요청 동안 유지되는지는 별도로 대조했다.

독립 검사기는 원문23HTTP·18SQL·홈·caller·id 해제를 읽고 검사한다. 숫자·타회원 행·인증 헤더·id·활성 과제·입력 유지 등을 훼손한7개 변형을 거절하는 검사도 포함한다. 실행은 tools/site의 `node verify-functional-like-browser-evidence.mjs --write`, `node --test test-functional-like-browser-evidence.mjs`다.

홈의 자기확인 클릭은 독립 QA origin의 동작 테스트이며 학습자 구현을 채점한 결과가 아니다. 요청 중 Java heap, SQL 발행 시점, 동시성은 이번 실행에서 측정하지 않았다. 초기 관찰용 세션은 stdin EOF로 기동 직후 종료·정리됐고 과제 요청을 보내지 않았다. 두 번째 세션의 결과만 이 폴더의 유효한 HTTP 증거로 사용한다.

`cleanup-observed.json`에서 해당 CID 부재와 앱53700·DB53668·QA문서53379의 LISTEN 부재를 재확인했다. 원시 앱·빌드 로그와 생산자 스크립트는 리서치 폴더와 진행 백업에 별도로 보존한다. 이미지·전체 페이지의 시안 정밀 대조와 나머지 inventory 검토는 계속 진행한다.
