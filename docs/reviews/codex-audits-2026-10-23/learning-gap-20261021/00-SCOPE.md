# javaExperience 학습 공백 검증 범위

확인 시작: 2026-10-21 KST.

## 사용자 목표
IoC, DI, Bean, Entity, EntityManager, 트랜잭션, readOnly, rollback을 설명하는 데서 끝내지 않고 Controller/request DTO 이후 Service 비즈니스 로직과 1:N 매핑 및 좋아요 등 기능을 직접 구현할 수 있는지 평가한다. 3~6년차라는 표현은 보편적 연차 자격 기준이 아니라 이 저장소에서 목표로 하는 실무 역량의 깊이를 뜻한다.

## 대상과 보존
기본 $REPO_ROOT 및 개념·CRUD·공통 원본 worktree 현재 파일을 읽는다. 기준 시각 HEAD/변경/파일 SHA는 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/baseline.json에 보관했다. 진행 중인 다른 작업이 있으므로 파일 변화는 후속 검증 때 재확인한다. main의 빈 학습 코드와 정답/snapshot을 구별한다. 감사 범위에서 원본 레포 코드를 고치지 않는다.

## 결과 판단 축
1. 개념 정확성: 대상 버전과 공식 원문에 맞는가.
2. 구현 연결: 요구사항에서 메서드 계약·조회·정책·상태변경·DB제약을 스스로 유도할 수 있는가.
3. 관찰: Java 객체/영속성컨텍스트/SQL/DB 외부연결의 전후값을 구별하는가.
4. 실패·동시성: 잘못된 입력/권한/중복/후행실패/경쟁조건을 다루는가.
5. 평가 가능성: 정답을 숨긴 독립 과제와 성공·실패 합격기준이 있는가.

상태는 충분/부분충족/연결부족/누락/부정확/미검증으로 구별한다. 키워드 검색만으로 충분 판정을 하지 않는다. 정적 코드 확인, 기존 실행 자료, 이번 실행 결과를 분리한다. 실제 학습자가 이해했다는 증거는 이 검토로 만들 수 없으므로 이해도는 별도 수행평가가 필요하다.

## 분담과 산출물
개념별 파일은 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/concepts/ , 기능별 파일은 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/ , Luna 공식 근거는 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/ , 이번 실제 실행은 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/ 에 남긴다.

## 실행 검증
실제 학습자 소스와 Gradle 설정을 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/learner-project/ 에 바이트 그대로 복사했다. Java21로 테스트하고 test 프로파일의 일회용 MySQL Testcontainers를 이용한다. 개발중인 community/practice/project DB에 요청하거나 데이터를 변경하지 않는다. 실행 결과가 나오기 전에는 통과로 기록하지 않는다.
