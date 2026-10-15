package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DeclaredPostRepository extends Repository<Post, Long> {
    String FILTER = """
        from Post p join p.board b join p.author a
        where p.deletedAt is null and p.hiddenAt is null and p.status = 'PUBLISHED' and p.visibility = 'PUBLIC'
          and (:#{#f.boardSlug()} is null or b.slug = :#{#f.boardSlug()})
          and (:#{#f.authorId()} is null or a.id = :#{#f.authorId()})
          and (:#{#f.pattern()} is null or (lower(p.title) like lower(:#{#f.pattern()}) escape '!'
                                            or lower(p.content) like lower(:#{#f.pattern()}) escape '!'))
          and (:#{#f.tag()} is null or exists (select t.id from Post other join other.tags t where other.id = p.id and t.name = :#{#f.tag()}))
          and (:#{#f.from()} is null or p.createdAt >= :#{#f.from()})
          and (:#{#f.to()} is null or p.createdAt < :#{#f.to()})
        """;

    // JPQL은 post/board_id 같은 SQL 이름이 아니라 Post/board 같은 Java 이름을 쓴다.
    @Query(value = "select new org.example.querypractice.QueryPostRow(p.id, p.title, b.slug, a.id) " + FILTER,
           countQuery = "select count(p.id) " + FILTER)
    Page<QueryPostRow> search(@Param("f") SearchFilter filter, Pageable pageable);

    // 공개 글이 없는 게시판도 0으로 반환하려고 노출 조건을 WHERE 대신 ON에 둔다.
    @Query("""
        select new org.example.querypractice.BoardCountRow(b.slug, count(p.id))
        from Board b left join Post p on p.board = b and p.deletedAt is null and p.hiddenAt is null
             and p.status = 'PUBLISHED' and p.visibility = 'PUBLIC'
        group by b.slug order by b.slug
        """)
    List<BoardCountRow> boardCounts();
}
