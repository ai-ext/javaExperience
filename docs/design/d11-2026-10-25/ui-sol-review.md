# D11 UI 독립 Sol 검토 — attempt 3

**spec PASS → quality PASS · C/I/M 0/0/0.** HEAD는 `d2aa2c9aad39b21f7c5a49b1cdd69978d2b8e03a`다. 검토 범위는 D11 질문12개·상태38개의 UI 소스/DOM 및 하네스 회귀다. 실제PC·OS clipboard와 원문전체 커버리지/134 전체 완성 판정은 부모의 별도 관문이다.

최초 두 spec 지적과 후속 quality 지적을 모두 해소했다. CORS의 실제 서버 허용 조건은 기본 DOM에서 현재 상태와 함께 보이고, 원래 client 요청과 긴 raw/source는 출처 상세에 있다. 38개 상태의 정확값·bind·코드·source/active·종류와 실제 복사payload를 독립 기대값으로 검사한다. A→B→같은A, 늦은 완료와 양방향 역순 resolve/reject·fallback도 검사한다. 마지막 국소 수정으로 실제 화면의 source/evidence 라벨까지 독립 기대값과 대조한다. attempt2 이후 제품·원문·proof 범위 변경은 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/test-d11-learning.mjs 한 파일뿐이다.

수정 범위를 대조해 spec PASS를 먼저 기록한 뒤 동일9개 메모리 변이를 별도 quality로 실행했다. 제어군은 exit0, 변이9개는 모두 AssertionError와 exit1로 검출됐다. 결과 owner, bind owner, 거부 조건 false→true, source 범위, native evidenceKind, 실제 화면 source 라벨, generation guard, request 성공 guard, request 실패 guard를 각각 바꿨다. 이전에 생존했던 CORS의 거짓 Spring Security/Java 실행 라벨도 `simple-blocked-read rendered source label`에서 실패한다. 변이는 esbuild onLoad로 메모리에만 주입했고 제품 소스를 디스크에 쓰지 않았다.

정상 D11/P09/reader/dark 검사와 `git diff --check`는 모두 exit0이다. 입력9,753개 SHA 전후 변경은0개다. W15 builder literal은 Git HEAD와 같으며 잘못된 문구 재유입 변이를 독립 범위 검사로 잡았다. 실제 W15 HTML도 HEAD와 바이트가 같고 SHA는 `964e56e13fa8b30762b32c20039f2b23ab44e9a99f4a7e4e35e20aa239e4ad03`다. 부모의 source 수정 후 fresh build 결과를 확인한 것이며 생성본 restore로 차이를 숨기지 않았다.

기존 attempt1 spec FAIL과 attempt2 quality FAIL의 보고·raw는 각 attempt 폴더에 보존했다. 이 reviewer는 제품·원문·learner·raw proof·이미지·manifest·공통reader/기존controller를 수정하지 않았고 브라우저·외부CLI·새 리서치·다른LLM·Git 상태 변경도 수행하지 않았다. 원 proof native 실행과 이미지 승인은 기존 독립 증거의 범위로만 읽었고 이 UI 검토가 그 실행을 다시 수행했다는 주장은 하지 않는다.

검토 JSON: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/ui-sol-review.json

spec/quality/변이raw/SHA: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/ui-sol-logs/attempt3/

## 실제 판독 교정 bounded addendum 1

**추가 spec PASS → quality PASS · C/I/M 0/0/0.** 기존 attempt3 PASS와 raw는 유지한다. 변경 범위는 D11 data/test/생성 HTML, FOCUS-DESIGN, 구현 기록5개이며 controller·원문 MD·proof source/raw·이미지는 이전 승인 입력과 같다.

- chain-rules는 정확한 원문184~197행 Java 발췌로 시작 fence만 제외했고 강조줄은 상대6~11이다. version-pinned의136행 prose와 미실행 구분은 유지했다.
- HSTS 그림을 native 크기로 재열람해 모델 호스트 learn.example.test와 기본 max-age=31536000을 확인했다. 원문 헤더의 includeSubDomains는 추가 범위/다음 장면으로 구분한다. 실제 HSTS/DNS/trust 실행 주장을 추가하지 않았다.
- preflight-allowed 표는 Allow-Methods/Allow-Headers의 허용 조건임을 명시한다. 값과 Python source 발췌는 같다.
- CSRF 그림을 다시 읽어 cookie-token의 브라우저→자동 전송→Cookie 요청 영역이 [1,56,56,24] 안에 있음을 확인했다. FOCUS-DESIGN과 독립 테스트 좌표가 같다. 실제PC 확대 수용은 부모 재관측에 남긴다.

명세를 먼저 통과시킨 뒤 기존9변이와 새4교정의 회귀 변이4개를 실행했다. 총13개 모두 AssertionError/exit1, 제어군은 exit0이다. 추가 변이는 Java fence 범위 복귀, HSTS 호스트 복귀, CORS의 모호한 라벨 복귀, cookie-token 이전 focus 복귀이며 제품 디스크 소스는 쓰지 않았다. D11/P09/reader/dark와 diff-check는 모두 exit0, 입력9,753개 SHA 전후 변경0개, W15 생성 HTML은 여전히 HEAD 바이트와 같다.

추가 spec/quality/변이raw/SHA: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/ui-sol-logs/addendum1/

## Collector addendum

**collector 한정 spec/quality PASS · C/I/M 0/0/0.** /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/inventory-visual-work.mjs는 Git HEAD 대비 D11 import1개와 기존 typed tuple1개 추가만 있다. 기존 수집/ID/상태 로직은 같다.

독립 전후 대조에서47,212→47,254(+42), 신규 typed38개·12topic·선정 imageId 매핑/ID/label/chars가 승인 데이터와 일치했다. 신규 typed38개만 각각 mockup_ready→implemented의76회 기록이 있고 verified 승격은0개다. 비typed toggle4개는 unreviewed이며 evidence/date도 빈값이다. 기존47,212행의 status/evidence/updatedDate 변경은0개다. 기존행의 다른 변경은 D11 reader mode button2개의 displayCondition뿐이며, 실제 생성 HTML에 장면과 표시 가능한 kr-controls가 존재하므로 타당하다. D11 페이지 상태는 in_progress다.

collector를 제외한 제품 소스·HTML/MD·proof/raw·선정 assets/manifest 등780개는 직전 승인 SHA와 모두 같고, 이번 검토 입력9개도 전후 같았다. reviewer는 collector 재실행/mark/제품수정/Git 상태 변경을 하지 않았다. 상세 검증과 보존 기록: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/ui-sol-logs/collector-addendum/
