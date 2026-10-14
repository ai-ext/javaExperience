# E7. JPA로 수정·삭제하기 — 변경 감지·삭제·대량 수정

> 개념 레슨 · 45분

## 이게 뭐냐

[E2](E2-db-sql-basics.md)에서는 `UPDATE tag SET name = '연습태그2' WHERE name = '연습태그'`를 손으로 썼다. E3·[E6](E6-repository-methods.md)에서 본 저장소에는 `save`·`find…`·`delete…`는 있는데 **`update` 메서드가 없다.** JPA에서 고치는 법은 이렇다.

> **트랜잭션 안에서 읽어 온 엔티티의 값을 바꾸면, 트랜잭션이 끝날 때(커밋) Hibernate가 `UPDATE`를 보낸다.**

이걸 **변경 감지**(dirty checking)라고 한다. 순서는 이렇다.

1. `findById`로 읽으면 Hibernate는 객체를 돌려주면서, 그 객체와 **읽었을 때 값의 사본**을 같이 들고 있다. 이렇게 들고 있는 곳을 **영속성 컨텍스트**라고 한다. 트랜잭션 하나에 하나씩 생긴다.
2. 코드가 `post.changeTitle("새 제목")`으로 필드 값을 바꾼다. 이때는 아무 SQL도 안 나간다.
3. 트랜잭션이 커밋되기 직전에 Hibernate가 들고 있던 객체를 사본과 하나하나 비교한다. 달라진 객체가 있으면 `UPDATE`를 보낸다(이걸 **flush**라고 한다).

그래서 `save()`를 부르지 않아도 된다. 대신 **트랜잭션이 있어야** 한다. 트랜잭션은 서비스 메서드에 `@Transactional`을 붙여 만든다. 메서드가 시작될 때 트랜잭션이 열리고, 정상으로 끝나면 커밋된다. 자세한 규칙(롤백, 어디에 거나)은 G3에서 배운다. 오늘은 "있을 때와 없을 때 SQL이 어떻게 다른가"만 본다.

### 고치고 지우는 네 가지 길

| 길 | 코드 | 나가는 SQL | 쓰는 때 |
|---|---|---|---|
| 변경 감지 | 읽고 → 값 바꾸기 | 커밋 때 `UPDATE … WHERE id = ?` 한 줄 | 글 하나 고치기(제목, 상태) |
| 삭제 | `delete(엔티티)` · `deleteById(id)` | `SELECT` 먼저, 커밋 때 `DELETE` | 진짜로 행을 지울 때 |
| soft delete | 읽고 → `deletedAt`에 지금 시각 | 변경 감지와 같은 `UPDATE` | 지운 척만 할 때(게시판은 보통 이쪽) |
| 벌크 수정 | `@Modifying @Query("update …")` | `UPDATE … WHERE 조건` 한 번에 여러 행 | 조건에 맞는 행을 한꺼번에 |

## 예시

진짜 `post` 테이블을 고치면 다른 실습이 깨진다. `practice` DB에 **연습용 복사본** `lesson_post`(글 10개)와 `lesson_board`를 만들어 거기서 한다. 만드는 SQL은 따라 해 보기 1단계에 있다. 엔티티는 이렇다.

```java
@Entity
@Table(name = "lesson_post")   // 연습용 복사본 — 진짜 post는 건드리지 않는다
public class LessonPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "board_id", nullable = false)
    private Long boardId;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)          // DB에 'PUBLISHED' 같은 이름으로 저장
    @Column(nullable = false)
    private PostStatus status;

    @Column(name = "view_count")
    private int viewCount;

    @CreationTimestamp                    // INSERT 때 한 번 채운다
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp                      // INSERT·UPDATE 때마다 새로 채운다
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;      // null이면 살아 있는 글

    protected LessonPost() {}

    public LessonPost(Long boardId, Long authorId, String title, String content) {
        this.boardId = boardId;
        this.authorId = authorId;
        this.title = title;
        this.content = content;
        this.status = PostStatus.DRAFT;
    }

    // 의도가 보이는 메서드 — setter 대신
    public void changeTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("제목은 비울 수 없다");
        }
        this.title = title;
    }

    public void softDelete(LocalDateTime now) {
        this.deletedAt = now;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public PostStatus getStatus() { return status; }
    public int getViewCount() { return viewCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getDeletedAt() { return deletedAt; }
}
```

```java
public enum PostStatus { PUBLISHED, DRAFT, HIDDEN }
```

`setTitle` 대신 `changeTitle`을 둔 이유가 있다. 값이 바뀌는 곳이 이 메서드 하나라서, "빈 제목 금지" 같은 규칙을 여기 한 번만 쓰면 된다. 서비스 코드를 읽을 때도 `post.changeTitle(…)`이 "제목을 바꾼다"는 업무로 읽힌다. `setDeletedAt(now)` 대신 `softDelete(now)`도 같다.

서비스는 `@Transactional`이 있는 것과 없는 것을 나란히 둔다.

```java
@Service
public class LessonPostService {

    private final LessonPostRepository posts;

    public LessonPostService(LessonPostRepository posts) {
        this.posts = posts;
    }

    private LessonPost getPost(Long id) {
        return posts.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "글이 없습니다: " + id));
    }

    @Transactional
    public LessonPost changeTitle(Long id, String title) {
        LessonPost post = getPost(id);
        post.changeTitle(title);
        System.out.println("   changeTitle 메서드 끝 — save는 안 불렀다");
        return post;
    }

    // @Transactional 없음
    public LessonPost changeTitleNoTx(Long id, String title) {
        LessonPost post = getPost(id);
        post.changeTitle(title);
        System.out.println("   changeTitleNoTx 메서드 끝");
        return post;
    }

    // @Transactional 없이 save를 부른다
    public LessonPost changeTitleNoTxSave(Long id, String title) {
        LessonPost post = getPost(id);
        post.changeTitle(title);
        LessonPost saved = posts.save(post);
        System.out.println("   save가 돌려준 객체가 같은 객체인가? " + (saved == post));
        return saved;
    }

    @Transactional(readOnly = true)
    public void changeTitleReadOnly(Long id, String title) {
        LessonPost post = getPost(id);
        post.changeTitle(title);
        System.out.println("   readOnly 메서드 끝");
    }

    @Transactional
    public void softDelete(Long id) {
        LessonPost post = getPost(id);
        post.softDelete(LocalDateTime.now());
    }

    @Transactional
    public void delete(Long id) {
        LessonPost post = getPost(id);
        posts.delete(post);
        System.out.println("   delete 호출 끝");
    }
}
```

