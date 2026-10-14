package org.example.querypractice;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.example.post.QPost;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional(readOnly = true)
public class QuerydslPostRepository {
    private final JPAQueryFactory query;
    public QuerydslPostRepository(EntityManager em) { this.query = new JPAQueryFactory(em); }

    public QueryPage search(SearchFilter filter) {
        QPost p = QPost.post;
        BooleanBuilder where = new BooleanBuilder(p.deletedAt.isNull().and(p.hiddenAt.isNull())
                .and(p.status.eq("PUBLISHED")).and(p.visibility.eq("PUBLIC")));
        if (filter.boardSlug() != null) where.and(p.board.slug.eq(filter.boardSlug()));
        if (filter.authorId() != null) where.and(p.author.id.eq(filter.authorId()));
        if (filter.pattern() != null) {
            // 공개 조건 AND (제목 OR 본문)으로 묶어야 숨김 글이 OR 뒤로 새지 않는다.
            // 패턴도 DB LOWER로 변환한다. Java Locale.ROOT는 İ 같은 문자를 MySQL LOWER와 다르게 변환한다.
            var pattern = Expressions.stringTemplate("lower({0})", Expressions.constant(filter.pattern()));
            where.and(p.title.lower().like(pattern, '!').or(p.content.lower().like(pattern, '!')));
        }
        if (filter.tag() != null) where.and(p.tags.any().name.eq(filter.tag()));
        if (filter.from() != null) where.and(p.createdAt.goe(filter.from()));
        if (filter.to() != null) where.and(p.createdAt.lt(filter.to()));
        var rows = query.select(Projections.constructor(QueryPostRow.class, p.id, p.title, p.board.slug, p.author.id))
                .from(p).where(where);
        if (filter.sort().equals("likes")) rows.orderBy(p.likeCount.desc(), p.id.desc());
        else rows.orderBy(p.id.desc());
        var items = rows.offset(filter.offset()).limit(filter.size()).fetch();
        Long total = query.select(p.id.count()).from(p).where(where).fetchOne();
        return new QueryPage(items, filter.page(), filter.size(), total == null ? 0 : total);
    }
}
