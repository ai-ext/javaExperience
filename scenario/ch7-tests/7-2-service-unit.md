# 7-2. 서비스 단위 테스트 — mock과 spy

## 상황

업무 규칙은 서비스에 모여 있다. "내 글엔 좋아요 금지", "이미 좋아요면 아무것도 안 함", "볼 수 없는 글은 404" 같은 것들이다. 이 규칙들을 **Spring도 DB도 없이** 순수 자바 단위 테스트로 빠르게 고정한다.

이때 협력 객체를 다루는 두 방법을 구분해 쓴다.

- **mock**: 전부 가짜. 리포지토리처럼 "이번 테스트에서 이런 값을 돌려줘"만 정한다.
- **spy**: 실물을 감싼다. 진짜 로직은 그대로 돌리면서 "몇 번, 무엇으로 불렸나"를 확인한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "서비스 단위 테스트",
  "summary": "Spring도 DB도 없이 서비스 규칙만 순수 자바로 시험한다. 리포지토리는 mock, 규칙 클래스는 spy.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "IntelliJ — LikeServiceTest"
    },
    {
      "type": "code",
      "id": "run",
      "label": "실행",
      "value": "./gradlew test --tests org.example.like.LikeServiceTest"
    },
    {
      "type": "code",
      "id": "result",
      "label": "결과",
      "value": "LikeServiceTest > 내 글에 좋아요하면 예외, 저장 없음() PASSED\nLikeServiceTest > 새 좋아요는 저장 1번·숫자 +1() PASSED\nLikeServiceTest > 이미 좋아요면 아무것도 안 함() PASSED\nLikeServiceTest > 안 누른 글 취소는 아무것도 안 함() PASSED\nLikeServiceTest > 볼 수 없는 글은 실제 규칙(spy)으로 404() PASSED"
    }
  ],
  "flows": [
    {
      "name": "이 테스트가 지키는 요청 — 내 글에 좋아요",
      "steps": [
        {
          "kind": "user",
          "text": "테스트를 실행한다",
          "focus": [
            "run"
          ]
        },
        {
          "kind": "request",
          "method": "PUT",
          "path": "/api/posts/12/like",
          "headers": [
            "Authorization: Bearer tok-kimjava"
          ]
        },
        {
          "kind": "server",
          "text": "테스트에서는 HTTP 없이 likeService.like(12, me)를 직접 부른다. postRepository는 @Mock — '12번 글의 작성자는 me'를 돌려주게 정한다"
        },
        {
          "kind": "server",
          "text": "예외가 났는지 + verify(postLikeRepository, never()).insertIgnore(anyLong(), anyLong()) — INSERT 시도도 없었는지 본다"
        },
        {
          "kind": "response",
          "status": 400
        },
        {
          "kind": "screen",
          "text": "실제 요청이었다면 400 — 테스트는 1초 안에 끝난다",
          "focus": [
            "result"
          ]
        }
      ]
    },
    {
      "name": "볼 수 없는 글 — spy",
      "steps": [
        {
          "kind": "user",
          "text": "spy 테스트",
          "focus": [
            "run"
          ]
        },
        {
          "kind": "request",
          "method": "PUT",
          "path": "/api/posts/7/like",
          "headers": [
            "Authorization: Bearer tok-kimjava"
          ]
        },
        {
          "kind": "server",
          "text": "PostAccessPolicy를 spy로 감싸 진짜 규칙대로 판정하게 하고, verify(policy).canView(...)로 한 번 불렸는지 확인한다"
        },
        {
          "kind": "response",
          "status": 404
        },
        {
          "kind": "screen",
          "text": "통과",
          "focus": [
            "result"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

테스트 클래스 **`LikeServiceTest`** (이름 그대로) — 4장의 좋아요 서비스를 대상으로

| # | 시나리오 | 확인 |
|---|---|---|
| 1 | 내 글에 좋아요 | 정해 둔 예외가 난다. 저장·숫자 증가가 **호출되지 않았다** |
| 2 | 아직 안 누른 글에 좋아요 | `insertIgnore`가 1행을 반환하고 숫자 증가 1번. 전달한 글·회원 ID를 `ArgumentCaptor`로 꺼내 확인 |
| 3 | 이미 누른 글에 또 좋아요 | `INSERT IGNORE`는 0행을 반환하고 좋아요 숫자 증가는 **없다**(멱등) |
| 4 | 안 누른 글에 취소 | DELETE는 0행을 반환하고 좋아요 숫자 감소는 **없다** |
| 5 | 볼 수 없는 글 | "볼 수 있나" 규칙(2-3의 규칙 클래스 등)을 **spy**로 감싸 실제 판정을 쓰게 하고, 한 번 호출됐는지와 결과(404 예외)를 확인한다 |

4-2에서 `INSERT IGNORE`로 바꿨으므로 `PostLike` 엔티티 저장은 없다. 2번에서는 insert 메서드에 넘어간 글·회원 ID를 캡처하고, 3번에서는 insert가 0행을 돌려주면 숫자 증가가 **없다**는 것을 확인한다.

- `@ExtendWith(MockitoExtension.class)` — Spring 컨텍스트를 띄우지 않는다.
- 리포지토리는 `@Mock`, 테스트 대상 서비스는 생성자로 직접 만들거나 `@InjectMocks`.
- 시간이 필요하면 `Clock.fixed(...)`를 넣는다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 테스트에서는 HTTP 없이 likeService.like(12, me)를 직접 부른다. postRepository는 @Mock — '12번 글의 작성자는 me'를 돌려주게 정한다
- 예외가 났는지 + verify(postLikeRepository, never()).insertIgnore(anyLong(), anyLong()) — INSERT 시도도 없었는지 본다
- PostAccessPolicy를 spy로 감싸 진짜 규칙대로 판정하게 하고, verify(policy).canView(...)로 한 번 불렸는지 확인한다

<details>
<summary>테스트 — 계약 확인</summary>

`LikeServiceTest.java`에서 Spring 컨텍스트 없이 Mockito가 리포지토리를 만들고, 서비스는 생성자로 직접 만든다. `@Spy`를 모든 테스트에 넣지 않는다. 다섯 번째 테스트에서만 실제 `PostAccessPolicy`를 `spy(...)`로 감싼다.

```java
@ExtendWith(MockitoExtension.class)
class LikeServiceTest {
    @Mock PostRepository postRepository;
    @Mock PostLikeRepository postLikeRepository;
    @Mock PostAccessPolicy accessPolicy;
    @Mock PlatformTransactionManager transactionManager;

    LikeService likeService;

    @BeforeEach
    void setUp() {
        likeService = new LikeService(postRepository, postLikeRepository,
                accessPolicy, transactionManager);
    }
}
```

4-2의 실제 저장은 `INSERT IGNORE`다. 성공 시 넘어간 두 ID와 숫자 증가를 확인하고, 이미 있으면 0행·숫자 증가 없음으로 검증한다.

```java
given(postLikeRepository.insertIgnore(POST_ID, KIMJAVA.id())).willReturn(1);
LikeResponse response = likeService.like(POST_ID, KIMJAVA);
ArgumentCaptor<Long> postId = ArgumentCaptor.forClass(Long.class);
ArgumentCaptor<Long> memberId = ArgumentCaptor.forClass(Long.class);
verify(postLikeRepository).insertIgnore(postId.capture(), memberId.capture());
assertThat(postId.getValue()).isEqualTo(POST_ID);
assertThat(memberId.getValue()).isEqualTo(KIMJAVA.id());
verify(postRepository).incrementLikeCount(POST_ID);
```

이 코드는 각 테스트의 사전 설정을 생략한 핵심 부분이다. 예외·멱등·취소·spy 설정까지 실행 가능한 전문은 아래 **테스트** 코드 접기에서 확인한다.

</details>

## 직접 확인

```bash
./gradlew test --tests org.example.like.LikeServiceTest
```

## 채점 기준

T = 테스트 실행(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| T1 | `./gradlew test --tests org.example.like.LikeServiceTest` | 통과, 테스트 5개 이상 |
| R1 | 범위 | `@SpringBootTest`·`@WebMvcTest`가 없는 순수 단위 테스트다. 실행이 1초 안팎이다 |
| R2 | mock | 리포지토리는 mock이고, 각 테스트가 필요한 상호작용만 준비한다(쓰지 않는 stubbing이 없다 — Mockito strict stubs에 걸리지 않는다) |
| R3 | spy | 5번에서 spy를 **왜** 썼는지가 분명하다(실제 규칙을 돌리되 호출을 확인). mock으로 충분한 곳에 spy를 쓰지 않았다 |
| R4 | 부정 검증 | 1·3·4번에서 "일어나지 않아야 할 일"을 `verify(..., never())`로 확인한다 |
| R5 | 캡처 | 2번에서 `ArgumentCaptor`로 저장된 값을 꺼내 확인한다 |
| R6 | 설계 피드백 | 서비스가 테스트하기 어렵다면(정적 호출·`new`로 만든 협력 객체·`LocalDateTime.now()` 직접 호출) 그 지점을 짚는다 |

## 필요한 지식

- [V03 mock 실전 — 다섯 더블은 목적이 다르다](../../docs/knowledge/V03-mocking-in-practice.md#22-다섯-더블은-목적이-다르다)
- [V03 — spy는 실물의 일부 동작을 보존한다](../../docs/knowledge/V03-mocking-in-practice.md#221-spy는-실물의-일부-동작을-보존한다-보강)
- [V03 — 시간과 난수는 작은 의존성으로 넣는다](../../docs/knowledge/V03-mocking-in-practice.md#27-시간과-난수는-작은-의존성으로-넣는다)
- [J19 — mock과 ArgumentCaptor로 외부 효과 검증](../../docs/knowledge/J19-testing-junit.md#예제-2--mock과-argumentcaptor로-외부-효과-검증)
- [W12 인터페이스는 왜 만드나](../../docs/knowledge/W12-why-interfaces.md) — 테스트하려고 인터페이스가 꼭 필요한가

## 힌트 (막힐 때만)

<details>
<summary>힌트 — spy 만들기</summary>

`PostAccessPolicy policy = spy(new PostAccessPolicy(followRepository, blockPolicy));`처럼 실물을 만든 뒤 감싼다(그 안의 협력 객체는 mock). 그러면 `policy.canView(...)`는 진짜 규칙대로 판정하고, 테스트 끝에 `verify(policy).canView(viewer, post)`로 호출을 확인할 수 있다.

spy의 메서드를 바꾸고 싶으면 `doReturn(...).when(policy).canView(...)` 형태를 쓴다(`when(policy.canView(...))`는 진짜 메서드를 한 번 실행한다). </details>

## 다음 단계

[7-3. 통합 테스트 — Testcontainers](7-3-integration.md)