아래 로그는 따라 해 보기에서 실제로 나온 것이다. 읽기 쉽게 줄였다. `SQL:`은 Hibernate가 보낸 SQL, `bind:`는 `?`에 들어간 값, `TX:`는 트랜잭션 관리자(`JpaTransactionManager`)의 로그에서 시작·참여·커밋 줄만 남긴 것이다. `lesson_post`의 SELECT 목록은 열 10개가 늘 같아서 `lp1_0.id,…,lp1_0.view_count`로 줄였다.

### ① 변경 감지 — `save` 없이 `UPDATE`

```text
TX: Creating new transaction with name [org.example.e7.LessonPostService.changeTitle]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
TX: Participating in existing transaction
SQL: select lp1_0.id,…,lp1_0.view_count from lesson_post lp1_0 where lp1_0.id=?
   changeTitle 메서드 끝 — save는 안 불렀다
TX: Committing JPA transaction
SQL: update lesson_post set author_id=?,board_id=?,content=?,deleted_at=?,status=?,title=?,updated_at=?,view_count=? where id=?
bind: (6:VARCHAR) <- [제목을 고쳤다]
bind: (7:TIMESTAMP) <- [2026-10-10T15:38:50.956617]
bind: (9:BIGINT) <- [1]
```

- `changeTitle` 메서드에 들어갈 때 트랜잭션이 **새로** 열렸다. 안에서 부른 `findById`는 새로 열지 않고 **참여**했다(`Participating in existing transaction`).
- `UPDATE`는 **"메서드 끝" 다음, 커밋할 때** 나갔다. 값을 바꾼 줄(`post.changeTitle`)에서는 SQL이 없었다.
- 제목만 바꿨는데 `UPDATE`에 열이 8개다. Hibernate는 기본으로 바뀐 칸만이 아니라 **모든 칸**을 다시 쓴다. `created_at`만 빠졌는데, `updatable = false`라서다.
- `updated_at`(7번)에는 `@UpdateTimestamp`가 지금 시각을 넣었다.

**② 같은 값으로 다시 바꾸면** `select` 한 줄 뒤 커밋만 하고 `UPDATE`가 없었다. 사본과 비교해 달라진 게 없으니 보낼 것도 없다.

### ③ `@Transactional`이 없으면 — 아무 일도 없다

```text
TX: Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
SQL: select lp1_0.id,…,lp1_0.view_count from lesson_post lp1_0 where lp1_0.id=?
TX: Committing JPA transaction
   changeTitleNoTx 메서드 끝
…
③ DB 제목: [공지] 커뮤니티 이용 규칙 안내
```

서비스에 트랜잭션이 없으니, `findById`가 **자기 몫의 작은 트랜잭션**(`SimpleJpaRepository.findById … readOnly`)을 열고 읽자마자 커밋했다. 그 순간 영속성 컨텍스트도 닫혔다. 그 뒤에 바꾼 제목은 아무도 비교해 주지 않는다. `UPDATE`가 없고, 에러도 없다. **DB 제목은 그대로다.**

API로 부르면 더 헷갈린다. 응답에는 고친 제목이 나온다. 메모리의 객체는 바뀌었기 때문이다(따라 해 보기 4).

### ④ `@Transactional` 없이 `save`를 부르면

```text
SQL: select lp1_0.id,…,lp1_0.view_count from lesson_post lp1_0 where lp1_0.id=?        ← findById
TX: Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.save]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
SQL: select lp1_0.id,…,lp1_0.view_count from lesson_post lp1_0 where lp1_0.id=?        ← save 안에서 또 읽는다
TX: Committing JPA transaction
SQL: update lesson_post set author_id=?,board_id=?,content=?,deleted_at=?,status=?,title=?,updated_at=?,view_count=? where id=?
   save가 돌려준 객체가 같은 객체인가? false
```

이번엔 저장됐다. 그런데 같은 행을 **두 번** 읽었다. `save`는 id가 있는 객체를 받으면 "이미 있는 행"으로 보고 **병합**(merge)한다. 새 트랜잭션에서 DB 행을 다시 읽어 새 객체를 만들고, 내 객체의 값을 거기에 복사한 다음, 커밋 때 변경 감지로 `UPDATE`한다. 그래서 돌려준 객체는 내가 넘긴 객체와 **다른 객체**다(`false`). `save` 뒤에는 돌려받은 객체를 써야 한다.

정리하면, 서비스에 `@Transactional`을 걸고 값만 바꾸는 쪽(①)이 SQL도 적고 코드도 짧다. `save`는 **새 객체를 처음 넣을 때**(`id`가 `null`) 부른다.

### ⑤ `@Transactional(readOnly = true)`에서 바꾸면

```text
TX: Creating new transaction with name [org.example.e7.LessonPostService.changeTitleReadOnly]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
SQL: select lp1_0.id,…,lp1_0.view_count from lesson_post lp1_0 where lp1_0.id=?
   readOnly 메서드 끝
TX: Committing JPA transaction
…
⑤ DB 제목: 첫 코드리뷰 받은 날
```

커밋은 했는데 `UPDATE`가 없다. 읽기 전용 트랜잭션에서는 Hibernate가 변경 감지를 건너뛴다. 조회용 서비스 메서드에 `readOnly = true`를 붙이면 쓸데없는 비교를 안 해서 좋지만, 그 안에서 값을 바꿔도 저장되지 않는다는 뜻이기도 하다.

### ⑥ 작성·수정 시각 자동 입력

