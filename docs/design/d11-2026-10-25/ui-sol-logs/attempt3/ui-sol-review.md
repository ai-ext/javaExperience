# D11 UI 독립 Sol 검토 — attempt 3

**spec PASS → quality PASS · C/I/M 0/0/0.** HEAD는 `d2aa2c9aad39b21f7c5a49b1cdd69978d2b8e03a`다. 검토 범위는 D11 질문12개·상태38개의 UI 소스/DOM 및 하네스 회귀다. 실제PC·OS clipboard와 원문전체 커버리지/134 전체 완성 판정은 부모의 별도 관문이다.

최초 두 spec 지적과 후속 quality 지적을 모두 해소했다. CORS의 실제 서버 허용 조건은 기본 DOM에서 현재 상태와 함께 보이고, 원래 client 요청과 긴 raw/source는 출처 상세에 있다. 38개 상태의 정확값·bind·코드·source/active·종류와 실제 복사payload를 독립 기대값으로 검사한다. A→B→같은A, 늦은 완료와 양방향 역순 resolve/reject·fallback도 검사한다. 마지막 국소 수정으로 실제 화면의 source/evidence 라벨까지 독립 기대값과 대조한다. attempt2 이후 제품·원문·proof 범위 변경은 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/test-d11-learning.mjs 한 파일뿐이다.

수정 범위를 대조해 spec PASS를 먼저 기록한 뒤 동일9개 메모리 변이를 별도 quality로 실행했다. 제어군은 exit0, 변이9개는 모두 AssertionError와 exit1로 검출됐다. 결과 owner, bind owner, 거부 조건 false→true, source 범위, native evidenceKind, 실제 화면 source 라벨, generation guard, request 성공 guard, request 실패 guard를 각각 바꿨다. 이전에 생존했던 CORS의 거짓 Spring Security/Java 실행 라벨도 `simple-blocked-read rendered source label`에서 실패한다. 변이는 esbuild onLoad로 메모리에만 주입했고 제품 소스를 디스크에 쓰지 않았다.

정상 D11/P09/reader/dark 검사와 `git diff --check`는 모두 exit0이다. 입력9,753개 SHA 전후 변경은0개다. W15 builder literal은 Git HEAD와 같으며 잘못된 문구 재유입 변이를 독립 범위 검사로 잡았다. 실제 W15 HTML도 HEAD와 바이트가 같고 SHA는 `964e56e13fa8b30762b32c20039f2b23ab44e9a99f4a7e4e35e20aa239e4ad03`다. 부모의 source 수정 후 fresh build 결과를 확인한 것이며 생성본 restore로 차이를 숨기지 않았다.

기존 attempt1 spec FAIL과 attempt2 quality FAIL의 보고·raw는 각 attempt 폴더에 보존했다. 이 reviewer는 제품·원문·learner·raw proof·이미지·manifest·공통reader/기존controller를 수정하지 않았고 브라우저·외부CLI·새 리서치·다른LLM·Git 상태 변경도 수행하지 않았다. 원 proof native 실행과 이미지 승인은 기존 독립 증거의 범위로만 읽었고 이 UI 검토가 그 실행을 다시 수행했다는 주장은 하지 않는다.

검토 JSON: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/ui-sol-review.json

spec/quality/변이raw/SHA: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/ui-sol-logs/attempt3/
