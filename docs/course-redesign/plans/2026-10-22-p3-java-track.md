# P3. Java 트랙 J00~J15 Implementation Plan

**Goal:** `course/roadmap.json`의 `java` 배열(J00~J15)을 순수 Java + JUnit 학습 테스트로 만든다. 학습자는 뼈대 상태에서 실패하는 테스트를 통과시키고, 정답은 같은 테스트로 통과가 자동 검증된다. J 페이지(`course/java/Jnn.md`)는 설계 §5-5 형식을 따른다.

**Spec:** `course/roadmap.json`의 `java`(topic·basics·typeCut·habit), 설계 `docs/course-redesign/research/14-redesign-design.md` §5-5(J 페이지 구성, 기본기 반복 칸, 타입 한 컷, 실무 습관 칸), `course/spec-v2.md`(도메인 이름).

**작업 위치:** worktree `~/code/javaExperience/.worktrees/p3-java-track`, 브랜치 `course/p3-java-track`(BASE `answer-d09`). push 금지. 실행은 호스트 JDK 21: `JAVA_HOME=/Users/ds/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home ./gradlew …` (리포 루트).

## 구조 (확정)

```
java-track/
  build.gradle
  src/main/java/com/example/javatrack/jNN/…      학습자 뼈대: 시그니처는 그대로, 본문은 throw new UnsupportedOperationException("JNN: …")
  src/answer/java/com/example/javatrack/jNN/…    정답: main과 같은 패키지·클래스·시그니처, 본문 구현
  src/test/java/com/example/javatrack/jNN/JNN*Test.java   학습 테스트(두 소스 세트가 같은 테스트를 쓴다)
course/java/JNN.md                                J 페이지
```

- 패키지 `com.example.javatrack.jNN`(소문자 두 자리). 테스트 클래스 이름은 반드시 `JNN`으로 시작한다(`J05DtoMappingTest` 등) — `--tests 'J05*'`가 그 날만 잡게 한다.
- 도메인 객체(Post, Member, Coupon, Point…)는 J마다 자기 패키지에 필요한 만큼 둔다(J 간 의존 금지 — 하루치를 독립으로 풀 수 있어야 한다).
- Spring·Lombok 금지(순수 Java + JUnit 5 + AssertJ). 예외: J02의 Lombok 습관 칸은 Lombok이 만드는 코드를 "직접 손으로 쓴 동등 코드"와 비교하는 방식으로 한다(Lombok 의존을 넣지 않는다 — Ruling 후보, J02 구현자가 판단·보고).

### Gradle 태스크

| 태스크 | 하는 일 |
|---|---|
| `:java-track:test` | 학습자 상태(main) 기준 테스트. 뼈대면 실패한다. **`:java-track:`을 명시한 경우에만 실행**(루트 `./gradlew test`는 학습자 레거시 앱 테스트라 여기서 실패가 섞이면 안 된다 — `onlyIf { gradle.startParameter.taskNames.any { it.startsWith(':java-track') } }`) |
| `:java-track:answerTest` | 같은 테스트를 answer 소스 세트로 컴파일·실행. **전부 통과해야 한다** |
| `:java-track:verifySkeleton` | main 기준 테스트를 `ignoreFailures`로 돌린 뒤 결과 XML에서 **J 클래스마다 실패가 1개 이상**인지 확인(뼈대가 실수로 정답이 되지 않게) |
| `:java-track:check` | `answerTest` + `verifySkeleton` |

루트 `settings.gradle`에 `include 'java-track'`을 넣는다. 루트 `build.gradle`에는 `allprojects`/`subprojects`가 없다(확인됨). `board-server`는 별도 Gradle 프로젝트라 영향 없다.

### 커밋

J 하나 = 커밋 하나: `java(J05): <topic 앞부분>` + 본문 끝 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. 이 접두어는 P5가 J 페이지 [정답]을 뽑는 키다(gitmoji로 바꾸지 않는다). 모듈 뼈대는 `java(scaffold): …` 하나.

## J 한 개를 만드는 절차