```text
SQL: insert into lesson_post (author_id,board_id,content,created_at,deleted_at,status,title,updated_at,view_count) values (?,?,?,?,?,?,?,?,?)
bind: (4:TIMESTAMP) <- [2026-10-10T15:38:51.058482]       ← created_at
bind: (6:ENUM) <- [DRAFT]
bind: (8:TIMESTAMP) <- [2026-10-10T15:38:51.058504]       ← updated_at
⑥ 저장 직후 객체: createdAt 2026-10-10T15:38:51.058482 / updatedAt 2026-10-10T15:38:51.058504
…(changeTitle로 제목 수정)
SQL: update lesson_post set author_id=?,board_id=?,content=?,deleted_at=?,status=?,title=?,updated_at=?,view_count=? where id=?
bind: (7:TIMESTAMP) <- [2026-10-10T15:38:51.076943]       ← updated_at만 새 값
⑥ DB에서 다시 읽음: createdAt 2026-10-10T15:38:51 / updatedAt 2026-10-10T15:38:51
```

- `@CreationTimestamp`·`@UpdateTimestamp`(Hibernate 기능)는 서버(JVM)의 지금 시각을 넣는다. 두 필드를 따로 채워서 처음 넣을 때도 마이크로초가 조금 다르다.
- `enum`은 `@Enumerated(EnumType.STRING)` 덕분에 `'DRAFT'`라는 이름으로 들어갔다.
- 다시 읽으니 소수점 아래가 사라졌다. 열이 `datetime`(초까지)이라서 MySQL이 반올림해 저장한다. 다른 실행에서는 `15:24:55.648308`이 `15:24:56`으로 저장됐다. 저장 직후 객체에 든 값과 DB 값이 다를 수 있다는 점만 기억한다.

같은 일을 **Spring Data의 Auditing**으로도 할 수 있다. 실무 코드에서 자주 보는 쪽이다.

```java
@Entity
@Table(name = "lesson_post")
@EntityListeners(AuditingEntityListener.class)   // 저장·수정 직전에 Spring Data가 끼어들게 한다
public class AuditedPost {
    // …id, boardId, authorId, title, content는 같다

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
```

```java
@Configuration
@EnableJpaAuditing      // 이게 있어야 동작한다
public class AuditingConfig {}
```

| | Hibernate `@CreationTimestamp`·`@UpdateTimestamp` | Spring Data `@CreatedDate`·`@LastModifiedDate` |
|---|---|---|
| 필요한 설정 | 어노테이션만 | `@EntityListeners(AuditingEntityListener.class)` + `@EnableJpaAuditing` |
| 처음 넣을 때 | 두 값이 마이크로초 단위로 조금 다르다 | 두 값이 똑같다(`…41.793438`과 `…41.793438`) |
| 더 할 수 있는 것 | 시각만 | `@CreatedBy`·`@LastModifiedBy`로 "누가"도 기록(로그인 정보와 연결) |

Auditing에 필요한 `spring-aspects` 라이브러리는 `spring-boot-starter-data-jpa`가 이미 데려온다(`./gradlew dependencies`로 확인). 따로 추가하지 않는다. `@EnableJpaAuditing`을 빼면 어떻게 되는지는 일부러 틀려 보기 4에 있다.

### ⑦~⑨ 삭제 — 지우기 전에 먼저 읽는다

```text
⑦ delete(엔티티)                         ← 서비스 @Transactional 안에서 findById → delete
SQL: select lp1_0.id,…,lp1_0.view_count from lesson_post lp1_0 where lp1_0.id=?
   delete 호출 끝
TX: Committing JPA transaction
SQL: delete from lesson_post where id=?
⑧ deleteById(10)
TX: Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.deleteById]: …
SQL: select lp1_0.id,…,lp1_0.view_count from lesson_post lp1_0 where lp1_0.id=?
TX: Committing JPA transaction
SQL: delete from lesson_post where id=?
⑨ deleteById(9999) — 없는 번호
SQL: select lp1_0.id,…,lp1_0.view_count from lesson_post lp1_0 where lp1_0.id=?
TX: Committing JPA transaction
⑨ 예외 없이 지나감
```

- `delete`도 `UPDATE`처럼 **커밋 때** 나간다(⑦에서 "호출 끝" 뒤).
- `deleteById(10)`은 이름만 보면 `DELETE` 한 줄일 것 같은데, **`SELECT` 먼저**다. Spring Data는 id로 엔티티를 먼저 찾고, 찾은 엔티티를 지운다.
- 없는 번호(9999)면 `SELECT`만 하고 **조용히 끝난다.** 예외가 없다. "없는 글을 지우려 하면 404"가 필요하면 ⑦처럼 서비스에서 `findById(…).orElseThrow(…)`로 먼저 확인한다.

이름 규칙 삭제도 같다. `long deleteByBoardId(Long boardId)`를 트랜잭션 안에서 불렀더니 `select … where lp1_0.board_id=?`로 2행을 읽은 뒤, 커밋 때 `delete from lesson_post where id=?`가 **행마다 한 번씩** 나갔다. 1000행이면 `DELETE`가 1000번이다.

### ⑩ soft delete — 지운 척, 그리고 거르기

```text
SQL: update lesson_post set author_id=?,board_id=?,content=?,deleted_at=?,status=?,title=?,updated_at=?,view_count=? where id=?
bind: (4:TIMESTAMP) <- [2026-10-10T15:38:51.123729]       ← deleted_at
⑩ findById(9): Optional[이직 준비 근황]
SQL: select lp1_0.id,…,lp1_0.view_count from lesson_post lp1_0 where lp1_0.id=? and lp1_0.deleted_at is null
⑩ findByIdAndDeletedAtIsNull(9): Optional.empty
```

soft delete는 JPA 기능이 아니라 **우리가 정한 규칙**이다. `softDelete(now)`로 `deletedAt`을 채우면 ①과 같은 변경 감지 `UPDATE`가 나간다. 행은 남는다.

그래서 **`findById`는 지운 글을 그대로 찾는다.** 지운 글을 거르려면 조회마다 `deleted_at is null` 조건이 있어야 한다. E6의 이름 규칙(`findByIdAndDeletedAtIsNull`)으로 만들었다. 상세·목록·수정·좋아요처럼 글을 찾는 모든 길에서 이 조건을 빠뜨리지 않는 게 3-2의 핵심이다.

