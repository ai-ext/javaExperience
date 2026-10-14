# 0-7. Lombok DTO — 생성된 메서드와 JSON 확인

## 상황

> "기존 프로젝트의 요청 DTO에는 필드와 `@Getter`만 보이는데, `getName()`은 어디 있죠? 같은 응답을 record로도 만들 수 있나요?"

0-4의 `POST /api/start/profile`을 그대로 사용한다. 이번에는 **요청·응답 DTO를 Lombok 클래스로 바꾸고** record 버전과 요청/응답 결과를 비교한다. API 주소와 정상 응답 모양은 바꾸지 않는다. 이 과제는 Lombok을 사용하는 연습이며, 이후 모든 DTO에 Lombok을 쓰라는 뜻은 아니다.

## 화면 시나리오

```screen
{
  "title": "같은 요청, 다른 DTO 작성법",
  "summary": "JSON을 Lombok DTO로 받고 응답 DTO로 돌려준다. 필수값이 빠지면 저장하거나 계산하지 않고 400으로 거절한다.",
  "screen": [
    { "type": "field", "id": "name", "label": "이름", "value": "김자바" },
    { "type": "field", "id": "age", "label": "나이", "value": "20" },
    { "type": "actions", "id": "send", "items": [{ "id": "submit", "label": "프로필 확인", "variant": "primary" }] },
    { "type": "text", "id": "result", "value": "김자바 · 성인", "emphasis": "title" }
  ],
  "flows": [{
    "name": "정상 요청",
    "steps": [
      { "kind": "user", "text": "프로필 확인을 누른다", "focus": ["submit"] },
      { "kind": "request", "method": "POST", "path": "/api/start/profile", "body": "{\"name\":\"김자바\",\"age\":20}" },
      { "kind": "server", "text": "Jackson이 요청 DTO에 값을 넣고 검증한 뒤, 컨트롤러가 응답 DTO를 만든다" },
      { "kind": "response", "status": 200, "body": "{\"name\":\"김자바\",\"age\":20,\"adult\":true}" },
      { "kind": "screen", "text": "응답을 표시한다", "focus": ["result"] }
    ]
  }]
}
```

## 만들 것

| 항목 | 계약 |
|---|---|
| 메서드·경로 | 기존 `POST /api/start/profile` |
| 요청 | JSON `{ "name": "김자바", "age": 20 }`, 전용 `ProfileRequest` 클래스 |
| 성공 | `200` JSON `{ "name": "김자바", "age": 20, "adult": true }`, 전용 `ProfileResponse` 클래스 |
| 실패 | 이름이 없거나 공백, 나이가 없거나 0~150 밖이면 `400`; 나이가 숫자가 아니어도 `400` |
| DB | 없음. 이 단계는 DTO와 JSON의 경계를 연습한다. DB 저장은 1-2부터 한다. |

## 구현 가이드

먼저 0-4의 API를 실행해 응답을 기록하고, DTO의 작성법만 바꾼 뒤 같은 요청을 다시 보낸다. 필요한 부분을 하나씩 펼쳐 따라 한다.

<details>
<summary>DTO — Lombok 의존성과 요청·응답 클래스</summary>

실습 레포 `build.gradle`의 `dependencies` 안에 두 줄을 추가한다. `compileOnly`만 넣으면 생성 코드가 컴파일에 반영되지 않을 수 있다.

```gradle
compileOnly 'org.projectlombok:lombok'
annotationProcessor 'org.projectlombok:lombok'
```

`./gradlew compileJava`로 확인한다. IntelliJ에서만 빨간 줄이면 IDE의 annotation processing 설정을 확인하고, 터미널 빌드 결과와 구분한다. 생성된 getter를 눈으로 보고 싶으면 `javap -p build/classes/java/main/org/example/start/ProfileController\$ProfileRequest.class`를 실행한다(중첩 클래스일 때의 예).

0-4에서 만든 `ProfileController.java`의 DTO를 다음처럼 바꾼다. 컨트롤러 안에 두면 `static` 클래스여야 한다. 필요한 import는 IDE에서 추가한다.

```java
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public static class ProfileRequest {
    @NotBlank private String name;
    @NotNull @Min(0) @Max(150) private Integer age;
}

@Getter @RequiredArgsConstructor
public static class ProfileResponse {
    private final String name;
    private final int age;
    private final boolean adult;
}
```

