# 0-8. Java 선언식으로 API 읽기 — 타입·변수·메서드

## 상황

> "TypeScript 코드는 읽을 수 있는데 Java 파일은 왜 이름 앞에 타입이 붙죠? static final과 .class는 무슨 뜻인가요?"

게시판 화면은 새 글을 쓰기 전에 알림 개수를 확인한다. GET /api/start/summary를 만들면서 API 코드에 나오는 Java 선언을 익힌다. 이 단계는 DB 없이 계산한 값을 반환한다.

## 화면 시나리오

```screen
{
  "title": "게시판 요약을 불러온다",
  "summary": "화면은 요약 API를 호출한다. 서버는 정수·논리값과 참조 타입을 사용해 응답을 만들고 JSON으로 돌려준다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "개발 게시판", "right": "김자바" },
    { "type": "text", "id": "unread", "value": "읽지 않은 알림 3개", "emphasis": "title" },
    { "type": "text", "id": "status", "value": "새 알림이 있어요", "emphasis": "caption" },
    { "type": "actions", "id": "actions", "items": [{ "id": "refresh", "label": "새로고침", "variant": "primary" }] }
  ],
  "flows": [{
    "name": "요약 새로고침",
    "steps": [
      { "kind": "user", "text": "새로고침을 누른다", "focus": ["refresh"] },
      { "kind": "request", "method": "GET", "path": "/api/start/summary" },
      { "kind": "server", "text": "컨트롤러 메서드가 int·boolean·String 값을 담은 SummaryResponse를 반환한다. hasNotice는 static 메서드로 계산한다" },
      { "kind": "response", "status": 200, "headers": ["Content-Type: application/json"], "body": "{\"unreadCount\":3,\"hasNotice\":true,\"nickname\":\"김자바\",\"responseType\":\"SummaryResponse\"}" },
      { "kind": "screen", "text": "응답의 숫자와 boolean에 따라 알림 안내를 표시한다", "focus": ["unread", "status"] }
    ]
  }]
}
```

## 만들 것

| 항목 | 계약 |
|---|---|
| 메서드·경로 | GET /api/start/summary |
| 응답 | 200 JSON: unreadCount=3, hasNotice=true, nickname="김자바", responseType="SummaryResponse" |
| 계산 | hasNotice는 읽지 않은 알림 수가 0보다 큰지 판단하는 메서드로 계산 |
| DB | 없음. 메서드에 정한 값을 반환한다 |

## Java 선언을 읽는 법

~~~java
private static final int UNREAD_COUNT = 3;

private static boolean hasNotice(int unreadCount) {
    return unreadCount > 0;
}

@GetMapping("/api/start/summary")
public SummaryResponse summary() {
    String nickname = "김자바";
    return new SummaryResponse(
            UNREAD_COUNT,
            hasNotice(UNREAD_COUNT),
            nickname,
            SummaryResponse.class.getSimpleName()
    );
}
~~~

- int unreadCount처럼 타입이 이름 앞에 온다. TypeScript의 const unreadCount: number = 3과 달리 Java 지역 변수는 선언할 때 타입을 쓴다. boolean은 true/false를 담는다.
- int, boolean, long 같은 primitive는 기본 값이다. String, List<String>, SummaryResponse는 객체를 가리키는 reference 타입이다. 참조 변수는 대상이 없을 때 null일 수 있고 primitive는 null이 될 수 없다.
- 메서드 선언은 반환 타입 이름(매개변수) 순서다. boolean hasNotice(int unreadCount)는 정수를 받아 boolean을 돌려준다. TypeScript의 function hasNotice(unreadCount: number): boolean과 비교해 읽는다.
- static은 객체를 만들지 않고 클래스에 속하는 멤버다. 이 코드의 hasNotice는 SummaryController 클래스 안의 private static 메서드이므로 같은 컨트롤러 메서드에서 hasNotice(UNREAD_COUNT)로 부른다. SummaryResponse.hasNotice(...)처럼 DTO에서 부를 수는 없다. 인스턴스 메서드는 response.getNickname()처럼 객체에 속한다.
- final 변수는 값을 다시 대입할 수 없다. static final 상수는 클래스에 하나만 두고 바꾸지 않는 값에 사용한다. 상수 이름은 대문자와 밑줄로 쓰는 것이 관례다.
- SummaryResponse.class는 SummaryResponse의 Class 객체를 가져온다. .getSimpleName()은 "SummaryResponse"를 얻는다. JavaScript의 생성자 함수와 완전히 같은 것은 아니지만, 런타임 타입 정보를 나타내는 객체를 얻는 문법이다.
- return new SummaryResponse(...)는 새 응답 객체를 만든다. Spring은 반환 객체를 JSON으로 바꾼다.

## 구현 가이드

필요한 역할만 펼쳐 완성 코드와 화면 계약을 대조한다.

<details>
<summary>Controller — 경로·상수·계산 메서드</summary>

~~~java
package org.example.start;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SummaryController {
    private static final int UNREAD_COUNT = 3;

    private static boolean hasNotice(int unreadCount) {
        return unreadCount > 0;
    }

    @GetMapping("/api/start/summary")
    public SummaryResponse summary() {
        String nickname = "김자바";
        return new SummaryResponse(UNREAD_COUNT, hasNotice(UNREAD_COUNT), nickname,
                SummaryResponse.class.getSimpleName());
    }
}
~~~

</details>

<details>
<summary>DTO — 응답 타입 선언</summary>

~~~java
package org.example.start;

public record SummaryResponse(int unreadCount, boolean hasNotice, String nickname,
                             String responseType) {
}
~~~

primitive와 reference 타입이 응답 필드에 어떻게 쓰였는지 확인한다.

</details>

## 직접 확인

~~~bash
./gradlew compileJava
~~~

API 서버 주소는 페이지 상단 공통 입력에서 설정하고, 요약 요청은 아래 실행 패널에서 보낸다. Postman 설정은 접어서 확인할 수 있다.

```check
{
  "requests": [
    { "id": "A", "title": "게시판 요약", "method": "GET", "path": "/api/start/summary" }
  ],
  "checks": [
    { "id": "C1", "request": "A", "expect": { "status": 200, "json": [
      { "path": "$.unreadCount", "equals": 3 },
      { "path": "$.hasNotice", "equals": true },
      { "path": "$.nickname", "equals": "김자바" },
      { "path": "$.responseType", "equals": "SummaryResponse" }
    ] } }
  ]
}
```

## 채점 기준

| # | 방법 | 기대 |
|---|---|---|
| C1 | HTTP 요청 | 200, 네 JSON 값이 계약과 같다 |
| R1 | 코드 리뷰 | primitive와 reference 타입이 있고, 반환 타입·매개변수 타입이 명시되어 있다 |
| R2 | 설명 | static, final, ClassName.class의 의미를 API 코드 예로 설명한다 |

## 필요한 지식

- [J01 Java 기본 타입과 참조 타입](../../docs/knowledge/J01-types-string.md) — primitive와 reference 타입을 구분한다
- [J03 제네릭](../../docs/knowledge/J03-generics.md) — `List<String>`에서 꺾쇠 안 타입 읽기
- [P09 Java 문법 기초](../../docs/knowledge/P09-java-syntax-basics.md) — 타입·변수·메서드 선언 순서

## 다음 단계

[1-1. 요청 받기](../ch1-create-post/1-1-receive-request.md) — 요청 JSON을 DTO로 받고 게시글 API의 입구를 만든다.