`findByIdAndDeletedAtIsNull` 앞에는 `TX:` 줄이 없다. `findById`·`save`·`deleteById` 같은 **물려받은 메서드에는 기본 트랜잭션이 붙어 있고**, 내가 이름 규칙이나 `@Query`로 **직접 선언한 메서드에는 없다.** 읽기는 그래도 되지만, 지우기·고치기는 트랜잭션이 없으면 실패한다(일부러 틀려 보기 3).

### ⑪~⑭ 벌크 수정 — `@Modifying`

"게시판 2의 글 조회수를 전부 +1"을 변경 감지로 하면 글마다 읽고 `UPDATE`가 한 줄씩 나간다. `UPDATE` 한 번으로 끝내려면 저장소에 직접 쓴다.

```java
public interface LessonPostRepository extends JpaRepository<LessonPost, Long> {

    // soft delete 된 글은 못 찾는 조회
    Optional<LessonPost> findByIdAndDeletedAtIsNull(Long id);

    long deleteByBoardId(Long boardId);

    // 벌크 UPDATE — 조건에 맞는 행을 SQL 한 번에 고친다
    @Modifying
    @Query("update LessonPost p set p.viewCount = p.viewCount + 1 where p.boardId = :boardId")
    int increaseViews(@Param("boardId") Long boardId);

    @Modifying(clearAutomatically = true)
    @Query("update LessonPost p set p.viewCount = p.viewCount + 1 where p.boardId = :boardId")
    int increaseViewsAndClear(@Param("boardId") Long boardId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update LessonPost p set p.viewCount = p.viewCount + 1 where p.boardId = :boardId")
    int increaseViewsFlushAndClear(@Param("boardId") Long boardId);
}
```

`@Modifying`은 "이 `@Query`는 조회가 아니라 고치는 쿼리"라는 표시다. 돌려주는 `int`는 바뀐 행 수다. 그런데 벌크 `UPDATE`는 **영속성 컨텍스트를 거치지 않고 DB에 바로** 간다. 그래서 들고 있던 객체와 DB가 어긋난다. 트랜잭션 안에서 글 5(게시판 2)를 먼저 읽고 벌크를 돌렸다.

```text
⑪ 벌크 UPDATE
SQL: select lp1_0.id,…,lp1_0.view_count from lesson_post lp1_0 where lp1_0.id=?
   벌크 전 view_count 36
SQL: update lesson_post lp1_0 set view_count=(lp1_0.view_count+1) where lp1_0.board_id=?
   벌크로 바꾼 행 1
   들고 있던 객체 36 / 다시 findById 36
⑪ 트랜잭션이 끝난 뒤 다시 읽기: 37
```

DB는 37인데 같은 트랜잭션 안에서는 36이다. **다시 `findById`를 해도 36이고 SQL도 안 나갔다.** 한 트랜잭션 안에서 이미 읽은 엔티티는 영속성 컨텍스트에 있는 것을 돌려주기 때문이다(E4에서 같은 회원을 다시 안 읽던 것과 같다).

```text
⑫ 벌크 UPDATE + clearAutomatically
   벌크 전 view_count 37
SQL: update lesson_post lp1_0 set view_count=(lp1_0.view_count+1) where lp1_0.board_id=?
   벌크로 바꾼 행 1
SQL: select lp1_0.id,…,lp1_0.view_count from lesson_post lp1_0 where lp1_0.id=?
   들고 있던 객체 37 / 다시 findById 38
```

`clearAutomatically = true`는 벌크 직후 영속성 컨텍스트를 **비운다.** 그래서 다시 `findById`하면 DB를 새로 읽어 38이 나온다. 이미 손에 든 객체(`post`)는 여전히 37이다. 벌크 뒤에는 다시 읽어서 쓴다.

비우기에는 대가가 있다. **아직 `UPDATE`로 안 보낸 변경도 같이 버려질 수 있다.**

```text
⑬ 게시판 이름을 고친 뒤 clearAutomatically 벌크
SQL: select lb1_0.id,lb1_0.name from lesson_board lb1_0 where lb1_0.id=?
SQL: update lesson_post lp1_0 set view_count=(lp1_0.view_count+1) where lp1_0.board_id=?
TX: Committing JPA transaction
⑬ DB 게시판 이름: 개발
⑭ 같은 일 + flushAutomatically
SQL: select lb1_0.id,lb1_0.name from lesson_board lb1_0 where lb1_0.id=?
SQL: update lesson_board set name=? where id=?
SQL: update lesson_post lp1_0 set view_count=(lp1_0.view_count+1) where lp1_0.board_id=?
⑭ DB 게시판 이름: 개발(바꿈)
```

⑬에서 게시판 이름을 `개발(바꿈)`으로 바꿨는데 `update lesson_board`가 끝내 나가지 않았다. 벌크가 컨텍스트를 비우면서 바뀐 게시판 객체도 같이 버렸다. ⑭처럼 `flushAutomatically = true`를 더하면 벌크 **전에** 밀린 변경을 먼저 보내고(`update lesson_board`) 나서 비운다.

따로 해 본 실험에서, 같은 `lesson_post`의 제목을 고친 뒤 `clearAutomatically` 벌크를 돌렸을 때는 Hibernate가 제목 `UPDATE`를 벌크 앞에 먼저 보내서 잃지 않았다. 벌크와 **같은 테이블**의 변경은 먼저 보냈고, **다른 테이블**(`lesson_board`)의 변경은 보내지 않은 채 버렸다. 어느 쪽인지 따지기보다 `clearAutomatically`를 켤 때는 `flushAutomatically`도 같이 켠다.

## 따라 해 보기

20분. E6에서 만든 연습 프로젝트에 이어서 한다. `E6Playground.java`는 지웠어야 한다.

**1. 연습 테이블을 만든다.** E2의 `sql` 함수는 `community` DB를 본다. 맨 끝 DB 이름만 `practice`로 바꾼 `sqlp`를 하나 더 만든다.

```bash
sqlp() { docker exec -i studymate-mysql-1 mysql --default-character-set=utf8mb4 -t -ucommunity -pcommunity practice -e "$1"; }
sqlp "DROP TABLE IF EXISTS lesson_post, lesson_board; CREATE TABLE lesson_post LIKE post; INSERT INTO lesson_post SELECT * FROM post WHERE id <= 10; CREATE TABLE lesson_board LIKE board; INSERT INTO lesson_board SELECT * FROM board"
```

