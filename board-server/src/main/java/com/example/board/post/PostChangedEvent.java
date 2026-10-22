package com.example.board.post;

/** 글이 만들어지거나 고쳐지거나 지워졌다. 인기글 캐시를 비우는 신호다. */
public record PostChangedEvent(Long postId) {
}
