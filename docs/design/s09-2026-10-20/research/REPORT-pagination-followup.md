# Hibernate 7.4 컬렉션 fetch join 페이지네이션 후속 확인

확인일: 2026-10-20

## 확인 결과

Hibernate 7.4 문서가 설명하는 계열 동작은 컬렉션 `join fetch`와 제한/페이지네이션을 조합할 때, 지원 DB에서는 한정된 부모 결과에 대한 SQL 재작성을 사용한다는 것이다. 문서는 Hibernate 6 및 7.4 이전에는 JVM 메모리에서 제한을 적용했으며, 이를 되돌리는 query hint가 `org.hibernate.limitInMemory`라고 설명한다. 다만 현재 공개된 7.4 What’s New와 Migration Guide는 **7.4.13.Final**로 표시된다. 이 문서들은 7.4 계열의 동작 변경을 뒷받침하지만, 그 자체로 7.4.5.Final의 패치별 동작을 증명하지는 않는다.

7.4.5 릴리스 태그의 `HibernateHints.java` 원문에서 `HINT_LIMIT_IN_MEMORY = "org.hibernate.limitInMemory"`를 확인했다. 주석은 해당 hint가 HQL/criteria 제한을 SQL 대신 Java에서 적용하고 many-valued fetch join의 SQL rewriting을 끈다고 설명하며 `@since 7.4`로 표시한다. 따라서 hint는 7.4.5 코드에 존재한다. 태그의 hint 정의만으로는 SQL 재작성의 모든 코드 경로나 특정 DB에서의 결과까지 검증할 수 없다.

Hibernate 공식 GitHub 릴리스 페이지는 `7.4.5.Final` 릴리스와 태그 커밋 `6f28be6`를 표시하고, 7.4.5 변경 목록을 Hibernate Jira의 `fixVersion=7.4.5` 필터로 연결한다. Jira 결과는 이 조사 도구에서 본문을 읽을 수 없었다. 검색에서도 컬렉션 fetch join 페이지네이션의 7.4.5 이후 수정으로 식별 가능한 공식 이슈/변경 기록은 확인하지 못했다. 따라서 “후속 7.4 패치에서 해당 문제가 수정됐다”거나 특정 HHH 이슈가 원인이라고 결론 내릴 근거는 없다.

## 주어진 재현 기록과의 대조

메인 실행자가 전달한 재현 기록은 Hibernate `7.4.5.Final` / H2 `2.4.240` / JDK 21, `PurchaseOrder.lines`의 `@OneToMany(mappedBy="order") @OrderBy("id ASC") @BatchSize(32)`, 부모 3개와 부모당 자식 2개, 새 EntityManager 및 캐시 비활성화 조건이다. HQL은 다음과 같고 `setMaxResults(1)`을 적용했으나 부모 3개와 각 2개 자식이 반환됐다고 보고됐다.

```hql
select distinct o
from PurchaseOrder o
left join fetch o.lines
order by o.id
```

보고된 `StatementInspector` SQL은 `order by po1_0.id,l1_0.id`까지 있고 SQL limit/offset이 없다. 이는 공식 7.4 계열 가이드가 지원 DB에서 기대하는 동작과 일치하지 않는다. 단, 본 조사자는 이 실험을 실행하지 않았으며 전달된 관찰값을 독립 검증한 사실로 말하지 않는다.

현재 증거로는 원인을 특정할 수 없다. 재현 결과는 7.4 계열 문서상 기대와 다르므로 추가 확인 가치가 있지만, 설정·쿼리 API 경로·실제 runtime 의존성·SQL 캡처 완전성 또는 버그 중 무엇인지는 판별되지 않았다. Hibernate 7.4.5 패치의 알려진 결함이라고 단정하지 않는다. 메인 실행자가 진행 중인 `getMaxResults()` 확인, fetch join 없는 root-control, `setFirstResult(0)`, `org.hibernate.limitInMemory` 명시, HQL inline limit 비교 결과가 이 구분에 유용하다.

## 결론과 범위

- 확인됨: 7.4.13 공식 문서의 계열 설명은 SQL 내부 제한을 기본으로 하고 `org.hibernate.limitInMemory`를 구 동작 복구용으로 안내한다.
- 확인됨: upstream `7.4.5` 태그 소스의 `HibernateHints.java`에 해당 hint 정의가 있으며 `@since 7.4`다.
- 미확인: 7.4.5.Final의 모든 DB별 SQL rewriting 구현 세부, H2 2.4.240에서의 실제 동작, 보고된 재현의 원인.
- 미확인: 이후 7.4 패치가 이 증상을 수정했는지 여부. 관련 공식 issue/release change를 확인할 수 없었다.
- 조사자는 runtime 실행, 의존성 변경, 앱 변경을 하지 않았다.

자세한 URL, 버전 범위 및 접근 한계는 [`_data/pagination-source-notes.md`](/Users/ds/research/javaexperience-s09-20261020/_data/pagination-source-notes.md)에 기록했다.
