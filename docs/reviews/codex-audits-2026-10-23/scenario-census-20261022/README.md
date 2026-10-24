# 시나리오 전수 감사 결과

**결론: 기초·중급과 일부 고급 시나리오는 이미 상당히 갖춰져 있지만, 어려운 문제까지 빠짐없이 직접 수행하고 판정할 수 있는 상태는 아니다.** 부족한 부분은 단순히 개념 이름을 더 넣는 일이 아니다. 실행 가능한 시작점, 독립적인 정답 판정, 장애와 경합의 재현, 운영 복구, 다음 과제로 찾아가는 연결을 보강해야 한다.

확인일: **2026-10-22**. 이번 감사는 새 실습을 구현하는 작업과 구분한다. **전수 대조·실행 증거·확장 개발 명세를 작성했으며, 기존 학습자 코드나 시나리오 원문을 대신 완성하지 않았다.**

## 전수 범위

| 구분 | 검토 단위 |
|---|---:|
| 본편0~16장 | 101 |
| DB 조회·실행계획 경로 | 14 |
| L12~L14의 Q01~Q18 | 18 |
| 선택랩 L15/L16 | 2 |
| 실전 티켓 | 30 |
| M1~M10 미션 | 10 |
| 연결 레슨 | 50 |
| 합계 | **225** |

원문 Markdown은201개다. 같은 문서 안의 Q/M 구간을 독립 학습 단위로 나눴다. 각 단위마다 요구·시작점·제공 코드·검사 정의·정상/실패·후속 연결·공백·확장/합격 기준을 대조했다. 별도 최신 브랜치의 기능형 CRUD5개와 좋아요2개도 **추가7개로 따로 대조**했다. 기존 내용을 기능별로 재배치한 화면이므로232개의 서로 다른 기능을 만들었다는 뜻은 아니다.

이번 감사는 javaExperience 범위다. 외부 StudyMate의 “노하우 랩”과 학습자의 실제 이해도, 세상에 존재하는 모든 백엔드 주제까지 검증했다는 뜻은 아니다.

## 먼저 확인할 결과

1. **기존 고급 과제를 누락으로 세면 안 된다.** N+1 SQL 계측(2-4), JOIN 집계 곱셈(DB-05), EXPLAIN/인덱스 생명주기(DB-08~11), 교착(T-023), 풀 고갈(T-024), 낙관적 락(T-025), 멱등키(T-026), 커서 호환(T-027), 캐시 무효화(T-028), expand/contract(9-5/T-029), JPA/MyBatis flush(10-12)가 이미 있다.
2. **검사가 있어도 핵심 계약을 놓치는 곳이 있다.** Q 항목 중에는 두 엔진의 응답 동등성, 배열 여부, count≥1만 검사하는 경우가 있다. 공개/숨김/삭제·빈 그룹·동률·날짜 경계의 독립 기대값이 필요하다. 기존 L12~14의 HTTP 검사18개가 통과한 사실과 이 검증 공백은 동시에 성립한다.
3. **원래 테스트의 통과와 단계 전체 합격은 다르다.** 본편101개를 격리 복원해 실행했다. 89단계는 기존 JUnit이 통과했고, 10장12단계는 컴파일 성공이나 테스트0건이었다. 기존 HTTP/수동 DB 채점표가 없는 것으로 오해하면 안 되지만, JUnit 검증 완료라고 표시할 수도 없다.
4. **실행 안내와 학습 경로가 끊긴 곳이 있다.** A0/A3/A4/C1/C3/E2~E7 일부 안내는 옛 studymate 컨테이너·3306 접속을 사용한다. 현재 프로젝트의 mysql/13308과 대조해 정리해야 한다. E4/E5의 L2/L3/L5/L6/L7/L9 등은 이름만 적혀 있고 이 저장소에서 실행할 링크가 확인되지 않았다. 내부 링크 검사에서도 DB-01의 설계 문서 HTML 링크1개가 깨졌다.
5. **실제로 재현한 계약 차이도 있다.** 교육용 token 열의 문자 비교로 `tok-p05`와 `TOK-P05`가 같은 회원5로 글을 작성했다. 2-2의 잘못된 페이지 입력은400이지만 기본 JSON으로 응답해 ProblemDetail 경로와 형태가 달랐다. 반대로 “삭제 댓글 수정 허용” 후보는 Service guard와 HTTP404/DB 불변으로 반증해 제외했다.
6. **운영 심화는 추가 개발이 필요하다.** 다중 프로세스 배치, outbox의 강제종료/중복 전달, R07 기본 복원에서 이어지는 실제 PITR, DDL 대기·중단 백필·구버전 공존, 인덱스의 분포/쓰기 비용, 다중 인스턴스 캐시, 모듈 경계와 서비스 분리의 장애 계약까지 단계적으로 이어야 한다. 기존에 한계로 설명한 것을 현재 구현의 버그라고 소급하지 않았다.