`CREATE TABLE … LIKE post`는 열·인덱스·CHECK 제약까지 똑같은 빈 테이블을 만든다. 외래키는 따라오지 않아서, 지워도 댓글·좋아요 테이블과 부딪히지 않는다. 처음부터 다시 하고 싶으면 이 줄을 또 실행한다.

**2. 설정 한 줄을 더한다.** `application.yml`의 `logging.level` 아래에 트랜잭션 로그를 켠다.

```yaml
logging:
  level:
    org.hibernate.SQL: debug
    org.hibernate.orm.jdbc.bind: trace
    org.springframework.orm.jpa.JpaTransactionManager: debug   # 트랜잭션이 언제 열리고 커밋되나
```

**3. 파일.** 패키지는 `org.example.e7`. 예시의 `LessonPost`·`PostStatus`·`LessonPostRepository`·`LessonPostService`와 아래 `LessonBoard`·`LessonBoardRepository`·연습 파일을 만든다.

```java
@Entity
@Table(name = "lesson_board")
public class LessonBoard {
    @Id
    private Long id;
    private String name;

    protected LessonBoard() {}

    public void rename(String name) { this.name = name; }
    public String getName() { return name; }
}
```

```java
public interface LessonBoardRepository extends JpaRepository<LessonBoard, Long> {}
```

```java
// 연습용 — 서버가 뜰 때 한 번 실행된다. 다 보고 나면 지운다
@Component
public class E7Playground implements CommandLineRunner {
    private final LessonPostService service;
    private final LessonPostRepository posts;
    private final LessonBoardRepository boards;
    private final TransactionTemplate tx;

    public E7Playground(LessonPostService service, LessonPostRepository posts,
                        LessonBoardRepository boards, TransactionTemplate tx) {
        this.service = service;
        this.posts = posts;
        this.boards = boards;
        this.tx = tx;
    }

    private static void p(String s) { System.out.println(s); }
    private String titleInDb(long id) { return posts.findById(id).orElseThrow().getTitle(); }

    @Override
    public void run(String... args) {
        p("① @Transactional 안에서 제목 바꾸기 — save 없음");
        service.changeTitle(1L, "제목을 고쳤다");
        p("① DB 제목: " + titleInDb(1L));

        p("② 같은 값으로 다시 바꾸기");
        service.changeTitle(1L, "제목을 고쳤다");

        p("③ @Transactional 없이");
        service.changeTitleNoTx(2L, "트랜잭션 없이 고침");
        p("③ DB 제목: " + titleInDb(2L));

        p("④ @Transactional 없이 + save");
        service.changeTitleNoTxSave(2L, "save로 고침");
        p("④ DB 제목: " + titleInDb(2L));

        p("⑤ readOnly = true");
        service.changeTitleReadOnly(3L, "readOnly에서 고침");
        p("⑤ DB 제목: " + titleInDb(3L));

        p("⑥ 새 글 저장 → 제목 수정 — 시각 자동 입력");
        LessonPost created = posts.save(new LessonPost(1L, 1L, "e7 새 글", "내용"));
        p("⑥ 저장 직후 객체: createdAt " + created.getCreatedAt() + " / updatedAt " + created.getUpdatedAt());
        service.changeTitle(created.getId(), "e7 새 글(수정)");
        LessonPost reread = posts.findById(created.getId()).orElseThrow();
        p("⑥ DB에서 다시 읽음: createdAt " + reread.getCreatedAt() + " / updatedAt " + reread.getUpdatedAt());

        p("⑦ delete(엔티티)");
        service.delete(created.getId());

        p("⑧ deleteById(10)");
        posts.deleteById(10L);
        p("⑨ deleteById(9999) — 없는 번호");
        posts.deleteById(9999L);
        p("⑨ 예외 없이 지나감");

        p("⑩ soft delete");
        service.softDelete(9L);
        p("⑩ findById(9): " + posts.findById(9L).map(LessonPost::getTitle));
        p("⑩ findByIdAndDeletedAtIsNull(9): " + posts.findByIdAndDeletedAtIsNull(9L).map(LessonPost::getTitle));

        p("⑪ 벌크 UPDATE");
        tx.executeWithoutResult(s -> {
            LessonPost post = posts.findById(5L).orElseThrow();
            p("   벌크 전 view_count " + post.getViewCount());
            p("   벌크로 바꾼 행 " + posts.increaseViews(2L));
            p("   들고 있던 객체 " + post.getViewCount() + " / 다시 findById " + posts.findById(5L).orElseThrow().getViewCount());
        });
        p("⑪ 트랜잭션이 끝난 뒤 다시 읽기: " + posts.findById(5L).orElseThrow().getViewCount());

        p("⑫ 벌크 UPDATE + clearAutomatically");
        tx.executeWithoutResult(s -> {
            LessonPost post = posts.findById(5L).orElseThrow();
            p("   벌크 전 view_count " + post.getViewCount());
            p("   벌크로 바꾼 행 " + posts.increaseViewsAndClear(2L));
            p("   들고 있던 객체 " + post.getViewCount() + " / 다시 findById " + posts.findById(5L).orElseThrow().getViewCount());
        });

        p("⑬ 게시판 이름을 고친 뒤 clearAutomatically 벌크");
        tx.executeWithoutResult(s -> {
            boards.findById(2L).orElseThrow().rename("개발(바꿈)");
            posts.increaseViewsAndClear(2L);
        });
        p("⑬ DB 게시판 이름: " + boards.findById(2L).orElseThrow().getName());

        p("⑭ 같은 일 + flushAutomatically");
        tx.executeWithoutResult(s -> {
            boards.findById(2L).orElseThrow().rename("개발(바꿈)");
            posts.increaseViewsFlushAndClear(2L);
        });
        p("⑭ DB 게시판 이름: " + boards.findById(2L).orElseThrow().getName());
    }
}
```

