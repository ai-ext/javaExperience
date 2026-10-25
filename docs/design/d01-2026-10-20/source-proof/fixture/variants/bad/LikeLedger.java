package example.lifecycle;

/** 의도적으로 중복 요청까지 더하는 추가 실패 표본이다. */
final class LikeLedger {
    private int likes;

    void like(long postId, long actorId) {
        likes++;
    }

    int count() {
        return likes;
    }
}
