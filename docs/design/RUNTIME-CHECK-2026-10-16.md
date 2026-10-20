# 현재 실습 서버 실행 확인 · 2026-10-16

이 기록은 **현재 작업 트리의 학습자 코드**에 대한 읽기 전용 확인이다. 시나리오의 101단계 완성 서버나 P02의 별도 메모 예제를 실행한 결과가 아니다.

| 확인 | 결과 | 범위 |
|---|---|---|
| `./gradlew compileJava` | 통과 | 현재 `src/main/java` 컴파일 |
| `./gradlew test` | 통과 · 1개 테스트 | `HelloControllerTest` 하나. 시나리오 API 전체를 검증하지 않음 |
| `./gradlew bootRun` | 시작 성공 · 8080 | `application.yml`의 `localhost:3306/community`에 연결. 이 저장소의 `docker compose ps mysql`은 빈 목록이어서 연결된 MySQL의 소유·데이터는 확정하지 않음 |
| 읽기 전용 `GET /hello` | 200 | 현재 Controller 경로 |
| 읽기 전용 `GET /api/lists` | 500 | 현재 Controller 경로, 아래 원인 확인 |
| 읽기 전용 `GET /api/start/config` | 404 | 0-6에서 학습자가 아직 만들지 않은 경로 |
| 읽기 전용 `GET /api/memos` | 404 | P02 문서의 **별도 예제 프로젝트** 경로, 현재 앱에는 없음 |
| 읽기 전용 `GET /api/posts` | 405 | 현재 앱에 POST만 있고 GET은 없음 |

`/api/lists`의 500은 `PostEntity.getLike()`가 `Boolean heart`를 원시 `boolean`으로 반환할 때 `null`을 언박싱하면서 발생했다. 현재 스택은 `PostEntity.java:68` → `ListResponseDto.java:35` → `PostController.java:51`이다. 학습자 코드와 DB 데이터를 이 검증 작업에서 수정하지 않았다.

실제 쓰기 요청은 보내지 않았다. 앱이 연결한 MySQL은 이 저장소의 Compose 서비스가 아니며, 테스트 데이터인지 확인되지 않았다. 실행한 `bootRun`은 정상 종료했고 8080 리스너가 사라진 것을 확인했다. 101단계의 기대 응답과 실제 결과를 검증하려면 각 단계의 구현 코드와 통제된 테스트 DB가 필요하다.
