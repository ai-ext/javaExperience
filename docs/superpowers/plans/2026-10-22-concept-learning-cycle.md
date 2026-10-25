# 개념134문서 검증·구현 사이클 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox syntax for tracking. 사용자가 실행 방식과 모델을 이미 지정했으므로 별도 실행 선택을 다시 묻지 않는다.

**Goal:** 기존24개 보강의 정확성과 빠진 범위를 먼저 감사하고, 나머지110개를 구현·자동검사·독립검토·실제화면 대조 순서로 진행한다.

**Architecture:** 기존 정적 문서 사이트와 원문/서버 코드를 보존한다. 문서별 task가 별도 evidence와 상태를 가지며 공유 등록 파일 수정은 직렬 처리한다. 단위 검사, Sol 검토, 실제 화면의 서로 다른 판정을 분리한다.

**Tech Stack:** 현행 Node/ES modules·기존 HTML/CSS·Python stdlib 검사 하네스·실제 imagegen JPEG·Codex harness subagents.

---

## 작업 순서와 소유권

1. task1~task24를 먼저 읽기 전용 감사 → 문서별 원문 절/의미 단위와 구현 장면·실행 근거·검사·이미지의 대응표 작성.
2. gpt-6.1-sol/high가 spec 검토 후 quality 검토 → critical/important 재현과 최소 수정 사양을 메인이 확인.
3. 필요한 수정은 gpt-6-luna/high → 원인에 맞는 RED/GREEN와 관련 검사 → 새 Sol spec/quality 승인 → 메인 현재 desktop/mobile·원문/학습자코드 보존 대조.
4. task25~task134는 첫24 감사 결과를 반영한 뒤 같은 사이클. 새 세부 사양은 원문 전문 검토와 의미 장면 대응표를 입력으로 확정하며 원문을 읽기 전에 가짜 구현 코드나 측정값을 설계하지 않는다.
5. 전체134개 task의 필수 관문과 미해결 범위를 확인한 뒤 전체 완료 판단. 일부 장면 통과를 문서 전체 완료로 바꾸지 않는다.

기준 HEAD4b0493af52b1a06decca909d6bf9a8b6f9610686. 기존 미커밋 AGENTS.md/RESUME.md 보존. 사용자 기존 worktree·서버·DB·practice·scenario·home은 수정하지 않는다. dirty 공통 스냅샷 전체 통합, remote push/PR/merge는 하지 않는다.

정식 검증 계약: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/AUDIT-CONTRACT.md . 기계 registry: 같은 폴더 tasks.json . 세부 task 파일에는 현행 원문 절·SHA·기존 파일·선행 조사 참고·검사 명령을 저장한다. 다른 census의 개념 목록은 SHA를 맞춘 참고 자료이며 이번 audit의 전문 읽기·현재 브라우저 근거로 대체하지 않는다.

## 하네스 계약

`python3 docs/design/concept-cycle-2026-10-22/run-harness.py --task task1` : 해당 npm 검사 새 실행과 source hash before/after, HEAD, UTC, exit, 원시 로그를 보존한다. 전체 기존24개는 `--existing24`. 실행하지 않은110개는 명령 미등록 상태로 거부한다. shell=False 고정 argv만 사용하며 timeout/실패/환경 오류를 성공으로 합치지 않는다.

각 review.json은 specReview.coverage/qualityReview.findings/visualReview/runtimeReview/boundedVerdict/fullDocumentComplete/remainingWork를 갖는다. 코드가 바뀌면 과거 결과는 그 해시에 귀속한 증거이며 재검사 없이 최신 통과로 승계하지 않는다. reviewer는 구현자와 분리한다. audit 단계에서 현재 브라우저를 보지 못했으면 그 관문은 pending이다.

## 공통 완료 관문

- [ ] 원문 주요 절과 실제 장면의 대응표 및 미구현 범위가 빠짐없이 기록됐다.
- [ ] 실제 실행/명시 입력 모델/미실행 원문/역사 증거를 구분했다.
- [ ] 해당 npm 검사와 원문·학습자 코드 보존 검사를 새로 실행했다.
- [ ] Sol high spec 검토를 통과하고 quality critical/important가 해결됐다.
- [ ] 필요한 실제 imagegen 시안과 JPEG 자산을 기술 근거와 대조했다.
- [ ] 메인이 현재 desktop/mobile, 단계·값·코드·복사·확대·원문·링크를 확인했다.
- [ ] 생성 HTML이 바뀌면 build, audit:visual, audit:version-cards, audit:parity가 통과했다.
- [ ] 선언한 한계와 남은 장면을 포함해 상태를 갱신하고 로컬 의미단위 커밋을 만들었다.

## Tasks