1. roadmap `java[n]`의 `topic`(주제 과제), `basics`(기본기 반복 1~2문제), `typeCut`(비교표 1·함정 1·확인 테스트 1), `habit`(실무 습관)을 모두 테스트로 만든다. 항목마다 테스트 메서드 최소 1개, 메서드 이름은 한글 서술형(`메서드_안에서_int를_바꿔도_호출한_쪽은_그대로다`).
2. 테스트는 학습자 관점의 **명세**다: 구현 세부가 아니라 관찰 가능한 동작을 단언한다. 함정(typeCut·habit)은 "함정에 빠진 코드가 어떻게 터지는가"를 `assertThatThrownBy`·결과 비교로 직접 보여 준다.
3. main 뼈대 작성 → `:java-track:test --tests 'JNN*'`가 **실패**하는지 확인.
4. answer 작성 → `:java-track:answerTest --tests 'JNN*'`가 **통과**하는지 확인.
5. `course/java/JNN.md` 작성(아래 형식).
6. 커밋.

분량: 하루 30~60분. 뒤로 갈수록 어렵게(J1~3 기본기 묶음, J4~7 설계·컬렉션, J8~10 함수형·시간·프록시 직접 구현, J11~14 실전 리팩터링, J15 종합). 변수·조건문 수준의 너무 쉬운 연습은 넣지 않는다.

## J 페이지 형식 (`course/java/JNN.md`, 설계 §5-5)

```markdown
# JNN. <제목>

> 같은 날: DNN · 소요 30~60분 · 실행 `./gradlew :java-track:test --tests 'JNN*'`

## 상황
2~3줄 — 오늘 Spring 트랙(DNN)의 어떤 장면에서 이 코드가 필요해지는가 (roadmap.json의 days[DNN].steps 제목을 근거로)

## 빠른 연상
비교표 또는 그림 한 장 — 이미 아는 것(JS/TS, 일상 비유)에 붙이고, 흔한 착각 1개를 짚는다

## 만들 것
<details><summary>펼치기</summary>
채울 클래스·메서드 목록(파일 경로), 뼈대 코드 발췌, 통과시킬 테스트 이름
</details>

## 기본기 반복
## 타입 한 컷
비교표 1 · 함정 1 · 확인 테스트 이름
## 실무 습관   (habit이 있는 날만)

## 확인
./gradlew :java-track:test --tests 'JNN*'

## 정답
<details><summary>펼치기</summary>
정답 코드(answer 소스 발췌) + "왜 이렇게 쓰나" 3줄
</details>

## 오늘 Spring에서 다시 만나는 곳
DNN ② … (board-server의 실제 파일 경로를 적는다. 예: board-server/src/main/java/com/example/board/post/PostServiceImpl.java)
```

- J00은 `day: null`(선택, D1 전 워밍업)이다. "같은 날"은 "D1 전 워밍업(선택)"으로 쓴다.
- 페이지·코드·주석은 한국어. `Docker Desktop`, `studymate` 단어 금지.
- `course/roadmap.json`·`course/spec-v2.md`는 수정하지 않는다(다른 작업이 미커밋으로 고치는 중).

## J11~J14 (리팩터링) 검증 방식 — 학습 테스트 틀이 그대로 맞지 않는다

레거시 코드는 처음부터 동작하므로 "실패 → 통과"가 기본으로 성립하지 않는다. 다음처럼 한다(구현자가 더 나은 방식을 찾으면 Ruling으로 보고).

- **J11 특성화 테스트 쓰기**: 학습자가 테스트를 쓰는 것이 과제다. main에는 레거시 계산 메서드(동작함, 이상한 규칙 포함) + 비어 있는 특성화 테스트 자리(`J11CharacterizationTest`, 학습자 상태는 `fail("특성화 테스트를 채우세요")` 하나). answer 쪽 테스트는 별도 소스(`src/answerTest/java` 등)에 정답 특성화 테스트를 두고, (a) 레거시 원본에 통과, (b) 결함을 심은 변형 1~3개(`LegacyPointCalculatorMutant*`)에는 실패함을 메타 테스트로 확인한다.
- **J12~J14**: 동작 테스트(특성화 결과 그대로) + 리플렉션 구조 단언.
  - J12: 80줄 구매 처리 메서드 → 검증·계산·저장 메서드로 분리됐는지(메서드 존재, 원 메서드 줄 수 상한은 소스 파일을 읽어 측정 가능하면 측정), 검증 실패 사유가 `List<String>`.
  - J13: `DiscountPolicy` 구현체 수, `if-else` 제거(구현 클래스별 할인 동작).
  - J14: 반환 타입이 `Optional`/`List`(null 반환 없음), 호출부 NPE 없음.
  - main(학습자 상태)은 레거시 그대로 → 구조 단언이 실패한다. answer는 리팩터링 완료본 → 전부 통과.

