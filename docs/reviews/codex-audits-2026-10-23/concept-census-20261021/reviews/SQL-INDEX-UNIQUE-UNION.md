# 메인 심층 검토: 인덱스·UK·UNION의 의미와 시각 전달

확인일: 2026-10-21. 문서 존재와 입문자가 실행 상태를 이해할 수 있는지는 다른 축으로 판정한다.

## 현재 자료의 구체 상태

- R05는 클러스터드/보조 인덱스, 복합 인덱스 순서, 커버링, 검색 가능한 조건, 선택도, EXPLAIN/ANALYZE, invisible index를 설명한다. B-Tree 페이지·리프 연결 그림도 심화 절에 있다. 따라서 이 개념들이 전부 누락됐다고 판정하면 틀린다.
- 하지만 공개 첫 화면에는 읽기 지도와 요약이 중심이며, 트리 탐색·복합 키 정렬·PK 재조회 여부를 한 데이터로 비교하는 전용 조작 화면이 없다. 핵심 절로 이동해도 다른 페이지에서는 하위 토픽이 접힌 상태가 남는다. 문서별 캡처와 평가에서 구분한다.
- R03은 UNIQUE 제약과 NULL을 다룬다. UK라는 입력은 현재 실제 검색에서 결과0이다. 제약의 의미와 그 제약을 뒷받침하는 인덱스를 따로 배워야 한다.
- R04 전문에는 SQL UNION/UNION ALL의 중복 처리 비교가 없다. 현재 실제 검색에서 UNION은 J22의 Union-Find만 반환한다. 이름이 비슷하지만 서로 다른 개념이므로 명확한 누락·오연결 후보다.

원문: $WORKTREE_ROOT/concept-census-20261021/docs/knowledge/R05-index-btree.md, $WORKTREE_ROOT/concept-census-20261021/docs/knowledge/R03-schema-types-constraints.md, $WORKTREE_ROOT/concept-census-20261021/docs/knowledge/R04-sql-crud-join.md.

## 이번 일회용 MySQL 실행

MySQL8.4.11 컨테이너를 network=none, tmpfs 데이터, 호스트 포트 없이 만들었다. 식별자는 d8378972bc249f1af0a8f4229aba1b25558ae2c22107cbca72071d3f8106e264 이며 작업 뒤 stop과 자동 제거를 확인했다. 다른 DB/컨테이너는 사용하거나 정리하지 않았다.

원자료: $WORKTREE_ROOT/concept-census-20261021/audits/concept-census-20261021/_data/sql-probe/results.json. 각 SQL과 stdout/stderr도 같은 폴더에 있다.

| 확인할 개념 | 실행 조건 | 실제 관측 | 교육상 구분 |
|---|---|---|---|
| UNIQUE와 NULL | UNIQUE email, NULL2개 및 동일 non-null 중복 시도 | NULL2개 저장 허용, 동일 이메일은1062 거절 | 유일성과 필수값은 별개다. 이 시험은 MySQL 단일 nullable 키에 한정 |
| UNION | java/java/sql 세 SELECT, 명시 ORDER BY | java/sql 2행 | 중복 제거는 선택 결과의 행을 기준으로 설명 |
| UNION ALL | 같은 입력과 ORDER BY | java/java/sql 3행 | 중복을 보존. 여러 컬럼/타입/NULL의 확장은 별도 과제로 제시 |
| 커버링 | 1만 orders, (member_id,ordered_at), id/ordered_at만 SELECT | range, 추정10, Using where; Using index | 보조 인덱스의 PK 포함과 선택 열의 관계 |
| 비커버링 | 위 SELECT에 note 추가 | range, 추정10, Using index condition | Using index condition과 Using index는 같은 뜻이 아니다 |
| 선두열 없는 조건 | ordered_at만 조건, id/ordered_at 조회 | type=index, 추정9532, Using where; Using index | 인덱스 전체 스캔도 인덱스를 사용한다. 효율적인 범위 탐색과 구별 |
| 추정과 실제 | 커버링 쿼리 EXPLAIN ANALYZE | actual rows10, loops1 | 추정 rows와 실제 관측을 별도 표시 |

actual time은 파일에 보존했지만 단 한 번의 실행을 속도 개선 배수나 보편 성능으로 해석하지 않는다. 보조 데이터 생성 첫 시도에서 TEMPORARY TABLE을 같은 쿼리에서 여러 alias로 열어1137이 발생했다. 실패 로그를 보존하고 이 일회용 DB의 일반 digit 테이블로 준비한 뒤 나머지 실험을 수행했다. 이는 감사 fixture의 초기 오류이며 저장소 코드 결함이 아니다.

## 필요한 의미 장면 목록

1. **인덱스가 없는 탐색:** 같은 행10개 중 조건과 비교한 행을 하나씩 표시한다. 비교 횟수와 실제 경과시간을 혼동하지 않는다.
2. **B-Tree 페이지와 리프:** 루트→내부→리프의 경계 키, 한 페이지에 여러 키가 담기는 이유, 범위 탐색의 다음 리프 이동. 이진 트리와 이름만 비슷하다는 점을 분리한다.
3. **PK와 보조 인덱스:** 보조 키로 찾은 PK가 어디로 이동해 본문을 얻는지. 긴 PK가 보조 키 크기에 미치는 영향은 데이터 크기로 설명한다.
4. **복합 키 정렬:** (회원,시간) 키10개를 사전식으로 정렬하고 조건을 바꿔 탐색 범위를 색칠한다. 두 번째 열 조건이 '못 찾음'이 아니라 다른 접근/비용이 된다는 점을 보여 준다.
5. **커버링 선택:** SELECT에 note를 추가/제거할 때 인덱스에 필요한 열이 모두 있는지와 행 재조회 경로가 어떻게 달라지는지 보여 준다.
6. **UNIQUE/UK:** 중복값 거절, NULL 허용 여부, NOT NULL과 조합, 실패 뒤 행 수를 나란히 비교한다.
7. **UNION/UNION ALL:** 양쪽 결과의 동일 행이 합쳐지거나 남는 모습을 직접 바꿔 본다. JOIN은 옆으로 관계를 맞추고 UNION은 호환된 결과를 합친다는 차이도 별도 예시로 보여 준다.
8. **계획과 실측:** key, type, 추정rows, actual rows/loops를 한 쿼리 옆에 표시한다. 단순히 초록색 '인덱스 사용' 배지로 성공 판정하지 않는다.

이 목록은 새 시각 콘텐츠의 보완 요구이며 해당 화면을 제작·구현했다는 뜻이 아니다.