### task1: P09 · P09. Java 문법 기초 — 클래스·필드·메서드·생성자를 선언하고 호출하기

- 기존 보강부터 검증 / 원문 489줄 / `c5a15287bafd`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P09-java-syntax-basics.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task1/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task2: P04 · P04. 객체 생성 — 생성자·정적 팩토리·Builder 패턴·생성자 주입

- 기존 보강부터 검증 / 원문 328줄 / `aabf61c2d346`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P04-constructors-builder.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task2/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task3: P16 · P16. JSON·Jackson 실무 — 요청/응답 직렬화에서 막히는 것들

- 기존 보강부터 검증 / 원문 335줄 / `53c490407480`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P16-json-jackson-practical.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task3/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task4: W09 · W09. DTO는 왜 쓰나 — 엔티티를 그대로 반환하면 생기는 일

- 기존 보강부터 검증 / 원문 388줄 / `168007fa2f8a`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W09-why-dto.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task4/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task5: P19 · P19. MySQL 연결과 JPA 설정 — 의존성부터 연결 에러까지

- 기존 보강부터 검증 / 원문 450줄 / `378a8c986a8f`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P19-mysql-jpa-setup.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task5/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task6: P20 · P20. JPA 엔티티·연관관계 매핑 따라 하기

- 기존 보강부터 검증 / 원문 386줄 / `6cd8b34253f3`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P20-jpa-entity-mapping.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task6/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task7: S09 · S09. JPA·Hibernate

- 기존 보강부터 검증 / 원문 304줄 / `23e3a001a2af`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S09-jpa-hibernate.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task7/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task8: S08 · S08. 트랜잭션 관리

- 기존 보강부터 검증 / 원문 329줄 / `364142fe4a16`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S08-transactions.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task8/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task9: W11 · W11. 트랜잭션은 왜 서비스 계층에 거나

- 기존 보강부터 검증 / 원문 369줄 / `4d9a55cb4ccf`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W11-why-tx-in-service.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task9/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task10: R03 · R03. 스키마와 테이블 설계 — 데이터 타입, VARCHAR(255)의 의미, PK·FK·제약

- 기존 보강부터 검증 / 원문 217줄 / `4e23b082e208`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/R03-schema-types-constraints.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task10/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task11: R04 · R04. SQL로 데이터 다루기 — INSERT·SELECT·UPDATE·DELETE, JOIN, 트랜잭션

- 기존 보강부터 검증 / 원문 351줄 / `78af924291e7`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/R04-sql-crud-join.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task11/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task12: W15 · W15. 페이징 — OFFSET vs 커서(키셋), 무엇을 언제

- 기존 보강부터 검증 / 원문 283줄 / `9937498a3b94`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W15-paging-offset-vs-cursor.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task12/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task13: V04 · V04. 테스트 DB 전략 — H2 vs Testcontainers, 데이터 준비, @Transactional의 함정

- 기존 보강부터 검증 / 원문 264줄 / `1fe115e967ba`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V04-test-db-strategy.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task13/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task14: B01 · B01. 계정 생명주기 API — 이메일·휴대폰 인증, 비밀번호 재설정, 로그인 시도 제한

- 기존 보강부터 검증 / 원문 301줄 / `1c77c1d160fc`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/B01-account-lifecycle.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task14/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task15: D01 · D01. 코드가 운영 서버에 올라가기까지 — 개발 전 과정 한 장

- 기존 보강부터 검증 / 원문 277줄 / `b0f93186f2b1`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D01-dev-lifecycle-overview.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task15/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task16: D02 · D02. 서버·네트워크 기초 용어 — 요청이 서버에 닿기까지

- 기존 보강부터 검증 / 원문 304줄 / `6f2fe2c7c720`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D02-server-network-basics.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task16/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task17: D03 · D03. REST API 개발 과정 — 요구사항에서 배포 가능한 API까지

- 기존 보강부터 검증 / 원문 332줄 / `c91a9ac8a9f9`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D03-rest-api-dev-process.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task17/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task18: D04 · D04. 빌드란 무엇인가 — 소스 코드가 실행 파일·이미지가 되기까지

- 기존 보강부터 검증 / 원문 325줄 / `eeadf83f4e34`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D04-build-pipeline-explained.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task18/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task19: D05 · D05. 디버깅 방법론 — 재현·관찰·가설·검증

- 기존 보강부터 검증 / 원문 343줄 / `c3a875fb1940`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D05-debugging-methodology.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task19/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task20: D06 · D06. 배포란 무엇인가 — 환경·방식·무중단 배포·롤백

- 기존 보강부터 검증 / 원문 264줄 / `0e67f2ea37cb`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D06-deployment-concepts.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task20/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task21: D07 · D07. 온프레미스 vs 클라우드 — 서버는 어디에 있고 누가 관리하나