## 분배 (병행)

- 1차(템플릿): 모듈 뼈대 + J00 + J01 — 한 구현자. 컨트롤러가 검증한 뒤 템플릿으로 확정.
- 2차(병행, 각자 별도 worktree, 같은 BASE=1차 끝 커밋):
  - A: J02~J07
  - B: J08~J10, J15
  - C: J11~J14
  - 각자 자기 `jNN` 패키지와 `course/java/JNN.md`만 만든다. `java-track/build.gradle`·`settings.gradle`을 고쳐야 하면 고치지 말고 보고한다(컨트롤러가 합친다). 단 C는 J11 answerTest 구성 때문에 `java-track/build.gradle` 수정이 필요할 수 있다 — C만 허용, 수정 내용을 보고에 적는다.
- 합치기: 컨트롤러가 2차 브랜치들을 `course/p3-java-track`에 차례로 cherry-pick, `:java-track:check` 전체 통과 후 태그 `java-done`(로컬).

## 검증 (컨트롤러)

- `./gradlew :java-track:check` 통과(answerTest 전부 통과 + verifySkeleton: J 클래스마다 뼈대 실패).
- 루트 `./gradlew test`가 java-track 테스트를 돌리지 않는다(학습자 레거시 앱 테스트만).
- `--tests 'J05*'`가 J05 클래스만 잡는다.
- `cd tools/site && npm run build` 후 `course/java` 렌더링 여부 확인(렌더러 연결은 P5 범위 — 여기서는 깨지지 않는지만).
- `grep -rn 'Docker Desktop\|studymate' java-track course/java` → 0건.

## 실행 기록 (2026-10-22)

- 1차(뼈대·J00·J01) → 컨트롤러 검증 후 템플릿 확정. 2차 A(J02~J07)·B(J08~J10·J15)·C(J11~J14)를 별도 worktree에서 병행, 각 `:java-track:check` 통과 확인 후 PR 브랜치에 J 번호 순으로 cherry-pick(B의 J09 수정 커밋은 J09에 합침).
- 합친 뒤: `:java-track:check --rerun-tasks` 통과(J 테스트 클래스 55개 모두 뼈대 실패, 정답 전부 통과), `--tests 'J05*'`는 J05 4개 클래스만, 루트 `test`에서 java-track 태스크 7개 skip, 사이트 빌드 HTML 358개·링크 오류 0, audit 3종 통과.
- Ruling: answerTest는 테스트를 두 번 컴파일하지 않고 classpath 가리기(answer 출력이 main 앞) — 정답 시그니처가 다르면 NoSuchMethodError로 드러남.
- Ruling: java-track 태스크는 `:java-track`을 명시하거나 java-track 디렉터리 안에서 실행할 때만 동작(루트 레거시 앱 빌드에 실패가 섞이지 않게).
- Ruling: J11 정답 특성화 테스트는 `src/answerTest`에 같은 이름으로 두어 가리고, `J11MutantTest`가 결함 변형 3개(소스 한 곳 치환 후 javac)를 정답 테스트가 잡는지 확인.
- Ruling: J12~J14는 특성화(동작) 테스트는 뼈대에서도 통과하고, 클래스마다 구조 테스트가 뼈대에서 실패하게 함.
- Ruling: J02 Lombok 습관 칸은 Lombok 의존 없이 delombok 출력과 같은 손 코드로 비교. J07 동시성은 CountDownLatch로 매번 재현. J07 타입 한 컷은 Jackson 대신 `java.beans.Introspector`.
- minor: J02·J03 분량이 60분을 넘을 수 있음 / J09·J15는 테스트 중 JVM 기본 시간대를 바꿈(병렬 실행 시 주의) / J11MutantTest는 작업 디렉터리가 java-track이어야 함(IDE 러너 주의) / J11 정답이 `src/answerTest`에 있어 P5 추출 시 함께 볼 것.
- Review (2026-10-23): codex(gpt-6-astra) 사후 리뷰 — FAIL, major 7(J04·J15 할인 오버플로, J10 프록시 equals 계약, J13 로케일 의존 toUpperCase, J07 이름 변환이 JavaBeans 규칙과 다르고 필드 순서 가정, verifySkeleton이 부분 실행 결과도 통과, J04 Integer 캐시 미검사·범위 밖 동일성을 보장처럼 설명, J14 선택 과제가 필수 완료 조건), minor 6 → 수정 담당 dispatch
