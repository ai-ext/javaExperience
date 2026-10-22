package com.example.board.post;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.session.SqlSessionFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.board.ApiTestSupport;
import com.example.board.common.BusinessException;
import com.example.board.common.CursorPage;
import com.example.board.common.ErrorCode;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PostQueryServiceTest extends ApiTestSupport {

    @Autowired
    PostQueryService service;

    @Autowired
    SqlSessionFactory sqlSessionFactory;

    Member author;

    @BeforeEach
    void setUp() {
        clearPosts();
        author = newMember(Role.USER);
    }

    PostSearchCondition none() {
        return new PostSearchCondition(null, null);
    }

    @Test
    void 스물한_건이면_첫_쪽_20건과_nextCursor_둘째_쪽_1건과_null() {
        for (int i = 0; i < 21; i++) {
            insertPost(author, "제목" + i, "내용", "ACTIVE");
        }

        CursorPage<PostSummary> first = service.search(none(), null, 20);
        assertThat(first.items()).hasSize(20);
        assertThat(first.nextCursor()).isNotNull();

        CursorPage<PostSummary> second = service.search(none(), first.nextCursor(), 20);
        assertThat(second.items()).hasSize(1);
        assertThat(second.nextCursor()).isNull();
        assertThat(second.items().get(0).getId()).isLessThan(first.items().get(19).getId());
    }

    @Test
    void 정확히_size건이면_nextCursor는_null() {
        for (int i = 0; i < 20; i++) {
            insertPost(author, "제목" + i, "내용", "ACTIVE");
        }

        assertThat(service.search(none(), null, 20).nextCursor()).isNull();
    }

    @Test
    void 숨김_삭제_글은_제외한다() {
        insertPost(author, "보임", "내용", "ACTIVE");
        insertPost(author, "숨김", "내용", "HIDDEN");
        insertPost(author, "삭제", "내용", "DELETED");

        assertThat(service.search(none(), null, 20).items()).extracting(PostSummary::getTitle).containsExactly("보임");
    }

    @Test
    void keyword는_제목과_본문을_검색하고_tag는_그_태그의_글만_거른다() {
        Long a = insertPost(author, "스프링 입문", "내용", "ACTIVE");
        insertPost(author, "자바", "스프링 본문", "ACTIVE");
        insertPost(author, "다른글", "다른내용", "ACTIVE");
        attachTag(a, "spring");
        attachTag(a, "java");

        assertThat(service.search(new PostSearchCondition("스프링", null), null, 20).items()).hasSize(2);
        List<PostSummary> byTag = service.search(new PostSearchCondition(null, "spring"), null, 20).items();
        assertThat(byTag).hasSize(1);
        // 필터로 쓴 태그 말고 그 글의 태그가 모두 나와야 한다
        assertThat(byTag.get(0).getTags()).containsExactly("spring", "java");
        assertThat(service.search(new PostSearchCondition("스프링", "java"), null, 20).items()).hasSize(1);
    }

    @Test
    void LIKE_와일드카드는_글자_그대로_검색한다() {
        insertPost(author, "100% 보장", "내용", "ACTIVE");
        insertPost(author, "아무 글", "내용", "ACTIVE");

        assertThat(service.search(new PostSearchCondition("%%", null), null, 20).items()).isEmpty();
        assertThat(service.search(new PostSearchCondition("0% ", null), null, 20).items()).hasSize(1);
    }

    @Test
    void 잘못된_cursor는_VALIDATION() {
        assertThatThrownBy(() -> service.search(none(), "!!not-base64!!", 20))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.VALIDATION));
        // 숫자가 아닌 값, 0 이하도 서버가 준 적 없는 커서다
        String notNumber = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString("abc".getBytes());
        assertThatThrownBy(() -> service.search(none(), notNumber, 20)).isInstanceOf(BusinessException.class);
        String zero = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString("0".getBytes());
        assertThatThrownBy(() -> service.search(none(), zero, 20)).isInstanceOf(BusinessException.class);
    }

    @Test
    void keyword와_tag가_없으면_그_조건이_SQL에서_빠진다() {
        String id = "com.example.board.post.PostQueryMapper.search";
        Map<String, Object> params = new HashMap<>();
        params.put("cond", none());
        params.put("afterId", null);
        params.put("limit", 21);
        String bare = sqlSessionFactory.getConfiguration().getMappedStatement(id).getBoundSql(params).getSql();
        assertThat(bare).doesNotContain("LIKE").doesNotContain("EXISTS").doesNotContain("p.id <").doesNotContain("id <");

        params.put("cond", new PostSearchCondition("스프링", "spring"));
        params.put("afterId", 5L);
        String full = sqlSessionFactory.getConfiguration().getMappedStatement(id).getBoundSql(params).getSql();
        assertThat(full).contains("LIKE").contains("EXISTS").contains("id <");
    }
}