- 기존 보강부터 검증 / 원문 300줄 / `0945450013d2`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D07-onprem-vs-cloud.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task21/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task22: D08 · D08. CI/CD와 협업 흐름 — Git 브랜치부터 파이프라인·GitOps까지

- 기존 보강부터 검증 / 원문 319줄 / `51110a182ea6`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D08-cicd-collaboration.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task22/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task23: D09 · D09. 운영과 관측 — 배포 이후 서버를 지켜보는 법

- 기존 보강부터 검증 / 원문 309줄 / `6ed92233be6b`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D09-operations-observability.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task23/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task24: D10 · D10. DB 기초 — 백엔드 개발자가 알아야 할 관계형 데이터베이스

- 기존 보강부터 검증 / 원문 449줄 / `05e6f3eabfeb`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D10-database-basics.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task24/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task25: D11 · D11. 웹 보안 기초 — 백엔드 개발자가 막아야 할 것들

- 앞선24개 감사 뒤 구현 사이클 / 원문 314줄 / `a9ba3c0109c2`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D11-web-security-basics.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task25/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task26: D12 · D12. 리눅스·터미널 기본 — 서버에서 살아남기

- 앞선24개 감사 뒤 구현 사이클 / 원문 330줄 / `bcdd88b28981`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D12-linux-terminal-basics.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task26/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task27: D13 · D13. 백엔드 개발 용어 사전 — 회의에서 들리는 말 전부

- 앞선24개 감사 뒤 구현 사이클 / 원문 476줄 / `62ce919e4735`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D13-backend-glossary.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task27/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task28: D14 · D14. 백엔드 개발자를 위한 운영체제 기초 — 프로세스·스레드·메모리·I/O

- 앞선24개 감사 뒤 구현 사이클 / 원문 306줄 / `5a71f7abd145`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D14-os-basics-backend.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task28/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task29: D15 · D15. 서버 사양은 어떻게 정하나 — CPU·메모리·디스크·네트워크를 숫자로 잡는 법

- 앞선24개 감사 뒤 구현 사이클 / 원문 305줄 / `c6291e448122`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D15-server-sizing.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task29/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task30: J01 · J01. 기본 타입·참조 타입·박싱·String

- 앞선24개 감사 뒤 구현 사이클 / 원문 316줄 / `b3a17a035cd5`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J01-types-string.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task30/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task31: J02 · J02. OOP와 Object 규약

- 앞선24개 감사 뒤 구현 사이클 / 원문 351줄 / `aa76f3ab9226`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J02-oop-object-contracts.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task31/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task32: J03 · J03. 제네릭

- 앞선24개 감사 뒤 구현 사이클 / 원문 299줄 / `408151dc448b`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J03-generics.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task32/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task33: J04 · J04. 예외 처리

- 앞선24개 감사 뒤 구현 사이클 / 원문 346줄 / `19a44ae7d7c7`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J04-exceptions.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task33/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task34: J05 · J05. 모던 문법 (Java 10~25)

- 앞선24개 감사 뒤 구현 사이클 / 원문 302줄 / `a82c7607fff7`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J05-modern-syntax.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task34/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task35: J06 · J06. enum·애노테이션·리플렉션

- 앞선24개 감사 뒤 구현 사이클 / 원문 383줄 / `2d34ba7b9bab`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J06-enum-annotation-reflection.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task35/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task36: J07 · J07. 컬렉션 프레임워크 내부

- 앞선24개 감사 뒤 구현 사이클 / 원문 382줄 / `34d09b6ee3cd`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J07-collections-internals.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task36/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task37: J08 · J08. 람다·함수형 인터페이스

- 앞선24개 감사 뒤 구현 사이클 / 원문 346줄 / `226e5444f0c7`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J08-lambda-functional.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task37/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task38: J09 · J09. Stream API

- 앞선24개 감사 뒤 구현 사이클 / 원문 336줄 / `53843579ed60`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J09-stream-api.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task38/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task39: J10 · J10. 스레드와 Java Memory Model

- 앞선24개 감사 뒤 구현 사이클 / 원문 345줄 / `7d579d7fcaf5`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J10-jmm-threads.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task39/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task40: J11 · J11. java.util.concurrent

- 앞선24개 감사 뒤 구현 사이클 / 원문 297줄 / `f1f39efca002`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J11-juc.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task40/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task41: J12 · J12. Virtual Threads·Structured Concurrency·Scoped Values

- 앞선24개 감사 뒤 구현 사이클 / 원문 356줄 / `786c5fd8c874`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J12-virtual-threads.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task41/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task42: J13 · J13. JVM 구조·클래스 로딩·바이트코드