`TransactionTemplate`은 E4에서 쓴 것과 같다. "이 람다를 트랜잭션 하나로 묶어 실행"한다. 서비스 메서드를 따로 만들지 않고 트랜잭션 안을 보려고 썼다.

**4. 켜고 ①~⑭ 사이의 `SQL:`·`TX:` 줄을 읽는다.** 예시에 옮긴 로그와 같아야 한다(시각은 다르다). 이 표만 확인하면 된다.

| 번호 | `UPDATE`/`DELETE`가 나갔나 | 어디서 |
|---|---|---|
| ① | `update` 1 | "메서드 끝" **뒤**, `Committing` 다음 |
| ② · ③ · ⑤ | 없음 | 같은 값 · 트랜잭션 없음 · 읽기 전용 |
| ④ | `update` 1 | 그 앞에 `select`가 2번 |
| ⑦ · ⑧ | `delete` 1 | 그 앞에 `select` 1 |
| ⑨ | 없음 | `select`만, 예외 없음 |
| ⑪ · ⑫ | 벌크 `update` 1 | ⑫만 그 뒤에 `select`가 다시 나간다 |
| ⑬ | 벌크 `update`만 | `update lesson_board`가 **없다** |

**5. API로 확인한다.** `E7Playground.java`를 지우고, 1단계 `sqlp` 줄을 다시 실행해 테이블을 새로 만든 뒤 서버를 켠다. 컨트롤러는 이렇다.

```java
@RestController
public class LessonPostController {

    private final LessonPostService service;
    private final LessonPostRepository posts;

    public LessonPostController(LessonPostService service, LessonPostRepository posts) {
        this.service = service;
        this.posts = posts;
    }

    public record TitleRequest(String title) {}
    public record PostResponse(Long id, String title, String status, String updatedAt) {
        static PostResponse from(LessonPost p) {
            return new PostResponse(p.getId(), p.getTitle(), p.getStatus().name(), String.valueOf(p.getUpdatedAt()));
        }
    }

    @PatchMapping("/e7/posts/{id}")
    public PostResponse changeTitle(@PathVariable Long id, @RequestBody TitleRequest req) {
        return PostResponse.from(service.changeTitle(id, req.title()));
    }

    @PatchMapping("/e7/posts/{id}/no-tx")
    public PostResponse changeTitleNoTx(@PathVariable Long id, @RequestBody TitleRequest req) {
        return PostResponse.from(service.changeTitleNoTx(id, req.title()));
    }

    // 나쁜 예: 인자 없는 orElseThrow()
    @GetMapping("/e7/posts/{id}/bad")
    public PostResponse getBad(@PathVariable Long id) {
        return PostResponse.from(posts.findById(id).orElseThrow());
    }

    @DeleteMapping("/e7/posts/{id}")
    public void delete(@PathVariable Long id) {
        service.softDelete(id);
    }
}
```

```text
$ curl -s -i -X PATCH localhost:18280/e7/posts/1 -H 'Content-Type: application/json' -d '{"title":"curl로 고친 제목"}'
HTTP/1.1 200
{"id":1,"title":"curl로 고친 제목","status":"PUBLISHED","updatedAt":"2026-10-10T15:31:32.879569"}

$ curl -s -i -X PATCH localhost:18280/e7/posts/2/no-tx -H 'Content-Type: application/json' -d '{"title":"트랜잭션 없이 고친 제목"}'
HTTP/1.1 200
{"id":2,"title":"트랜잭션 없이 고친 제목","status":"PUBLISHED","updatedAt":"2026-07-01T11:00"}

$ curl -s -i -X PATCH localhost:18280/e7/posts/9999 -H 'Content-Type: application/json' -d '{"title":"없는 글"}'
HTTP/1.1 404
{"timestamp":"2026-10-10T06:31:32.960Z","status":404,"error":"Not Found","path":"/e7/posts/9999"}

$ curl -s -i localhost:18280/e7/posts/9999/bad
HTTP/1.1 500
{"timestamp":"2026-10-10T06:31:32.980Z","status":500,"error":"Internal Server Error","path":"/e7/posts/9999/bad"}

$ curl -s -i -X DELETE localhost:18280/e7/posts/3
HTTP/1.1 200
```

(헤더는 상태 줄만 남겼다.) 이제 DB를 본다.

```text
$ sqlp "SELECT id, title, updated_at, deleted_at FROM lesson_post WHERE id IN (1,2,3)"
+----+--------------------------------------------+---------------------+---------------------+
| id | title                                      | updated_at          | deleted_at          |
+----+--------------------------------------------+---------------------+---------------------+
|  1 | curl로 고친 제목                           | 2026-10-10 15:31:33 | NULL                |
|  2 | [공지] 커뮤니티 이용 규칙 안내             | 2026-07-01 11:00:00 | NULL                |
|  3 | 첫 코드리뷰 받은 날                        | 2026-10-10 15:31:33 | 2026-10-10 15:31:33 |
+----+--------------------------------------------+---------------------+---------------------+
```

| 요청 | 응답 | DB |
|---|---|---|
| `PATCH /e7/posts/1` | `200`, 새 제목 | 바뀌었다 |
| `PATCH /e7/posts/2/no-tx` | **`200`, 새 제목** | **안 바뀌었다** — 응답의 `updatedAt`도 옛날 값 그대로다. `UPDATE`가 없었으니 `@UpdateTimestamp`도 안 돌았다 |
| `PATCH /e7/posts/9999` | `404` | — |
| `GET /e7/posts/9999/bad` | `500` | — |
| `DELETE /e7/posts/3` | `200` | 행은 남고 `deleted_at`이 채워졌다 |

2번이 이 레슨에서 가장 무서운 장면이다. 클라이언트는 `200`과 새 제목을 받았는데 DB는 그대로다. 테스트에서 응답만 확인하면 못 잡는다. 수정 API는 **DB를 다시 읽어서** 확인한다.

없는 글의 차이도 본다. 서비스의 `getPost`는 `orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, …))`라서 `404`가 됐다. 인자 없는 `orElseThrow()`는 `java.util.NoSuchElementException: No value present`를 던지고, 아무도 HTTP 상태로 바꿔 주지 않으니 `500`이 된다. 서버 로그에도 이 예외가 스택트레이스와 함께 남는다. 잘못 보낸 쪽은 클라이언트인데 서버 잘못으로 답한 셈이다. 404 응답 본문을 F1의 `ProblemDetail` 모양으로 바꾸는 건 F1·2-1에서 한다.