## 읽는 순서

1. 현재 역량별 범위와 개발 순서: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/DEPTH-MAP.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/DEPTH-MAP.md)
2. 225개 개별 판정 파일: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/UNIT-INDEX.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/UNIT-INDEX.md)
3. 이번 실제 실행과 한계: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/RUN-EVIDENCE.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/RUN-EVIDENCE.md)
4. 최신 기능형7개와 기존 실행 기록: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/LATEST-FLOW-REVIEW.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/LATEST-FLOW-REVIEW.md)
5. 구체 확장20개: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/EXPANSION-INDEX.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/EXPANSION-INDEX.md)

## 실제 실행 요약

| 실행 | 결과 |
|---|---|
| 본편 snapshot101개 | 89개 기존 테스트 통과 / 12개 테스트0 |
| 쿼리 랩3개 | 빌드/기동 성공, 원문 HTTP 검사18개 통과 |
| DB 인덱스 핵심 실험 | MySQL8.4.11, 좋아요50만 행. 결과/순서 보존, 생성·숨김·복구·제거 확인 |
| 독립 Java 예시 | 12개 예상 출력·의도한 예외 확인 |
| 내부 문서 링크/앵커 | 10,489개 검사, 깨진 파일 링크1개 |
| 브라우저 진입 기록 | 기존225단위와 최신7개 화면/DOM 저장. 모든 화면·조작 검증을 뜻하지 않음 |
| 원문 보존 | 기준225단위의 원문 해시 변화0, 최신 브랜치의 동일 원문과도 차이0 |

본편 테스트2,337회는 동일 테스트의 단계별 반복을 포함한다. 서로 다른 테스트2,337개라고 세지 않았다. 숫자보다 **각 계약을 어느 assertion/SQL/실행이 실제로 검사하는지**를 개별 파일에서 확인해야 한다.

## 개발 우선순위

- **먼저 X01/X02:** 실행 환경·시작 코드·단계별 자동 판정·쿼리의 독립 기대값을 안정화한다.
- **다음 P1 심화:** 빈/공유 상태, Service 설계, 공유 관계의 수명, DB 격리/범위 잠금, 인덱스 비용, 이행/복구, 멱등/배치/outbox를 기존 과제에서 확장한다.
- **선택 종합:** 고급 SQL, 다중 노드 캐시·외부 호출, 모듈형 모놀리스와 MSA 분리 판단을 진행한다.

확장20개는 모두 **시작 상태 → 학습자 작업 → 정상/실패 입력 → 동시성·측정·DB 관찰 → 합격 기준**을 가진 개발 명세다. 실제 fixture·시작 코드·검사기를 구현하고 정상 구현 통과와 대표 오답 실패를 확인하기 전에는 “학습 시나리오 구현 완료”로 올리지 않는다.

## 근거와 검증 한계

기준 HEAD는 `ac41c5ed24b883742821f55da4e68a0ffc215b79`다. 최신 기능형 브랜치는 조사 중 별도 작업이 진행돼 최초 `debd0fcf`에서 `9ce57dd9ba9c5961ebc7a65d30408e970990d57f`로 바뀐 것을 추가 확인했다. 시각 정밀도 안내 추가분과 해당 검사를 대조했고, 기존225개 원문과 정답 snapshot의 판정은 고정된 감사 기반에 대해 수행했다.

정적 대조는 Luna 서브에이전트와 메인이 분담했다. 공식 이론 조사는 OpenAI 제공자의 gpt-6-luna Codex CLI로 수행했고 LiteLLM은 사용하지 않았다. 메인이 실제 파일·핵심 출처·격리 실행 결과를 교차 검증했다. 근거 파일/해시/행 범위 검사는 주장 자체의 기술적 참을 대신하지 않으므로 실행으로 반증된 후보는 철회했다.

이번에 새 UI/서버 정답을 구현하거나 merge·push·PR·배포하지 않았다. 감사용 컨테이너·임시 프로젝트·브라우저 탭·서버는 정리했고 기존 실습 DB/볼륨은 초기화하지 않았다.