- 앞선24개 감사 뒤 구현 사이클 / 원문 396줄 / `abd33c084a5a`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J13-jvm-classloading.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task42/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task43: J14 · J14. 메모리 구조와 GC

- 앞선24개 감사 뒤 구현 사이클 / 원문 297줄 / `42f03227e0d7`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J14-memory-gc.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task43/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task44: J15 · J15. JIT·성능 분석·프로파일링

- 앞선24개 감사 뒤 구현 사이클 / 원문 307줄 / `06cf9ee056a7`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J15-jit-profiling.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task44/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task45: J16 · J16. 컨테이너 환경의 JVM

- 앞선24개 감사 뒤 구현 사이클 / 원문 287줄 / `b6fda83130a8`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J16-jvm-in-containers.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task45/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task46: J17 · J17. Java 버전 로드맵·LTS·마이그레이션

- 앞선24개 감사 뒤 구현 사이클 / 원문 264줄 / `faba8924c008`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J17-versions-roadmap.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task46/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task47: J19 · J19. Java 단위 테스트 (JUnit·Mockito·AssertJ)

- 앞선24개 감사 뒤 구현 사이클 / 원문 427줄 / `b8a3a7424339`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J19-testing-junit.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task47/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task48: J20 · J20. I/O·NIO·HttpClient·JDBC 기초

- 앞선24개 감사 뒤 구현 사이클 / 원문 317줄 / `189671633aa7`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J20-io-nio-jdbc.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task48/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task49: J21 · J21. 디자인 패턴과 SOLID — Spring 안에서 찾기

- 앞선24개 감사 뒤 구현 사이클 / 원문 219줄 / `7209bc11630f`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J21-design-patterns-solid.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task49/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task50: J22 · J22. 코딩테스트 알고리즘 — Java로 빠르게 구현하기

- 앞선24개 감사 뒤 구현 사이클 / 원문 367줄 / `281bf25c0ab9`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J22-coding-test-algorithms.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task50/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task51: J23 · J23. 트리 자료구조와 순회 — 이진 트리·BST

- 앞선24개 감사 뒤 구현 사이클 / 원문 414줄 / `b7ba88e734c9`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J23-tree-traversal.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task51/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task52: J24 · J24. 컴파일 언어 vs 인터프리터 언어 — Java는 어떻게 실행되나

- 앞선24개 감사 뒤 구현 사이클 / 원문 248줄 / `3070a50deb37`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J24-compiled-vs-interpreted.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task52/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task53: J25 · J25. 자료구조 개념 지도 — 배열·연결 리스트·스택·큐·힙·해시·트리·그래프

- 앞선24개 감사 뒤 구현 사이클 / 원문 331줄 / `90f3aef2d90c`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J25-data-structures-map.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task53/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task54: P01 · P01. Spring vs Spring Boot — 무엇이 다르고 프로젝트는 어떻게 시작하나

- 앞선24개 감사 뒤 구현 사이클 / 원문 308줄 / `ba0bc66bec33`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P01-spring-vs-boot.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task54/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task55: P02 · P02. MVC 패턴과 계층형 구조 — Controller·Service·Repository

- 앞선24개 감사 뒤 구현 사이클 / 원문 623줄 / `f9556843ef10`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P02-mvc-layered-architecture.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task55/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task56: P03 · P03. 애노테이션이란 — 그리고 실무에서 매일 쓰는 애노테이션 총정리

- 앞선24개 감사 뒤 구현 사이클 / 원문 308줄 / `6c75dbc8396b`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P03-annotations-cheatsheet.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task56/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task57: P05 · P05. jar·war란 무엇인가 — 빌드 결과물과 실행

- 앞선24개 감사 뒤 구현 사이클 / 원문 352줄 / `abf36730a8fc`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P05-jar-war-packaging.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task57/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task58: P06 · P06. 첫 CRUD API 만들기 — 처음부터 끝까지 따라 하기

- 앞선24개 감사 뒤 구현 사이클 / 원문 424줄 / `bebc5c238341`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P06-first-crud-api.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task58/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task59: P07 · P07. Spring Boot로 개발할 때 꼭 알아야 할 것들 — 개발 습관과 에러 해결

- 앞선24개 감사 뒤 구현 사이클 / 원문 393줄 / `fc54247cfd90`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P07-boot-dev-essentials.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task59/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task60: P08 · P08. Maven·Gradle 실무 — 빌드 파일 읽고, 의존성 넣고, 에러 고치기

- 앞선24개 감사 뒤 구현 사이클 / 원문 332줄 / `c0e48ee7b3b8`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P08-maven-gradle-practical.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task60/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task61: P10 · P10. 자료구조 실무 사용법 — 배열·List·Set·Map·Queue·Deque·PriorityQueue