**6. 정리한다.** 서버를 끄고 연습 테이블을 지운다.

```bash
sqlp "DROP TABLE lesson_post, lesson_board"
```

## 일부러 틀려 보기

메시지는 Spring Boot 4.1.1 · Spring Data JPA 4.1.1 · Hibernate 7.4.5에서 재현한 원문이다. 할 때마다 1단계 `sqlp` 줄로 테이블을 새로 만든다.

**1. `@Enumerated(EnumType.STRING)`을 지운다** — 기본값은 `ORDINAL`(순번)이다.

```text
WARN  o.h.orm.jdbc.error : Value 'PUBLISHED' is outside of valid range for type java.lang.Byte
org.springframework.dao.DataIntegrityViolationException: Could not extract column [7] from JDBC ResultSet [Value 'PUBLISHED' is outside of valid range for type java.lang.Byte] [n/a]; SQL [n/a]
```

`findById(1L)`부터 터진다. `@Enumerated`가 없으면 Hibernate는 enum을 **순번**(`PUBLISHED`=0, `DRAFT`=1, `HIDDEN`=2)으로 읽고 쓴다. 열에 든 `'PUBLISHED'` 글자를 숫자로 읽으려다 실패했다. 새 글을 저장하면 `binding parameter (6:TINYINT) <- [DRAFT]`로 숫자 `1`을 넣으려다 `Check constraint 'lesson_post_chk_2' is violated.`로 막힌다. 이 테이블은 CHECK 제약 덕분에 바로 터졌다.

정말 무서운 건 **숫자 열에 처음부터 순번으로 저장해 온 경우**다. 터지지 않고 값이 조용히 바뀐다. 작은 테이블로 확인했다.

```bash
sqlp "CREATE TABLE lesson_ticket (id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY, status tinyint NOT NULL)"
```

```java
public enum TicketStatus { OPEN, CLOSED }

@Entity
@Table(name = "lesson_ticket")
public class LessonTicket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.ORDINAL)   // 순번(0, 1, 2…)으로 저장
    private TicketStatus status;

    protected LessonTicket() {}
    public LessonTicket(TicketStatus status) { this.status = status; }
    public Long getId() { return id; }
    public TicketStatus getStatus() { return status; }
}
```

| 순서 | 한 일 | 결과 |
|---|---|---|
| 1 | `save(new LessonTicket(TicketStatus.CLOSED))` | `insert into lesson_ticket (status) values (?)`, DB에는 `status = 1` |
| 2 | enum 맨 앞에 상태 하나 추가: `{ WAITING, OPEN, CLOSED }` | 코드만 바꿨다. DB는 그대로 `1` |
| 3 | 서버를 다시 켜고 `findAll()` | `티켓 1: OPEN` — **닫힌 티켓이 열렸다** |

순번 `1`의 뜻이 `CLOSED`에서 `OPEN`으로 바뀌었다. 에러도 경고도 없다. 그래서 상태 enum에는 늘 `@Enumerated(EnumType.STRING)`을 적는다. 문자열은 enum의 **이름**을 바꿀 때만 DB 값도 같이 고치면 된다. 다 보면 `sqlp "DROP TABLE lesson_ticket"`.

**2. `@Modifying`을 빼먹는다** — `@Query("update …")`만 남기고 트랜잭션 안에서 부른다.

```text
org.springframework.dao.InvalidDataAccessApiUsageException: Query executed via 'getResultList()' or 'getSingleResult()' must be a 'select' query [update LessonPost p set p.viewCount = p.viewCount + 1 where p.boardId = :boardId]
```

`@Modifying`이 없으면 Spring Data는 조회 쿼리로 보고 결과 목록을 받으려 한다. Hibernate가 "그 방법은 `select`만 된다"고 거절했다. 서버는 뜨고, **부를 때** 터진다.

**3. 트랜잭션 없이 벌크·이름 규칙 삭제를 부른다** — 서비스나 `TransactionTemplate` 없이 `posts.increaseViews(2L)`, `posts.deleteByBoardId(4L)`

```text
org.springframework.dao.InvalidDataAccessApiUsageException: No active transaction for update or delete query
org.springframework.dao.InvalidDataAccessApiUsageException: No EntityManager with actual transaction available for current thread - cannot reliably process 'remove' call
```

⑩에서 본 대로 직접 선언한 메서드에는 기본 트랜잭션이 없다. `@Modifying`도 트랜잭션을 만들어 주지 않는다. `deleteByBoardId`는 `select`까지는 나갔다가 지우는 단계에서 막혔다. 고치기·지우기는 `@Transactional`이 붙은 서비스 메서드 안에서 부른다.

**4. `@EnableJpaAuditing`을 빼먹는다** — 예시의 `AuditedPost`(나머지 필드는 `LessonPost`와 같고, 저장소는 `JpaRepository<AuditedPost, Long>`)로 새 글을 저장했더니 이렇게 나왔다.

```text
org.springframework.dao.DataIntegrityViolationException: not-null property references a null or transient value for entity org.example.e7.AuditedPost.createdAt
```

`@CreatedDate`는 표시일 뿐이고, 값을 채우는 일은 `@EnableJpaAuditing`이 켜 준다. 아무도 안 채운 `createdAt`이 `null`이라 `nullable = false`를 본 Hibernate가 `INSERT` 전에 막았다. 컴파일도 기동도 멀쩡해서 저장할 때 처음 알게 된다.

## 확인 문제

**1.** 아래 서비스 메서드는 `save`를 부르지 않는다. 제목이 DB에 저장되나? 저장된다면 `UPDATE`는 어느 시점에 나가나?

```java
@Transactional
public void rename(Long id, String title) {
    LessonPost post = posts.findById(id).orElseThrow();
    post.changeTitle(title);
    System.out.println("끝");
}
```

<details>
<summary>정답</summary>