`Integer`를 쓴 이유는 나이가 빠지면 `null`로 받아 `@NotNull`이 `400`으로 거절하게 하기 위해서다. `int`와 setter를 쓰면 빠진 나이가 `0`으로 남아 성공할 수 있다. 응답 DTO는 `final` 필드와 `@RequiredArgsConstructor`로 생성자를 만든다. 요청 DTO와 응답 DTO를 같은 객체로 돌려주지 않는다.

`@Builder`는 필드가 많을 때 선택한다. `@Builder.Default` 없이 `@Builder`만 붙이면 필드에 쓴 초기값이 빌더 결과에 적용되지 않을 수 있다. 여기서는 필드가 세 개뿐이므로 빌더를 쓰지 않는다. 엔티티에는 `@Data`를 기본으로 붙이지 않는다. 생성되는 setter·`equals`·`toString`이 JPA 연관관계에 영향을 준다.

</details>

<details>
<summary>Controller — 검증한 DTO를 응답 DTO로 변환</summary>

0-4의 record에서는 `request.name()`을 불렀다. Lombok 클래스에서는 생성된 `request.getName()`을 부른다. `@Getter`와 달리 `@Valid`는 요청 필드의 유효성을 검사한다.

```java
@PostMapping("/api/start/profile")
public ProfileResponse profile(@Valid @RequestBody ProfileRequest request) {
    return new ProfileResponse(
        request.getName(), request.getAge(), request.getAge() >= 19);
}
```

`@Valid`와 `@RequestBody`의 import를 확인하고 `./gradlew compileJava`로 실제 생성된 getter가 컴파일되는지 본다.

</details>

## 직접 확인

```bash
./gradlew compileJava
```

API 서버 주소는 페이지 상단 공통 입력에서 설정하고, A~E 요청은 실행 패널에서 보낸다. Postman 설정은 접어서 확인할 수 있다.

```check
{
  "requests": [
    { "id": "A", "title": "성인", "method": "POST", "path": "/api/start/profile", "body": { "name": "김자바", "age": 20 } },
    { "id": "B", "title": "미성년", "method": "POST", "path": "/api/start/profile", "body": { "name": "이프론", "age": 15 } },
    { "id": "C", "title": "빈 이름", "method": "POST", "path": "/api/start/profile", "body": { "name": " ", "age": 20 } },
    { "id": "D", "title": "나이 없음", "method": "POST", "path": "/api/start/profile", "body": { "name": "김자바" } },
    { "id": "E", "title": "나이 151", "method": "POST", "path": "/api/start/profile", "body": { "name": "김자바", "age": 151 } }
  ],
  "checks": [
    { "id": "C1", "request": "A", "expect": { "status": 200, "json": [{ "path": "$.name", "equals": "김자바" }, { "path": "$.age", "equals": 20 }, { "path": "$.adult", "equals": true }] } },
    { "id": "C2", "request": "B", "expect": { "status": 200, "json": [{ "path": "$.adult", "equals": false }] } },
    { "id": "C3", "request": "C", "expect": { "status": 400 } },
    { "id": "C4", "request": "D", "expect": { "status": 400 } },
    { "id": "C5", "request": "E", "expect": { "status": 400 } }
  ]
}
```

## 채점 기준

| # | 방법 | 기대 |
|---|---|
| C1~C2 | HTTP 정상 요청 | 0-4와 같은 JSON, 성인 여부가 맞다 |
| C3~C5 | HTTP 잘못된 요청 | 모두 `400`; `500`이 아니다 |
| R1 | Gradle·코드 리뷰 | Lombok `compileOnly`·`annotationProcessor`가 있고 요청 DTO에 getter·setter·무인자 생성자가 생성된다 |
| R2 | 코드 리뷰 | 응답 DTO에는 getter와 값 생성자가 있으며 요청 DTO를 그대로 반환하지 않는다 |
| R3 | 설명 | record의 `name()`과 Lombok 클래스의 `getName()` 차이, 누락된 `Integer` 값의 검증 경로를 말할 수 있다 |

## 필요한 지식

- [0-4. DTO 만들기](0-4-dto-rules.md) — record 버전과 비교
- [W19 Lombok을 쓸까 말까](../../docs/knowledge/W19-lombok-or-not.md) — 생성되는 코드와 엔티티 주의점
- [P04 생성자와 빌더](../../docs/knowledge/P04-constructors-builder.md) — `@RequiredArgsConstructor`·`@Builder.Default`

## 다음 단계

[0-8. Java 선언식으로 API 읽기](0-8-java-types-and-methods.md) — API 코드의 타입·변수·메서드 선언을 읽는다.