- 앞선24개 감사 뒤 구현 사이클 / 원문 396줄 / `f5adeefced1a`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P10-data-structures-usage.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task61/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task62: P11 · P11. 빈 등록과 의존성 주입 따라 하기 — @Component부터 private final + @RequiredArgsConstructor까지

- 앞선24개 감사 뒤 구현 사이클 / 원문 366줄 / `3530d8cc25cc`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P11-bean-registration-di.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task62/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task63: P12 · P12. Spring 처음 — 왜 new 대신 빈으로 받나 (IoC·DI 입문)

- 앞선24개 감사 뒤 구현 사이클 / 원문 419줄 / `4c109f6d0cfa`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P12-why-beans-ioc-intro.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task63/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task64: P13 · P13. Git 실무 — 충돌 해결·되돌리기·브랜치 작업

- 앞선24개 감사 뒤 구현 사이클 / 원문 418줄 / `764bd6d85648`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P13-git-practical.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task64/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task65: P14 · P14. Docker·docker compose로 로컬 개발 환경 만들기

- 앞선24개 감사 뒤 구현 사이클 / 원문 411줄 / `906b08dd3f71`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P14-docker-compose-local.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task65/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task66: P15 · P15. IntelliJ IDEA 실무 — 프로젝트 열기부터 디버깅·리팩토링까지

- 앞선24개 감사 뒤 구현 사이클 / 원문 345줄 / `ad7e96740156`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P15-intellij-practical.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task66/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task67: P17 · P17. 파일 업로드·다운로드와 외부 스토리지

- 앞선24개 감사 뒤 구현 사이클 / 원문 369줄 / `a3c19191c935`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P17-file-upload-storage.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task67/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task68: P18 · P18. 동시성 문제 실전 — 재고 차감·좌석 예약을 안전하게

- 앞선24개 감사 뒤 구현 사이클 / 원문 377줄 / `7c5b2d57d5ce`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P18-concurrency-inventory.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task68/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task69: P21 · P21. QueryDSL 설정과 동적 쿼리 실무

- 앞선24개 감사 뒤 구현 사이클 / 원문 333줄 / `e6ed22e34e00`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P21-querydsl-setup.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task69/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task70: P22 · P22. 데이터소스 여러 개 쓰기와 읽기 복제본 라우팅

- 앞선24개 감사 뒤 구현 사이클 / 원문 385줄 / `e8c88b796c1f`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P22-multiple-datasources.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task70/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task71: P23 · P23. Redis 연결과 사용 실무

- 앞선24개 감사 뒤 구현 사이클 / 원문 381줄 / `97f5a1e41c2c`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P23-redis-practical.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task71/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task72: P24 · P24. Kafka 연결과 사용 실무

- 앞선24개 감사 뒤 구현 사이클 / 원문 382줄 / `e5aad25708b8`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P24-kafka-practical.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task72/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task73: P25 · P25. 외부 API 연동 실무 — RestClient·HTTP Interface

- 앞선24개 감사 뒤 구현 사이클 / 원문 410줄 / `f2720fbafd65`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P25-external-api-client.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task73/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task74: P26 · P26. 메일 발송 실무 — JavaMailSender와 로컬 테스트

- 앞선24개 감사 뒤 구현 사이클 / 원문 357줄 / `6597950573e8`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P26-mail-notification.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task74/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task75: P27 · P27. 애노테이션은 누가·언제 실행하나 — 시점별 동작 지도

- 앞선24개 감사 뒤 구현 사이클 / 원문 333줄 / `58aed5ddac32`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P27-annotations-when-how.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task75/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task76: P28 · P28. Spring Boot가 기본으로 만드는 빈들 — 무엇이, 왜, 어떻게 확인·교체하나

- 앞선24개 감사 뒤 구현 사이클 / 원문 269줄 / `b11eabe4017b`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P28-default-beans.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task76/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task77: P29 · P29. static 완전 정리 — 클래스 변수·정적 메서드·상수, 그리고 Spring에서의 static

- 앞선24개 감사 뒤 구현 사이클 / 원문 355줄 / `17be9304afb9`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P29-static-complete.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task77/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task78: P30 · P30. 스케줄링 실무 — @Scheduled부터 서버 여러 대·Quartz·CronJob까지

- 앞선24개 감사 뒤 구현 사이클 / 원문 363줄 / `948d4d9de415`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P30-scheduling-practical.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task78/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task79: P31 · P31. Stream 실무 패턴 모음 — for문과 나란히, 언제 무엇을

