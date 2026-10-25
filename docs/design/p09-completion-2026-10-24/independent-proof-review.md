# P09 추가 proof·선택 이미지 독립 검수

**판정: proof·선택 PC 다크 이미지 승인 — C0 / I0 / M0.** 제품 UI·P09 전체·기존24 전체·전체134 완료 판정은 포함하지 않는다.

검수 중 확인한 PLAN의 desktop/mobile 잔여 문구와 source 주석의 단락 규칙 과대표기는 메인이 교정했고 독립 재확인했다. 최종 소스는 주석 한 곳만 바뀌었고 v1은 보존되어 있다. 실행문·클래스 파일 바이트·13개 값·stdout은 모두 v1과 같다.

## Java 실행

지정 Corretto21.0.6에서 새 소유 임시 디렉터리 `/var/folders/v7/q1cs_f5d0n7cccrbydpm88xr0000gn/T/p09-independent-proof-sol-j5ahfooz`를 사용했다. javac/java/javap 모두 exit0. 최종 sourceSHA256 `527af7d57af199b72a6c83cd61a4de1771a98e32c7b6e1eafb39410ce2bfe95b`는 execution 기록과 일치한다. 13개 키·값과 순서·개행을 포함한 전체 stdout이 expected·recorded actual·기존 stdout과 일치했다.

```text
initial=0/0/null
afterA=2/0/Ada
afterB=2/5/Grace
sameStatic=true
sumEmpty=0
sumItems=5
sumArray=10
chooseTwo=fixed(int,int)
chooseArray=varargs(int[])
chooseEmpty=varargs(int[])
sumStep2=2
sumStep3=5
sumInput=[2, 3]
```

javap에서 choose(II), choose([I), choose([I) 호출과 quantity의 putfield / latestName의 putstatic을 확인했다. a/b는 순차 호출이며 객체 내부에 latestName 참조 필드는 없다. HTTP·Spring·DB·동시성 실행은 없다. sumStep2/3는 main의 별도 반복 관측이며 sum 내부 trace가 아니다. choose 반환문자열은 선택 마커이고, 이 두 overload의 Java21 선택만 확인한다.

## 이미지 검수

선택 JPG 2장을 view_image로 직접 열었다. shared의 0/0/null→2/0/Ada→2/5/Grace, 클래스 필드 접근 화살표·문구·null 표기와 varargs의 배열 설명·합계0/5/10·고정/배열/빈인자 선택이 정확하다. 추가 Java21 예제·순차호출·실행하지 않은 계층 및 두 overload 한정 조건도 적절하다. PC 다크 원본에서 단계·값·코드·문구가 읽히고 잘림을 발견하지 못했다.

| 선택 이미지 | 바이트 | SHA-256 |
|---|---:|---|
| /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-2026-10-20/images/P09-shared-dark-20261024.jpg | 528762 | `526c3b838c0fd0a7496297588d843ef00b317d68ff9a2955da3ae466d57588d1` |
| /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-2026-10-20/images/P09-varargs-dark-20261024.jpg | 515743 | `be8303ed18ae1af2c01b886082a07bda1564f4284e101ab7e9a4cbb7f806d35c` |

기록된 원본 PNG의 SHA와 native1672×941를 확인했다. 각 원본을 `/usr/bin/sips -s format jpeg -s formatOptions 92`로 소유 임시 파일에 변환한 결과가 선택 JPG와 전체 바이트·SHA가 같다. 원본 PNG와 제품 JPG는 변경하지 않았다. actual imagegen 호출 자체의 독립 재실행/실행로그 조회는 하지 않았다. white/draft3은 미선정 역사자료로 유지하며 수정 요구 대상이 아니다.

## 재현 근거

최종 모든 실제 argv/cwd/exit·raw stdout/stderr SHA·입력 전후 SHA: [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-completion-2026-10-24/independent-proof-logs/v2-final/reproduction.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-completion-2026-10-24/independent-proof-logs/v2-final/reproduction.json). 재현 스크립트: [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-completion-2026-10-24/independent-proof-logs/v2-final/reproduce.py](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-completion-2026-10-24/independent-proof-logs/v2-final/reproduce.py). v1 검증 로그는 [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-completion-2026-10-24/independent-proof-logs/reproduction.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-completion-2026-10-24/independent-proof-logs/reproduction.json)에 보존했고 주석 교정 대조는 [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-completion-2026-10-24/independent-proof-logs/comment-recheck.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-completion-2026-10-24/independent-proof-logs/comment-recheck.json)에 있다.

| 명령 | exit | stdout SHA-256 | stderr SHA-256 |
|---|---:|---|---|
| java-version | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `c78f6e09c33205fa801644eec5464974926671bf6ee8393db60b8fc3c76a5f03` |
| javac-version | 0 | `bbb4d37bb6da9a641971dd77aacdd3661b6b9581fc84e0f8cba77d60c6aa0695` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| compile | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| run | 0 | `325ba5be2d1441f0d840e4eb6ee3d70816af2c627ad6e0950d4aad4462ff5bb3` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| javap-main | 0 | `9ad6546a990c2095cce3556556f91713203d86ee61abaf0d4e6cef9a6361eb1d` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| javap-state | 0 | `1564e15942ceeaccd25119c380067280896a725afd1f7a310f455e9e9388158a` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| shared-dark-metadata | 0 | `b331d3e94e5e3f39699749afaf4aa5c5a399de5a21f7d6323ba0536c4dd17418` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| shared-dark-reencode-quality92 | 0 | `76b65cc4f568b3ef8f93a701fe9c824c049ede136cfd7f7afe4ef0531cbd8e02` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| shared-dark-source-metadata | 0 | `4b374ea03cea8411dc974ee32b873f567aa2eb85d8ae96fcc23389f280ada229` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| varargs-dark-metadata | 0 | `94051425a097de76a419edf62126ad40c8248d0f63b4386da399c58981d5e5fb` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| varargs-dark-reencode-quality92 | 0 | `c2acc43de2e1adaa66bab95d80f2648b954fffb61aadcdc52d1bc5dd792ceaaf` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| varargs-dark-source-metadata | 0 | `7978c43f65455c3be9c8b17f6c2eb4f67795fd32306400d6ca905edea5108f68` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

## 범위 한계

원문은 관련 §2.3·§2.8·Q7만 직접 대조했으며, 489줄 전문 재독을 이 검수의 근거로 주장하지 않는다. 제품의 새 2질문·9상태와 1366 viewport의 포커스·확대·스크롤·복사·원문 이동은 검수하지 않았다. spec/quality/UI 관문이 별도로 필요하다. Git·harness/build·제품코드·생성HTML·서버/DB·외부 CLI·웹 리서치·재위임 실행/변경은 하지 않았다. 제공된 HEAD는 Git으로 독립 조회하지 않았다. 최종 재현 중 지정 입력 SHA 변화는 0이었다.
