package com.example.javatrack.j10;

/** 주어진 예외: 고치지 않는다. 숨길 글이 없다. */
public class PostNotFoundException extends RuntimeException {

    public PostNotFoundException(Long postId) {
        super("글을 찾을 수 없습니다: " + postId);
    }
}