- 앞선24개 감사 뒤 구현 사이클 / 원문 197줄 / `47ac87079ef3`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P31-stream-patterns.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task79/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task80: R01 · R01. DB 서버란 무엇인가 — DBMS·데이터베이스·스키마·테이블, 그리고 MySQL·PostgreSQL

- 앞선24개 감사 뒤 구현 사이클 / 원문 263줄 / `a98a91fe40e1`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/R01-what-is-db-server.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task80/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task81: R02 · R02. RDB vs NoSQL — MongoDB·Redis·Cassandra는 무엇이고 언제 쓰나

- 앞선24개 감사 뒤 구현 사이클 / 원문 435줄 / `7f4fa04984a6`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/R02-rdb-vs-nosql.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task81/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task82: R05 · R05. 인덱스와 B-Tree — 왜 빨라지고, 언제 안 타나

- 앞선24개 감사 뒤 구현 사이클 / 원문 260줄 / `2c693e3d1312`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/R05-index-btree.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task82/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task83: R06 · R06. DB 클라이언트 도구 — DBeaver는 무엇이고 왜 여러 DB에 붙을 수 있나

- 앞선24개 감사 뒤 구현 사이클 / 원문 272줄 / `71526557b37d`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/R06-db-client-tools.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task83/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task84: R07 · R07. 백업과 복원 — DB와 서버에서 각각 무엇을, 어떻게 지키나

- 앞선24개 감사 뒤 구현 사이클 / 원문 276줄 / `81373b08db28`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/R07-backup-restore.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task84/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task85: R08 · R08. 앱 서버와 DB 서버는 어떻게 연결되나 — 요청 하나가 DB까지 가는 전체 그림

- 앞선24개 감사 뒤 구현 사이클 / 원문 322줄 / `e3c2f069cd43`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/R08-app-to-db-connection.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task85/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task86: S01 · S01. IoC 컨테이너·DI·빈 생명주기

- 앞선24개 감사 뒤 구현 사이클 / 원문 351줄 / `44113a25a639`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S01-ioc-di.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task86/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task87: S02 · S02. AOP와 프록시

- 앞선24개 감사 뒤 구현 사이클 / 원문 336줄 / `033eaaeb2530`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S02-aop-proxy.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task87/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task88: S03 · S03. Spring Boot 자동 구성 원리

- 앞선24개 감사 뒤 구현 사이클 / 원문 386줄 / `54e3a5cf1ddf`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S03-boot-autoconfig.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task88/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task89: S04 · S04. 외부 설정·프로파일

- 앞선24개 감사 뒤 구현 사이클 / 원문 327줄 / `9f56fe453ca8`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S04-config-profiles.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task89/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task90: S05 · S05. Spring MVC 요청 처리 흐름

- 앞선24개 감사 뒤 구현 사이클 / 원문 263줄 / `243b680367b5`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S05-mvc-request-flow.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task90/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task91: S06 · S06. REST API 설계와 HTTP 클라이언트

- 앞선24개 감사 뒤 구현 사이클 / 원문 383줄 / `8101138ff4e7`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S06-rest-api-clients.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task91/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task92: S07 · S07. WebFlux·리액티브와 Virtual Threads 선택

- 앞선24개 감사 뒤 구현 사이클 / 원문 260줄 / `abeec5503ddd`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S07-webflux-vs-vt.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task92/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task93: S10 · S10. Spring Data와 쿼리 도구

- 앞선24개 감사 뒤 구현 사이클 / 원문 321줄 / `c7ac0dac78e7`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S10-spring-data-query.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task93/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task94: S11 · S11. 캐시·Redis·DB 마이그레이션

- 앞선24개 감사 뒤 구현 사이클 / 원문 288줄 / `d63d457b47ff`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S11-cache-redis-migration.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task94/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task95: S12 · S12. Spring Security 아키텍처

- 앞선24개 감사 뒤 구현 사이클 / 원문 377줄 / `5c19eecfe69e`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S12-security-architecture.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task95/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task96: S13 · S13. JWT·OAuth2·OIDC

- 앞선24개 감사 뒤 구현 사이클 / 원문 316줄 / `05dfe4e7b2c0`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S13-jwt-oauth2.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task96/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task97: S14 · S14. 메시징 (Kafka·RabbitMQ)

- 앞선24개 감사 뒤 구현 사이클 / 원문 370줄 / `e206b8e0b6ed`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S14-messaging.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task97/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task98: S15 · S15. 비동기·스케줄링·Spring Batch

- 앞선24개 감사 뒤 구현 사이클 / 원문 351줄 / `0963c2efb327`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S15-async-scheduling-batch.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task98/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task99: S16 · S16. Actuator·관측성 (메트릭·트레이싱·로깅)