저장된다. `findById`로 읽은 엔티티는 트랜잭션이 끝날 때까지 영속성 컨텍스트가 들고 있고, 커밋 직전에 읽었을 때의 사본과 비교해 달라진 것을 `UPDATE`로 보낸다. 그래서 `UPDATE`는 `끝`이 찍힌 **다음**, 커밋할 때 나간다(①의 로그 순서). 같은 값으로 바꿨다면 `UPDATE`는 아예 나가지 않는다(②).
</details>

**2.** 위 메서드에서 `@Transactional`을 지우고 `PATCH`로 불렀다. 응답 JSON의 제목과 DB의 제목은 각각 어떻게 되나? 왜 그런가?

<details>
<summary>정답</summary>

응답에는 **새 제목**, DB에는 **옛 제목**이다. 트랜잭션이 없으니 `findById`가 자기 트랜잭션을 열고 읽자마자 커밋하면서 영속성 컨텍스트도 닫힌다. 그 뒤 바꾼 값은 메모리의 객체에만 있고 비교해서 `UPDATE`를 보낼 주체가 없다. 에러도 없어서 응답만 보면 성공처럼 보인다. 수정 API는 DB를 다시 읽어 확인해야 한다.
</details>

**3.** `posts.deleteById(9999L)`(없는 번호)를 부르면 SQL이 몇 번 나가고, 무슨 일이 일어나나? "없는 글 삭제 → 404"를 만들려면?

<details>
<summary>정답</summary>

`select … where lp1_0.id=?` **한 번**만 나가고 끝난다. 예외 없이 조용히 지나간다. `deleteById`는 먼저 찾고, 찾았을 때만 지운다(있으면 `SELECT` 후 `DELETE`). 404가 필요하면 서비스에서 `findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, …))`로 먼저 확인하고 `delete(엔티티)`(또는 soft delete)를 한다.
</details>

**4.** 한 트랜잭션 안에서 글 5(조회수 36)를 읽은 뒤 `@Modifying` 벌크로 조회수를 +1 했다. 같은 트랜잭션에서 `posts.findById(5L)`을 다시 부르면 조회수는? `clearAutomatically = true`면?

<details>
<summary>정답</summary>

**36**이다. SQL도 나가지 않는다. 벌크 `UPDATE`는 영속성 컨텍스트를 거치지 않고 DB만 바꾸고, `findById`는 이미 들고 있는 엔티티를 돌려준다. `clearAutomatically = true`면 벌크 직후 컨텍스트를 비우므로 `findById`가 `SELECT`를 다시 보내 **37**을 읽는다. 단 비우면 아직 안 보낸 다른 테이블의 변경이 버려질 수 있어(⑬) 필요하면 `flushAutomatically = true`도 켠다.
</details>

**5.** `@Enumerated(EnumType.ORDINAL)`로 `CLOSED`(순번 1)를 저장한 뒤, enum 맨 앞에 `WAITING`을 추가했다. 그 행을 다시 읽으면? 그래서 무엇을 쓰나?

<details>
<summary>정답</summary>

**`OPEN`** 으로 읽힌다. DB에는 숫자 `1`만 있는데, 새 enum `{ WAITING, OPEN, CLOSED }`에서 1번은 `OPEN`이다. 에러도 없이 데이터의 뜻이 바뀐다. 그래서 `@Enumerated(EnumType.STRING)`으로 이름을 저장한다. `@Enumerated`를 아예 안 적어도 기본값이 `ORDINAL`이니 반드시 적는다.
</details>

## 더 깊이

- [S09 — 예제 2: 영속 상태 변경과 flush](../docs/knowledge/S09-jpa-hibernate.md#예제-2-영속-상태-변경과-flush) · [S09 — 엔티티 상태](../docs/knowledge/S09-jpa-hibernate.md#엔티티-상태) — 영속·준영속, `merge`
- [S10 — 감사 정보는 저장 이벤트의 메타데이터다](../docs/knowledge/S10-spring-data-query.md#감사-정보는-저장-이벤트의-메타데이터다) — Auditing, `@CreatedBy`와 `AuditorAware`
- [W11 트랜잭션은 왜 서비스 계층에 거나](../docs/knowledge/W11-why-tx-in-service.md) — G3와 함께
- 원문: [Spring Data JPA — Transactionality](https://docs.spring.io/spring-data/jpa/reference/jpa/transactions.html) — 물려받은 메서드의 기본 트랜잭션·`readOnly` · [Persisting Entities](https://docs.spring.io/spring-data/jpa/reference/jpa/entity-persistence.html) — `save`가 새 객체와 기존 객체를 가르는 법 · [Modifying Queries](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html#jpa.modifying-queries) — `@Modifying`·`clearAutomatically` · [`SimpleJpaRepository` 소스(4.1.x)](https://github.com/spring-projects/spring-data-jpa/blob/4.1.x/spring-data-jpa/src/main/java/org/springframework/data/jpa/repository/support/SimpleJpaRepository.java) — `deleteById`가 먼저 찾는 코드 · [Auditing](https://docs.spring.io/spring-data/jpa/reference/auditing.html) · [Hibernate ORM 사용자 가이드](https://docs.hibernate.org/orm/7.1/userguide/html_single/) — flush·dirty checking · [`@Enumerated`](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/Enumerated.html) · [`@CreationTimestamp`](https://docs.hibernate.org/orm/7.1/javadocs/org/hibernate/annotations/CreationTimestamp.html) · [`@UpdateTimestamp`](https://docs.hibernate.org/orm/7.1/javadocs/org/hibernate/annotations/UpdateTimestamp.html) · [`Optional.orElseThrow`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html)

## 다음

- 레슨: [G3. 트랜잭션 첫 만남](G3-first-transaction.md) — 오늘 `TX:` 로그로 본 "새로 열기·참여·커밋"과 롤백 규칙.
- 실습: [3-1. 부분 수정과 본인 확인](../scenario/ch3-update-delete/3-1-patch.md) — 변경 감지로 보낸 필드만 고친다.
- 실습: [3-2. 삭제 — soft delete](../scenario/ch3-update-delete/3-2-soft-delete.md) — `deleted_at`을 채우고, 글을 찾는 모든 길에서 거른다.
