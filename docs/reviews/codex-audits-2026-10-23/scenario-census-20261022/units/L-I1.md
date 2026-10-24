# L-I1. I1. 테스트는 왜 쓰나·무엇을 시험하나

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/I1-why-tests.md](../../../../../lessons/I1-why-tests.md)

원문 SHA-256: `9c0cde6a60ad30143a23da15e7697854c5b42236f4a0f5b07f7a619c2b0d4f9b`

## 판정

레슨에 지정 입력과 실패/거짓 통과 사례가 있으나 Java 예제 파일은 학습자가 만들어야 한다. 이번 감사에서 실행 결과를 독립 재현하지 않았다.

## 목표·선수 지식·학습자 작업

기초 Java 계산 함수를 직접 만들고 JUnit 테스트로 약속을 고정한다. 쉬운 입력과 경계 입력이 버그를 어떻게 다르게 드러내는지 익힌다.

PageInfo와 같은 package의 PageInfoTest를 만들고 지정된 Gradle 테스트 명령을 실행한다. totalPages를 정수 나눗셈으로 일부러 바꿔 실패 2개를 관찰한 뒤, 쉬운 경우만 남겼을 때 버그가 통과하는 점과 단언이 없는 테스트가 통과하는 점을 확인한다.

## 요구·구현·검사 대조

### 1. 14개를 5개씩 나누면 totalPages=3이고 마지막 page=2 뒤 hasNext=false. 딱 맞는 15/5는 3쪽, 빈 목록은 0쪽이다. 이 경계를 단언하는 테스트는 잘못된 정수 나눗셈을 실패시켜야 한다.

구현 대조: 레슨은 PageInfo.java/PageInfoTest.java 예제와 특정 클래스만 실행하는 Gradle 명령, 잘못된 totalPages 식을 포함한다. 해당 예제 파일 자체는 repo에 별도로 들어 있지 않고 학습자가 만든다.

검사 대조: 레슨은 PageInfoTest의 14/5 나머지 경계가 totalPages와 마지막 page의 hasNext 단언을 실패시키고, 15/5·0/5만 남긴 테스트는 정수 나눗셈 버그를 놓치는 예를 보인다. assertion 없는 테스트는 값이 틀려도 통과한다. 이 파일에 실행 가능한 테스트 코드는 없으며 이번 담당자는 실행하지 않았다.

공백 또는 한계: 두 Java 파일을 학습자가 직접 작성해야 하므로 현재 저장소에서 재현 가능한 자동 시험은 없다. 14/5에서 expected 3 대신 2가 되는 결과와 마지막 페이지 hasNext의 오판을 직접 확인해야 한다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/I1-why-tests.md](../../../../../lessons/I1-why-tests.md) — 21~51행
- [$WORKTREE_ROOT/concept-census-20261021/lessons/I1-why-tests.md](../../../../../lessons/I1-why-tests.md) — 131~184행
- [$WORKTREE_ROOT/concept-census-20261021/lessons/I1-why-tests.md](../../../../../lessons/I1-why-tests.md) — 186~202행
- [$WORKTREE_ROOT/concept-census-20261021/lessons/I1-why-tests.md](../../../../../lessons/I1-why-tests.md) — 204~250행
- [$WORKTREE_ROOT/concept-census-20261021/lessons/I1-why-tests.md](../../../../../lessons/I1-why-tests.md) — 262~264행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

DB 구현보다 테스트 범위 선택을 설명한다. 단위 계산, Service 단위, Controller slice, 실제 MySQL integration을 구분하고 7-1/7-2/7-3 및 M10으로 이어진다.

- 현재 난이도: 개념 레슨(입문~심화 전이)
- 판정 이유: 테스트가 요구 계약의 동작을 고정하고 단위/슬라이스/통합 경계를 선택하는 입문 레슨이다.
- 다음 단계: 7장 controller/service/integration 과제 및 M10의 재현/원인 검증과 연결.

## 부족한 점

### L-I1-G1 · low

PageInfo 예제는 학습자가 두 파일을 새로 만들어야 하며 저장소에서 바로 실행되는 lesson test는 없다.

판정 범위: 개념 레슨의 작은 계산 테스트 목표에는 맞지만 완료자는 자기 파일로 결과를 확인해야 한다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/I1-why-tests.md](../../../../../lessons/I1-why-tests.md) — 131~144행

## 확장 개발 명세

### 나머지 경계에서 테스트 실패를 직접 보기

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

14/5의 나머지 경계가 정수 나눗셈 오류를 드러내고, 딱 맞는 수와 빈 입력만으로는 오류를 잡지 못한다.

**시작 상태**

Gradle Java 프로젝트의 기존 Main.java와 같은 package에 PageInfo.java 및 PageInfoTest.java를 새로 만든다. 입력은 total=14,pageSize=5 / 15,5 / 0,5이며 page는 0부터 시작한다.

**학습자가 할 일**

- PageInfo.totalPages()에 올림 나눗셈을 작성하고 위 세 입력의 결과 3,3,0을 단언한다.
- total=14,page=2에서 hasNext=false, page=1에서는 true를 단언한다.
- totalPages 식을 total/pageSize로 일부러 바꾸고 14/5와 hasNext 경계 테스트가 실패하는지 확인한다.
- 15/5와 0/5만 남긴 테스트는 잘못된 식에서도 통과하는지, assertion을 제거하면 실패값 출력에도 테스트가 통과하는지 비교한다.

**정상 사례**

- total/pageSize=(14,5)이면 totalPages=3, page1 hasNext=true, page2 hasNext=false다.
- (15,5) → 3쪽, (0,5) → 0쪽.

**실패·경계 사례**

- 정수 나눗셈 total/pageSize는 (14,5)에서 2를 돌려 totalPages 단언이 실패하고, page=1에 대한 hasNext도 false로 잘못 계산한다.
- 15/5 및 0/5만 시험하면 이 버그는 통과한다. 단언 없는 테스트 역시 검증에 실패해도 JUnit 성공으로 끝난다.

**동시성·성능**

해당 없음.

**DB 관찰**

- Gradle 출력의 테스트 이름과 expected/actual 값.

**합격 기준**

- 정상 올림 계산에서 PageInfoTest가 기대한 전체 단언을 통과한다.
- 정수 나눗셈 주입 때 totalPages 및 page=1 hasNext의 두 경계 단언이 실패하고, 식을 고친 뒤 통과한다.
- 쉬운 입력만 남긴 시험의 거짓 통과와 assertion 없는 시험의 의미를 설명한다.

**기존 과제와 중복·연결**

V01/J19의 테스트 기본 원리, 7-1~7-3의 계층별 실습으로 이어진다.

**우선순위**

low

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-I1/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-I1/screen.jpg`)
- 관찰: 레슨 HTML 시각 검토 전
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-I1/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-I1/dom.txt`)

- source: [$WORKTREE_ROOT/scenario-crud-redesign/lessons/I1-why-tests.md](../../../../../lessons/I1-why-tests.md)
- source_same: 예
- html: [$WORKTREE_ROOT/scenario-crud-redesign/lessons/I1-why-tests.html](../../../../../lessons/I1-why-tests.html)
- html_same: 아니오
- difference: latest HTML未검토.

- lesson 실행은 하지 않음.
- 브라우저 렌더 미검토.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/I1-why-tests.md](../../../../../lessons/I1-why-tests.md) — 1~264행 (개념, 예시, 따라하기, 일부러 틀려 보기 및 확인 문제)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-I1.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-I1.json`)