- 앞선24개 감사 뒤 구현 사이클 / 원문 326줄 / `3162f9b8e26b`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S16-actuator-observability.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task99/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task100: S17 · S17. Spring Boot 애플리케이션 성능

- 앞선24개 감사 뒤 구현 사이클 / 원문 293줄 / `ac9ff62e7937`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S17-performance-tuning.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task100/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task101: S18 · S18. Spring Boot 테스트

- 앞선24개 감사 뒤 구현 사이클 / 원문 407줄 / `6c37408b8a2d`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S18-spring-testing.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task101/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task102: S19 · S19. 패키징·컨테이너화·배포

- 앞선24개 감사 뒤 구현 사이클 / 원문 338줄 / `1a8e5a22db3a`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S19-packaging-deploy.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task102/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task103: S20 · S20. Spring Cloud·MSA 패턴

- 앞선24개 감사 뒤 구현 사이클 / 원문 273줄 / `c5e980887e67`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S20-spring-cloud-msa.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task103/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task104: S21 · S21. Spring Boot 3→4·Framework 7 변화와 마이그레이션

- 앞선24개 감사 뒤 구현 사이클 / 원문 261줄 / `8a1982833b9f`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S21-boot4-migration.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task104/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task105: S22 · S22. 아키텍처 스타일과 DDD 기초 — 코드를 어떻게 나눌까

- 앞선24개 감사 뒤 구현 사이클 / 원문 336줄 / `f5c9ba2c99e8`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S22-architecture-ddd.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task105/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task106: S23 · S23. API 문서화 — OpenAPI와 Swagger UI

- 앞선24개 감사 뒤 구현 사이클 / 원문 277줄 / `74cacf0c8835`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S23-openapi-swagger.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task106/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task107: V01 · V01. 무엇을 어떻게 테스트하나 — 대상 고르기부터 테스트 하나의 구조까지

- 앞선24개 감사 뒤 구현 사이클 / 원문 276줄 / `a03fdd8ce086`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V01-what-and-how-to-test.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task107/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task108: V02 · V02. 계층별 테스트 따라 하기 — Controller·Service·Repository·통합

- 앞선24개 감사 뒤 구현 사이클 / 원문 325줄 / `41e6cc507fbc`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V02-layered-tests-handson.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task108/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task109: V03 · V03. mock 실전 — 무엇을 가짜로 바꾸고 무엇은 실제로 두나

- 앞선24개 감사 뒤 구현 사이클 / 원문 422줄 / `fee49db918c6`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V03-mocking-in-practice.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task109/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task110: V05 · V05. 까다로운 대상 테스트하기 — 보안·예외·비동기·동시성·파일

- 앞선24개 감사 뒤 구현 사이클 / 원문 323줄 / `a3f5b0fad8ee`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V05-testing-tricky-things.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task110/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task111: V06 · V06. 현업 테스트 실무 — 레거시에 테스트 붙이기, 버그 재현, CI, 커버리지

- 앞선24개 감사 뒤 구현 사이클 / 원문 300줄 / `e1b7dc3ee7f7`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V06-testing-at-work.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task111/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task112: W01 · W01. API 하나 만들 때 실제 작업 순서 — DB부터? 컨트롤러부터?

- 앞선24개 감사 뒤 구현 사이클 / 원문 414줄 / `e2d3c6dbd97d`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W01-api-dev-order.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task112/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task113: W02 · W02. 왜 Controller·Service·Repository로 나누나 — 안 나누면 생기는 일

- 앞선24개 감사 뒤 구현 사이클 / 원문 346줄 / `4ca28104cec7`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W02-why-layers.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task113/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task114: W03 · W03. DB 접근 방식 총비교 — JDBC부터 JPA·MyBatis·QueryDSL·jOOQ까지

- 앞선24개 감사 뒤 구현 사이클 / 원문 431줄 / `91d2d985ba3d`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W03-db-access-comparison.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task114/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task115: W04 · W04. MyBatis XML 쿼리 실무 — mapper·동적 SQL·#{}와 ${}

- 앞선24개 감사 뒤 구현 사이클 / 원문 436줄 / `6c61a48e2033`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W04-mybatis-xml-practical.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task115/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task116: W05 · W05. JPA vs MyBatis — 언제 무엇을, 섞어 쓰는 전략

- 앞선24개 감사 뒤 구현 사이클 / 원문 346줄 / `a52e675e43f7`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W05-jpa-vs-mybatis-strategy.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task116/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task117: W06 · W06. 디버깅은 왜 서버에선 브레이크포인트·로그로, 프론트에선 console.log로 하나

- 앞선24개 감사 뒤 구현 사이클 / 원문 340줄 / `f5eb14dd389f`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W06-why-server-debugging.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task117/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task118: W07 · W07. 왜 System.out.println 대신 로거(SLF4J)를 쓰나

