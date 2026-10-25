package example.lifecycle;

import java.util.HashSet;
import java.util.Set;

/** 추가 메모리 정책이다. DB UNIQUE나 실제 서비스 동시성 구현이 아니다. */
final class LikeLedger {
    private final Set<String> likes = new HashSet<>();

    void like(long postId, long actorId) {
        likes.add(postId + ":" + actorId);
    }

    int count() {
        return likes.size();
    }
}
