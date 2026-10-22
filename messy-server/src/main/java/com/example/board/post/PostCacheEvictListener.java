package com.example.board.post;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 글 변경이 커밋된 뒤에만 인기글 캐시를 지운다. 커밋 전에 지우면 그 사이 다른 요청이 아직 안 바뀐 DB 값을
 * 다시 적재해 TTL 동안 남고, 롤백되면 지울 이유가 없다.
 */
@Component
public class PostCacheEvictListener {

    private final PopularPostService popularPostService;

    public PostCacheEvictListener(PopularPostService popularPostService) {
        this.popularPostService = popularPostService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPostChanged(PostChangedEvent event) {
        popularPostService.evict();
    }
}