- 앞선24개 감사 뒤 구현 사이클 / 원문 302줄 / `432bf8d9bf11`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W07-why-logger.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task118/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task119: W08 · W08. 예외는 어디서 잡나 — 계층별 처리와 전역 핸들러

- 앞선24개 감사 뒤 구현 사이클 / 원문 390줄 / `7e2afa96f888`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W08-where-to-handle-exceptions.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task119/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task120: W10 · W10. 검증은 어디서 하나 — 프론트·서버·DB, 왜 둘 다 하나

- 앞선24개 감사 뒤 구현 사이클 / 원문 364줄 / `bed27e48966e`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W10-where-to-validate.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task120/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task121: W12 · W12. 인터페이스는 왜 만드나 — DI·테스트, 그리고 과잉 추상화

- 앞선24개 감사 뒤 구현 사이클 / 원문 310줄 / `1b16fc1aec85`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W12-why-interfaces.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task121/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task122: W13 · W13. 프론트와 백엔드의 경계 — 무엇을 서버에서만 해야 하나

- 앞선24개 감사 뒤 구현 사이클 / 원문 309줄 / `d3573fd2b4ca`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W13-frontend-backend-boundary.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task122/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task123: W14 · W14. 동기 vs 비동기, 블로킹 vs 논블로킹 — 백엔드에서 언제

- 앞선24개 감사 뒤 구현 사이클 / 원문 339줄 / `8bc18f82cdff`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W14-sync-async-blocking.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task123/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task124: W16 · W16. ID 생성 전략 — AUTO_INCREMENT vs UUID vs ULID·Snowflake

- 앞선24개 감사 뒤 구현 사이클 / 원문 302줄 / `3a8a90f8bbac`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W16-id-generation.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task124/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task125: W17 · W17. 캐시는 어디에 — 브라우저·CDN·서버 로컬·Redis·DB

- 앞선24개 감사 뒤 구현 사이클 / 원문 299줄 / `0dd17392f2d9`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W17-where-to-cache.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task125/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task126: W18 · W18. REST vs GraphQL vs gRPC — 선택 기준

- 앞선24개 감사 뒤 구현 사이클 / 원문 340줄 / `84d0d0e9916a`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W18-rest-graphql-grpc.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task126/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task127: W19 · W19. Lombok을 쓸까 말까 — 편리함과 함정

- 앞선24개 감사 뒤 구현 사이클 / 원문 306줄 / `9fe3608d5851`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W19-lombok-or-not.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task127/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task128: W20 · W20. 시간·타임존은 왜 매번 문제인가

- 앞선24개 감사 뒤 구현 사이클 / 원문 335줄 / `2f6fd3d4a3e7`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W20-time-timezone.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task128/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task129: W21 · W21. null 처리 전략 — Optional·JSpecify·DB NULL

- 앞선24개 감사 뒤 구현 사이클 / 원문 347줄 / `ca3ba6bfca1c`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W21-null-handling.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task129/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task130: W22 · W22. 로컬에선 되는데 서버에선 왜 안 되나 — 환경 차이 점검

- 앞선24개 감사 뒤 구현 사이클 / 원문 297줄 / `389185b8f551`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W22-works-locally-not-on-server.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task130/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task131: W23 · W23. 캐시와 인메모리 — 무엇이고, 왜 빠르고, 왜 쓰나

- 앞선24개 감사 뒤 구현 사이클 / 원문 354줄 / `d18228c99476`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W23-cache-and-in-memory.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task131/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task132: W24 · W24. DB는 왜 쓰나 — 파일이나 메모리에 저장하면 안 되나

- 앞선24개 감사 뒤 구현 사이클 / 원문 359줄 / `87bf76cae214`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W24-why-database.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task132/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task133: W25 · W25. 스프링은 왜 멀티스레드인가 — 요청마다 스레드, 공유되는 싱글턴 빈

- 앞선24개 감사 뒤 구현 사이클 / 원문 355줄 / `817cc1dead9c`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W25-spring-multithreading.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task133/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋

### task134: W26 · W26. 네이밍 컨벤션 — camelCase부터 Controller·Impl까지, 왜 그렇게 짓나

- 앞선24개 감사 뒤 구현 사이클 / 원문 330줄 / `dc9cc8fd7a35`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W26-naming-conventions.md
- 실행 단계·원문 절·파일·관문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task134/TASK.md
- [ ] 전문/범위 검토 → [ ] Luna 수정·구현 → [ ] 하네스 → [ ] Sol spec → [ ] Sol quality → [ ] 메인 현재 브라우저·보존 → [ ] 실제 판정/로컬 커밋
