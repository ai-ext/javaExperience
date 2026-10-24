package com.example.javatrack.j06;

/** 주어진 record: 고치지 않는다. 글 목록 한 줄. */
public record PostRow(long id, String title, int likeCount) implements HasId {
}
