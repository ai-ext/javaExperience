# 첫24 중요 결함4개 수정 독립 검토

**approved — 네 수정에 한정한 승인.** spec 검토 pass 뒤 quality 검토 approved다. 신규 critical0/important0/minor0이며 제품 전체완료나 첫24문서 완료를 뜻하지 않는다. 검토 기준 HEAD는 `4b0493af52b1a06decca909d6bf9a8b6f9610686`이고 현재 미커밋 수정의 입력 SHA에 귀속된다.

| 수정 | 결론 | 근거 |
|---|---|---|
| task10.fix1 | 승인 | `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/build.mjs:123,241`은 R03의 정확한 두 raw token만 literal 처리한다. 생성 두 cell의 범위 text와 del 부재, 코드/ID/map 보존 통과. 역사 baseline은 그대로 두고 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/test-r03-generated.mjs:14`의 정확히 두 승인 보정만 manifest와 일치한다. 독립 실행에서 fence/inline code/double~~/타문서 기본 렌더링 유지. |
| task10.fix2 | 승인 | `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/r03-lesson-data.mjs:997` active→v4→승인 JPEG→실제 SHA 연결. 실제 image view에서 중앙 `article.author_id`, `fk_article_author`가 source-proof 오류1451과 일치. 1452/CASCADE/SET NULL/signed3780/footer 경계 유지. |
| task11.fix1 | 승인 | `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/r04-lesson-data.mjs:1775,1843`에서 33줄 원문 전체·끝 개행·ROLLBACK 뒤 SELECT byte-equal 및 중간 발췌 문맥 명시. 기존 모든 stage/code/강조/runtime는 기준 HEAD와 동등. `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/r04-learning.js:104,114` 두 payload와 성공/실패 scene guard, 진실한 실패/수동 복사 동작 통과. DML 밖 hidden/진입 시 collapsed 확인. |
| task20.fix1 | 승인 | `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d06-lesson-data.mjs:666` active→v5→승인 JPEG→실제 SHA 연결. 실제 image view에서 Local 개인 확인/Dev 공유 통합 두 줄을 분리. QA 조직별 의미·staging/prod·row2 복구 한계·row3 local 관측·미실행 모델 유지. |

두 새 JPEG는 `view_image(detail=original)`로 실제 열었다. `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/r03-2026-10-20/images/R03-foreign-v4.jpg`의 SHA는 `ffe4c52cb656c149b9b35dc961dc9cf25414193ed84b4824f9fbc3ffd3d1f86e`, `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d06-2026-10-21/images/promotion-v5.jpg`의 SHA는 `236e10eea522907505167fe6522de2a0724126370095a472796f9b7e25c17fdb`다. raw PNG→sips JPEG quality92를 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/sol-logs` 안에 다시 생성한 결과 두 target과 바이트 SHA가 같고, PNG/JPEG 모두 native1672×941이다. 기존 이미지/리뷰/source-proof/raw/frozen은 보존했다.

새로 실행한 `npm --prefix tools/site run test:r03`, `test:r04`, `test:d06`는 모두 exit0이다(2026-10-22T00:46:49Z~00:47:00Z). `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/sol-logs/fresh-tests.json`에 raw stdout/stderr 경로·UTC·exitCode, `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/sol-logs/input-sha-preflight.json`와 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/sol-logs/input-sha-postflight.json`에 관련19입력 SHA를 남겼고 전후 동일하다. 독립 경계 검사는 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/sol-logs/independent-checks.stdout.json`에 있다.

원문135/학습자서버17은 지정 preservation baseline SHA와 동일하고 기존 감사24 JSON도 audit baseline SHA와 동일하다. R03/R04/D06의 기존 디자인 증거와 원문/서버를 포함한 tracked538파일은 4b0493af와 바이트가 같다. 근거는 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/sol-logs/preservation.json`이다. 저장소 전체 clean을 주장하지 않으며 기존 AGENTS/RESUME 변경은 범위 밖이다.

현재 desktop/mobile 브라우저와 실제 OS clipboard는 사용하지 않았다. 정적 CSS와 DOM 동작 승인은 실제 화면의 폭·축소 가독성 승인을 대신하지 않는다. 메인이 현재 화면과 전체24하네스/공유 build/3audit을 최종 확인해야 한다. 기존 minor9개·문서 전체 공백은 별도 잔여 작업이며 fullDocumentComplete=false를 유지한다.

재검증 조건: 관련 코드/원문/ASSETS/manifest/Marked 버전이 바뀌면 해당 npm 검사와 독립 경계 검사, 실제 이미지 열람, 메인 desktop/mobile 대조를 다시 실행한다. 본 검토에서 추가 수정 요구는 없다.
