# 첫24 감사의 중요 결함 수정 사양

수정 시작은 기존24개 Sol 감사의 기준 HEAD4b0493af 및 관련 코드 해시를 고정한 후다. 구현 gpt-6-luna/high, 독립 bounded spec→quality 검토 gpt-6.1-sol/high, 실제 브라우저/보존 검증은 메인이다. 전체 문서 공백은 이 수정의 완료 기준에 포함하지 않고 후속 task에 남긴다.

## task10.fix1 — R03 숫자 범위

재현: 원문 R03 L17/L21의 single tilde 숫자 범위가 현재 HTML L2841/L2861에서 `<del>`로 잘못 결합된다. 1바이트 signed -128~127 / unsigned0~255, 8바이트 signed -2⁶³~2⁶³-1 / unsigned0~2⁶⁴-1의 범위 구분을 그대로 표시해야 한다.

- 원문 Markdown/기존 html-baseline.json/기존 raw·frozen은 고치지 않는다.
- tools/site/build.mjs의 R03 렌더링에서 이 숫자 범위만 literal tilde로 처리한다. 코드 fence/inline code/의도된 `~~취소선~~`/다른 문서 렌더링은 유지한다. 문자열 숫자·범위 의미를 지우거나 HTML에서 del만 없애 숫자를 붙이는 수정을 금한다.
- 기존 source-text baseline이 이미 tilde를 잃은 렌더링을 기록했으므로 역사 baseline 파일을 덮지 않는다. test-r03-generated.mjs의 기대값에 명시적 승인 보정(정확히 두 구절)을 적용하고 before/after를 repairs/priority의 JSON에 기록한다. 보정은 다른 차이를 허용하지 않는다.
- 실제 생성 HTML에서 두 셀의 textContent가 정확한 범위를 포함하고 해당 두 셀에 del이 없어야 한다. 원문 SHA/code/ids/지도는 유지한다. RED→GREEN 검사로 잡는다.

## task10.fix2 — R03 FK 그림

현재 R03-foreign-v3.jpg의 중앙 관측은 orders.member_id지만 실제 오류1451은 article.author_id/fk_article_author다.

- 메인이 actual imagegen으로 새 후보를 만들고 실제 열람했다. 입력/프롬프트/생성 경로는 repairs/r03/image-candidate.json과 image-prompt.txt에 있다.
- /usr/bin/sips JPEG quality92로 원해상도 변환하고 tools/site/raster-size.mjs로 PNG/JPEG 실제 크기·형식, bytes/SHA를 대조한다. 새 파일 docs/design/r03-2026-10-20/images/R03-foreign-v4.jpg로 저장한다. 기존 v3와 과거 증거는 보존한다.
- R03_ASSETS의 해당 asset 파일/실제 dimensions만 교체한다. stage 값·SQL·native frozen·기존 원문은 고치지 않는다.
- 중앙 article/author_id/fk_article_author, 나머지1452·CASCADE·SET NULL·signedness3780와 footer 경계를 메인/Sol이 직접 확인한다. 새 생성/선정 기록을 별도 correction manifest로 남긴다. 과거의 잘못된 이미지를 새 정상 근거로 재사용하지 않는다.

## task11.fix1 — R04 DML 복사 문맥

현재 코드 조각은 원문 block13의 한 트랜잭션 중간이다. 독립적인 autocommit 실행을 하면 현재 설명하는 writer/observer 차이와 rollback을 재현하지 못한다.

- 현재 장면별 발췌와 강조는 보존한다. DML 질문의 sourceNote/보조 문구에서 START TRANSACTION→ROLLBACK의 중간 발췌임을 명확히 한다.
- DML에서만 `전체 트랜잭션 복사` 버튼을 제공하고, 원문 source-proof/original/block-13.sql의 전체 바이트를 정확하게 복사한다. 기존 일반 `코드 복사`는 현재 발췌를 그대로 복사한다. 두 동작을 섞지 않는다.
- browser bundle에는 Node fs를 넣지 않는다. 전체 원문 SQL은 data module의 정적 상수로 보존하고 테스트가 source-proof의 원문과 바이트 대조한다. 실제 DB나 기존 데이터에는 실행하지 않는다.
- 전체 복사 코드에는 원문 START TRANSACTION/ROLLBACK/그 뒤의 검증 SELECT가 그대로 있어야 한다. 기존 source/frozen을 수정하거나 인위적인 새 DB 결과를 만들지 않는다.
- clipboard 성공을 기다린 뒤 실제 payload를 대조한다. 실패 시 성공이라고 표시하지 않는다. 비동기 복사 중 장면이 바뀌면 새 장면에 이전 성공/선택 메시지를 쓰지 않는다(해당 새 handler 및 R04 기존 handler의 범위). 다른 문서의 공통 race minor는 이번에 무관하게 대량 수정하지 않는다.
- 질문을 벗어나면 전체 복사 버튼이 사라지고 일반 복사는 기존대로 동작한다. 신규 회귀 검사를 test:r04 흐름에 포함한다.

## task20.fix1 — D06 Local/Dev 역할 그림

선정 promotion-v4.jpg는 Local/Dev를 모두 개인 개발로 설명하지만 원문은 local 개인 확인/dev 공유 통합이다.

- 메인이 actual imagegen으로 만든 수정 후보와 프롬프트가 repairs/d06/image-candidate.json, image-prompt.txt에 있다. 같은 패널에서 `Local: individual checks`, `Dev: shared integration`을 분리했다.
- sips JPEG92/native 크기로 docs/design/d06-2026-10-21/images/promotion-v5.jpg를 만들고 실제 헤더/해시 기록. 기존 v4와 증거는 보존.
- D06 해당 asset 파일/dimensions만 바꾼다. QA의 조직별 의미, 환경 순서가 보편적이지 않다는 한계, 미실행 승격 모델과 local native 관찰의 경계를 그대로 둔다.

## 파일 소유권/검사

구현자는 위 data/controller/renderer/build 및 관련 test, package.json의 관련 검사 등록, 새 JPEG2개·보정 manifest·수정 raw 로그만 수정한다. 기존 AGENTS/RESUME/원문/docs source-proof frozen/raw/기존 감사 리뷰·하네스·다른 task는 수정하지 않는다. shared inventory/parity/status는 메인이 검토 후 갱신한다. Git commit/push/merge는 구현자가 하지 않는다.

각 결함의 신규 RED→GREEN과 관련 R03/R04/D06 검사를 먼저 실행한다. 공유 빌드가 바뀌므로 build339/link0과 기존24 하네스·3audit을 메인이 다시 실행한다. 부모가 변경 파일/해시/원문135·서버17 보존을 직접 확인한 뒤 새 Sol 검토를 요청한다. 새 Sol spec 통과 뒤 quality를 승인하고, 메인이 R03 숫자범위/FK·R04 발췌/전체복사·D06 역할 그림을 현재 desktop/mobile에서 대조한다.
