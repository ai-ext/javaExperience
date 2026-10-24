# 학습 실행 진입점과 현재 코드의 정합성

확인일: 2026-10-21 KST. 판단: **부분 충족 — 현재 상태와 안내의 연결 보완 필요**.

## 확인한 사실

- /Users/ds/code/javaExperience/intent.md의 H2 연습 기록은 당시 변경 의도다. 현재 /Users/ds/code/javaExperience/src/main/resources/application.yml에서는 H2 블록이 주석이고 MySQL `localhost:3306` 연결이 활성이다.
- /Users/ds/code/javaExperience/compose.yaml은 기본 호스트 포트를 13308로 게시한다. 별도 3306 DB를 사용하려는 의도가 있으면 정상일 수 있으므로 이를 현재 연결 실패라고 단정하지 않는다. 다만 Compose 안내를 그대로 따른 새 학습자는 앱의 연결 포트도 맞춰야 한다.
- 현재 셸 `java -version`은 Java 11을 출력했다. /Users/ds/code/javaExperience/build.gradle은 Java 21 toolchain을 지정한다. 설치된 Corretto21을 명시한 별도 복사본의 빌드·테스트는 성공했다.
- main의 실습 Entity 테이블은 `post_txt`다. 시나리오 정답/시드의 `post`, `post_like`, `tag`, `post_tag`와 다른 모델이다. `ddl-auto=update`는 이 두 모델을 교육적으로 같은 단계로 맞춰 주지 않는다.
- main과 세 worktree는 서로 다른 최신 진행 상태다. main만 읽어서 최신 개념 보강과 CRUD 실습 도구가 없다고 판정할 수 없다.

## 왜 교육상 중요한가

Controller 이후 Service/JPA 학습을 시작할 때 실행 환경 불일치와 코드 설계 오류가 동시에 나타나면 학습자는 자신이 무엇을 잘못했는지 구분하기 어렵다. 먼저 어떤 브랜치/코드셋/DB/프로파일/포트로 실습하는지 한 개의 실행 계약이 필요하다.

## 보완할 내용

1. 학습자의 현재 `post_txt` 버전을 보존하고 “내 현재 코드 → 다음 시나리오 시작 코드” 차이를 파일별로 보여 준다.
2. 앱 JDBC URL, 컨테이너 호스트 포트, DB명, 활성 profile, JDK의 실제 값 확인 명령을 한 장에 둔다.
3. H2 연습 이력과 현재 MySQL 실행 안내를 분리한다. 이력이 현재 기본 설정처럼 읽히지 않도록 한다.
4. JPA `ddl-auto`와 SQL seed/migration의 역할을 구분하고, 데이터 초기화 없이 확인하는 순서를 제공한다.
5. 진입점 체크가 성공한 뒤에 Service 로직과 연관관계 과제를 시작한다.

## 합격 기준

- 새 checkout에서 문서의 명령으로 프로젝트와 DB 연결을 준비할 수 있다.
- 실행 전 예상 DB명과 포트, 실행 후 실제 연결 정보를 비교한다.
- 학습자는 “지금 `post_txt`를 실험하는가, `post`·`post_like` 시나리오를 실험하는가”를 답한다.
- 기존 개발 DB를 지우지 않고 일회용 DB에서 저장·롤백·조회 검증이 가능하다.

이번 감사는 개발 DB에 접속하거나 Compose 포트 설정을 바꾸지 않았다. 실제 개발용 DB의 정상 여부는 판정하지 않았고, Testcontainers의 별도 DB로 검증했다.
