# 7-2. 서비스 단위 테스트 — mock과 spy

## 상황

업무 규칙은 서비스에 모여 있다. "내 글엔 좋아요 금지", "이미 좋아요면 아무것도 안 함", "볼 수 없는 글은 404" 같은 것들이다. 이 규칙들을 **Spring도 DB도 없이** 순수 자바 단위 테스트로 빠르게 고정한다.

이때 협력 객체를 다루는 두 방법을 구분해 쓴다.

- **mock**: 전부 가짜. 리포지토리처럼 "이번 테스트에서 이런 값을 돌려줘"만 정한다.
- **spy**: 실물을 감싼다. 진짜 로직은 그대로 돌리면서 "몇 번, 무엇으로 불렸나"를 확인한다.

## 만들 것

테스트 클래스 **`LikeServiceTest`** (이름 그대로) — 4장의 좋아요 서비스를 대상으로

| # | 시나리오 | 확인 |
|---|---|---|
| 1 | 내 글에 좋아요 | 정해 둔 예외가 난다. 저장·숫자 증가가 **호출되지 않았다** |
| 2 | 아직 안 누른 글에 좋아요 | 좋아요 저장 1번, 숫자 증가 1번. 저장된 `PostLike`의 글·회원을 `ArgumentCaptor`로 꺼내 확인 |
| 3 | 이미 누른 글에 또 좋아요 | 저장도 증가도 **없다**(멱등) |
| 4 | 안 누른 글에 취소 | 삭제도 감소도 **없다** |
| 5 | 볼 수 없는 글 | "볼 수 있나" 규칙(2-3의 규칙 클래스 등)을 **spy**로 감싸 실제 판정을 쓰게 하고, 한 번 호출됐는지와 결과(404 예외)를 확인한다 |

- `@ExtendWith(MockitoExtension.class)` — Spring 컨텍스트를 띄우지 않는다.
- 리포지토리는 `@Mock`, 테스트 대상 서비스는 생성자로 직접 만들거나 `@InjectMocks`.
- 시간이 필요하면 `Clock.fixed(...)`를 넣는다.

## 직접 확인

```bash
./gradlew test --tests '*LikeServiceTest'
```

## 채점 기준

T = 테스트 실행(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| T1 | `./gradlew test --tests '*LikeServiceTest'` | 통과, 테스트 5개 이상 |
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

`PostAccessPolicy policy = spy(new PostAccessPolicy(followRepository, blockRepository));`처럼 실물을 만든 뒤 감싼다(그 안의 리포지토리는 mock). 그러면 `policy.canView(...)`는 진짜 규칙대로 판정하고, 테스트 끝에 `verify(policy).canView(viewer, post)`로 호출을 확인할 수 있다. spy의 메서드를 바꾸고 싶으면 `doReturn(...).when(policy).canView(...)` 형태를 쓴다(`when(policy.canView(...))`는 진짜 메서드를 한 번 실행한다).
</details>

## 다음 단계

[7-3. 통합 테스트 — Testcontainers](7-3-integration.md)
