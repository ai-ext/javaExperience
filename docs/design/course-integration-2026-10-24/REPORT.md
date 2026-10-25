# 과정 통합 구현 기록

2026-10-25 확인. 초기 기준은 feat/course-stepper-design 62d75618이며 origin/main a70f1bd5를 포함한다. 새 작업은 feat/course-learning-integration의 별도 worktree에서 수행한다.

## 현재 구현

- D04-5, D05-1·2·6, D06-4의 선택형 요청 도구: main의 8개 API 계약, 201 Location·204 빈 본문·커서 페이지, 실제 응답 원문, 수동 DB 확인 SQL. 진도와 채점은 독립이다.
- D04-4의 5상태 값 비교: 객체 생성·관계 연결·INSERT 뒤·commit·rollback. 생성 이미지의 선택본을 같은 해상도 JPG로 제공하며 native HTML 값 비교와 구분한다.
- PC 다크 셸과 개념 목록/P16의 강제 light 색상 수정.

## 확인한 근거

- API 도구 최초 실행: 실제 브라우저 18건(8개 동작과 반복·실패 포함), SQL 관찰 13건(문자셋 재확인 1건 포함). board-server source는 변경하지 않았다.
- 새 시각화 연결 후 독립 실행: 브라우저 POST 2건(201/500), SQL 실행 5건. commit 전 별도 RR autocommit SELECT는 0행, READ UNCOMMITTED 외부 probe는 미확정 글42와 관계42·7을 관찰했다. 정상 commit 뒤 글·관계·포인트가 보였다. fixture를 리셋한 독립 오류 실험은 글·관계·포인트를 rollback하고 기존 태그7을 유지했다. Java heap은 계측하지 않았다.
- 두 차례 실험의 MySQL·Redis·JVM은 자기 소유 자원만 종료했고 private credential 파일을 제거했다. UI preview는 localhost:3000으로 유지한다.
- 초기 보호 소스918파일 SHA 일치. 생성 HTML459개·링크 오류0. API/모델/다크 단위23건, 과정 화면18+35건, home/knowledge/navigation/course 검사를 통과했다. PC1366×768·1440×900·1920×1080의 신규 패널 넘침 없음.

## 현재 작업 상태

원본 stepper가 작업 도중3b35ff22로 갱신됐다. 내용·대비·길찾기 개선을 현재 구현과 통합하고 다시 검사한다. 이 문서는 통합 전 체크포인트이며 전체 통합 완료 보고가 아니다. 기존 parity 장부27행은 실제 시안 파일6개가 없어서 audit:parity에 실패했다. 원본 stepper의 후속 커밋에서 해당 행이 제거된 것을 확인했으며, 삭제 전 내용을 이 폴더의 legacy-missing-parity.jsonl에 별도 보존한다. 신규 상태는 실제 JPG/캡처/동작 증거를 연결한다.

전체134개 개념의 시각화 재제작, 이전 concept-learning-night 전체 이식, 신규 모바일·light 화면은 이번 구현 범위가 아니다. 원본 서버/학습자 코드와 main의 과정 구조를 보존한다.
