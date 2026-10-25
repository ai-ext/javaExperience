# W15 출처 노트

확인일은 모두 2026-10-20. 각 항목은 URL, 절·버전, 확인 주장, 조건·한계를 기록한다.

1. https://docs.spring.io/spring-data/jpa/reference/data-commons/repositories/scrolling.html — Spring Data Commons/JPA 4.1.1, “Scrolling”, “Scrolling using Offset”, “Scrolling using Keyset-Filtering”. Window/ScrollPosition, exclusive position, offset() 대 offset(0), keyset non-null 요건, PK 자동 보강, projection에 sort key 요구, offset/keyset 차이를 확인. 실제 JPA provider에서 원문 Java 코드를 실행한 증거는 아님.
2. https://docs.spring.io/spring-data/jpa/reference/repositories/query-methods-details.html — Spring Data JPA 4.1.1, “Query Creation” § method subject/predicate; `find…By` 앞 설명부, `First`/`Top`, 정적 OrderBy. 원문 `findByStatus`와 `findSliceByStatus`는 이름 구조상 합치. 실제 컴파일/실행은 미확인.
3. https://docs.spring.io/spring-data/jpa/reference/repositories/query-return-types-reference.html — Spring Data JPA 4.1.1, “Supported Query Return Types” 표. Slice/Page/Window 메타데이터 및 Pageable/ScrollPosition 필요를 확인.
4. https://raw.githubusercontent.com/spring-projects/spring-data-commons/4.1.1/src/main/java/org/springframework/data/support/PageableExecutionUtils.java — 4.1.1 원저자/프로젝트 소스, `getPage`, `isPartialPage`(특히 48–70행). 불완전 페이지 조건에만 count supplier 생략. 공백 페이지 및 전체 페이지는 supplier 경로.
5. https://docs.spring.io/spring-data/jpa/docs/3.1.1/reference/html/ — Spring Data JPA 3.1.1, “Paging, Iterating Large Results, Sorting & Limiting” 및 “Scrolling” (웹 문서 § lines 188–236, 553+). 당시 Page/Slice/Window 및 keyset 설명이 존재. 역사적 비교로만 사용.
6. https://docs.spring.io/spring-boot/4.1/reference/dependency-versions.html — 접근 실패(내부 오류). Boot 4.1.1이 Data JPA 4.1.1을 관리한다는 BOM 조합은 미확인. 실 프로젝트 실제 BOM 확인 필요.
7. https://dev.mysql.com/doc/refman/8.4/en/limit-optimization.html — MySQL 8.4 §10.2.1.19 “LIMIT Query Optimization”. LIMIT+ORDER BY index/filesort 조건, 동률 ORDER BY nondeterminism, deterministic tie-breaker. 구체 fixture의 선택 인덱스/성능은 EXPLAIN ANALYZE 없이 알 수 없음.
8. https://dev.mysql.com/doc/refman/8.4/en/explain.html — MySQL 8.4 §15.8.2 “EXPLAIN Statement”, “Obtaining Information with EXPLAIN ANALYZE”. EXPLAIN 계획 추정 대 EXPLAIN ANALYZE 실제 실행/iterator time, rows, loops. ANALYZE는 쿼리를 실행하며 SELECT 지원. 제시된 예시 수치는 문서 샘플이지 이 fixture 측정이 아님.
9. https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html — MySQL 8.4 §17.7.2.3. Consistent read의 transaction snapshot 개념. 여러 HTTP 요청이 자동으로 같은 transaction/snapshot을 공유한다는 보장 근거는 없음.
10. https://use-the-index-luke.com/no-offset — Markus Winand(원저자), “We need tool support for keyset pagination”, “Life Without OFFSET”. OFFSET skip 비용과 insert로 인한 중복, seek 조건 원리. 저자 설명은 범용 원리이며 구체 MySQL 계획/시간 측정 대체 불가.
11. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Base64.html — Java SE 21 `java.util.Base64`, class description. Base64 인코딩 scheme으로 정의.
12. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/javax/crypto/Mac.html — Java SE 21 `javax.crypto.Mac`, class description. 공유 비밀키와 hash function을 쓰는 HMAC/MAC 설명; 알고리즘 사용은 provider/설정에 의존.
13. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/MessageDigest.html — Java SE 21 `MessageDigest`, class description. SHA-256 등 단방향 digest. 인증된 무결성과 같은 의미가 아님.
14. https://www.rfc-editor.org/rfc/rfc2104 — RFC 2104 §1 “Introduction”. 공유 비밀 키 기반 integrity/authentication code로 HMAC 정의. 원문 `...signature` 토큰 구현은 수행하지 않음.
15. https://docs.spring.io/spring-data/commons/docs/4.1.1/api/org/springframework/data/support/PageableExecutionUtils.html — API URL 열기 실패. 같은 4.1.1 구현은 위 raw source로 직접 확인.
16. https://docs.spring.io/spring-data/commons/docs/4.1.1/api/org/springframework/data/domain/Slice.html — API URL 열기 실패. 반환형 의미는 Spring 공식 JPA reference 4.1.1에서 교차 확인.
17. https://dev.mysql.com/doc/refman/8.4/en/row-constructor-optimization.html — 이번 세션에서 직접 열지 않음. 혼합 방향/row constructor의 특정 optimizer 최적화 세부는 미확인; 원문은 OR 형태의 비교식 사용.

## 원문과 실험 기록

- 현재 기준 파일: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W15-paging-offset-vs-cursor.md`, 283줄, SHA-256 `9937498a3b948f96099dca7bb625573bdc40879254c82c67afc465dee663108b`.
- 5 fence manifest: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w15-2026-10-20/source-proof/source.json`; 개별 원본은 같은 경로 `original/block-01.mmd`부터 `block-05.json`. 다섯 해시는 manifest의 값과 대조했으며 코드 실행은 하지 않음.
- old `/Users/ds/research/java-spring/W15-paging-offset-vs-cursor.md` 및 `_data/briefs/W15.md`는 기준으로 읽지 않음. 연구자는 repo/DB/서버 변경, SQL/Java 실행을 하지 않음.
