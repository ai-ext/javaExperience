# Java·Spring Boot 필수 기초

기본 API를 읽고 만드는 데 필요한 개념을 여섯 단원으로 연결합니다. 이 경로의 필수 여부는 기본 API 입문 기준이며, 문서가 다루는 모든 내용의 난이도나 검증 완료를 뜻하지 않습니다.

화면의 단계 전환은 개념을 설명하기 위한 재생입니다. 실제 서버를 새로 실행하거나 요청하지 않습니다. 별도 최소 예제에서 확인한 값과 적용 범위는 각 단원 아래에 표시합니다.

## C01 객체·생성자

같은 값과 같은 객체를 구분하고 생성자 입력이 객체 상태로 이어지는 과정을 봅니다. 선수 단원은 없습니다.

연결 원문: [P09 Java 문법](../docs/knowledge/P09-java-syntax-basics.md), [P04 생성자와 객체 생성](../docs/knowledge/P04-constructors-builder.md).

## C02 Spring과 Boot·앱 시작

Spring의 기반 기능과 Boot의 시작·설정 역할을 나누고, DB 없는 최소 앱의 HTTP 응답을 관찰합니다. 선수는 C01입니다.

연결 원문: [P01 Spring과 Boot](../docs/knowledge/P01-spring-vs-boot.md).

## C03 애노테이션은 누가 언제 읽나

애노테이션의 선언 정보와 그 정보를 읽어 처리하는 주체를 구분합니다. 실제 예제는 보존 정책과 명시 호출을 확인하며 모든 Spring 애노테이션을 실행한 것은 아닙니다. 선수는 C01·C02입니다.

연결 원문: [P03 애노테이션](../docs/knowledge/P03-annotations-cheatsheet.md), [P27 시점별 처리](../docs/knowledge/P27-annotations-when-how.md), [J06 보존 정책과 리플렉션](../docs/knowledge/J06-enum-annotation-reflection.md).

## C04 IoC·DI·생성자 주입

직접 조립한 객체와 컨테이너가 조립한 객체를 같은 동작으로 비교합니다. 필수 의존성이 없는 경우의 실패도 관찰합니다. 선수는 C01·C02·C03이며 Lombok은 필수 선수가 아닙니다.

연결 원문: [P12 IoC·DI 입문](../docs/knowledge/P12-why-beans-ioc-intro.md), [P11 빈 등록과 주입](../docs/knowledge/P11-bean-registration-di.md).

## C05 Lombok 생성 코드

표식을 붙인 소스, 생성된 생성자·getter, 실제 컴파일 결과를 연결합니다. processor를 끈 실패와 켠 성공을 구분합니다. 선수는 C01·C03입니다.

연결 원문: [W19 Lombok의 선택과 함정](../docs/knowledge/W19-lombok-or-not.md), [P11 생성자와 주입](../docs/knowledge/P11-bean-registration-di.md).

## C06 Bean 생명주기

이번 예제는 setter 주입으로 단계를 구분해 생성·주입·초기화·사용·정상 종료를 관찰합니다. 생성자 주입은 객체 생성 시 인자를 받으며, 강제 종료까지 관찰한 것은 아닙니다. 선수는 C04입니다.

연결 원문: [S01 IoC·DI·빈 생명주기](../docs/knowledge/S01-ioc-di.md).

## 근거와 직접 확인

- [최소 예제의 실행 기록과 범위](../docs/design/concept-curriculum-2026-10-25/proof/execution.json)
- [실행한 Java 검증 코드](../docs/design/concept-curriculum-2026-10-25/proof/src/test/java/learning/CoreConceptTest.java)
- [공식 출처와 주장별 대응](../docs/design/concept-curriculum-2026-10-25/research/sources.json)
- [전체 개념 목록](../docs/knowledge/README.md)
