# 페이지네이션 후속 조사 출처 메모

확인일: 2026-10-20 (Asia/Seoul). 외부 자료는 Hibernate 공식 문서/GitHub/Jira만 사용. 기존 `REPORT.md`를 수정하지 않았다.

## 직접 확인한 출처

1. Hibernate ORM 7.4 What’s New: https://docs.hibernate.org/orm/7.4/whats-new/
   - 페이지의 명시 버전은 **7.4.13.Final**, 마지막 업데이트 표시는 2026-10-11 UTC.
   - “Limits and Fetch Joins”는 지원 DB(서브쿼리 안에서 limit/offset 지원; Sybase ASE 제외)에서 HQL `limit`/`setMaxResults()`와 collection `join fetch` 조합이 안전하다고 주장한다. Hibernate 6 및 이전 7에서는 many-valued fetch join의 제한을 JVM에서 처리했다고 설명하고, 이전 동작 복구 hint를 `org.hibernate.limitInMemory`로 제시한다.
   - URL은 7.4 계열 최신 문서이며 7.4.5 스냅샷이 아님. 릴리스별 정밀 판정에 이 한계를 적용해야 한다.

2. Hibernate ORM 7.4 Migration Guide: https://docs.hibernate.org/orm/7.4/migration-guide/
   - 명시 버전 **7.4.13.Final**. “Limits and fetch joins”는 collection-fetch query에 pagination/limit을 쓸 때 SQL query의 일부로 처리하며 `org.hibernate.limitInMemory`로 이전 동작을 복원한다고 기록한다.
   - 역시 7.4.5 단일 릴리스 문서가 아니다.

3. Hibernate ORM upstream 7.4.5 태그의 `HibernateHints.java` 원문: https://raw.githubusercontent.com/hibernate/hibernate-orm/7.4.5/hibernate-core/src/main/java/org/hibernate/jpa/HibernateHints.java
   - 원문에서 `HINT_LIMIT_IN_MEMORY = "org.hibernate.limitInMemory"` 확인. JavaDoc은 제한/offset을 SQL이 아니라 Java에서 적용하며 many-valued fetch join SQL rewriting을 비활성화한다고 명시. `@since 7.4`, `@Incubating` 표기도 존재.
   - 이는 해당 hint의 7.4.5 소스 존재와 의미를 확인한다. API 상수 파일만으로 구현 전체, 방언별 경로, 회귀 없는 동작까지 입증하는 것은 아니다.

4. Hibernate ORM GitHub 7.4.5 release: https://github.com/hibernate/hibernate-orm/releases/tag/7.4.5
   - 페이지가 `Hibernate ORM 7.4.5.Final released`, 태그 `7.4.5`, commit `6f28be6` 및 “full list of 7.4.5.Final changes”를 표시한다.
   - 변경 목록 링크는 https://hibernate.atlassian.net/issues/?jql=project+%3D+HHH+AND+fixVersion+%3D+7.4.5 이며, 브라우저 도구에선 페이지 본문이 비어 있어 issue 항목을 확인하지 못했다.

5. Hibernate ORM upstream relational query language docs (`main`): https://github.com/hibernate/hibernate-orm/blob/main/documentation/src/main/asciidoc/querylanguage/Relational.adoc
   - 현재 문서는 “Prior to Hibernate 7.4”와 서브쿼리 limit 지원 여부(Sybase ASE 예외)를 다시 설명한다.
   - `main`은 이동하는 브랜치이므로 7.4.5 소스 근거가 아닌 현재 설명과 계열 의미의 보조 근거로만 사용했다.

## 정확한 7.4.5 여부와 patch 조사

- 태그 경로의 `HibernateHints.java`를 직접 열어 7.4.5 소스 주석을 검토했다. GitHub release 페이지에서 tag/commit 표기도 대조했다.
- 공개 7.4 문서 페이지는 현재 7.4.13.Final이라 7.4.5 특정 구현 검증 자료로 혼용하지 않았다.
- GitHub release 페이지는 Jira의 해당 fixVersion 목록으로 연결하지만, Jira 본문은 도구로 읽히지 않았다. 공식 검색 결과에서도 7.4.5 이후 patch의 관련 수정 기록을 찾지 못했다. “수정 없음”이 아니라 “이번 확인 범위에서 확인 불가”다.
- 검색 중 GitHub tag tree 접근 일부는 robots/cache 제한에 걸렸다. 이에 따라 7.4.5의 SQL AST/translator 전체 소스를 감사한 것으로 주장하지 않는다.
- issue 번호, root cause, 특정 후속 버전에서 수정됐다는 문장은 근거가 없으므로 보고서에 기입하지 않았다.

## 대조용 재현 정보의 출처/한계

재현 설정, 관찰된 행 수 및 `StatementInspector` SQL은 사용자가 이 작업 요청에 전달한 자료다. 조사자가 실행하거나 독립 검증하지 않았다. 요청에서 지정한 후속 비교(API `getMaxResults()`, fetch 없는 root 대조, offset 0, 명시 hint, HQL inline limit)는 본 메모 작성 시점에 실행 결과가 제공되지 않아 미결이다.
