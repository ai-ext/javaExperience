package com.example.javatrack.j06;

/** 주어진 record: 고치지 않는다. 댓글 목록 한 줄. */
public record CommentRow(long id, long postId, String content) implements HasId {
}
