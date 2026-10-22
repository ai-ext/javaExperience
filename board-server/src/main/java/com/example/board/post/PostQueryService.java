package com.example.board.post;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.board.common.CursorPage;

@Service
public class PostQueryService {

    private final PostQueryMapper mapper;

    public PostQueryService(PostQueryMapper mapper) {
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public CursorPage<PostSummary> search(PostSearchCondition condition, String cursor, int size) {
        Long afterId = CursorPage.decode(cursor);
        PostSearchCondition safe = new PostSearchCondition(escapeLike(condition.keyword()), condition.tag());
        // 한 건 더 읽어 다음 쪽이 있는지만 판단한다
        List<PostSummary> rows = mapper.search(safe, afterId, size + 1);
        boolean hasNext = rows.size() > size;
        List<PostSummary> page = hasNext ? rows.subList(0, size) : rows;
        String next = hasNext ? CursorPage.encode(page.get(page.size() - 1).getId()) : null;
        return new CursorPage<>(page, next);
    }

    /** 사용자가 넣은 %·_가 와일드카드로 해석되지 않게 한다. */
    private static String escapeLike(String keyword) {
        return keyword == null ? null : keyword.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
