package com.example.board.post;

/** 검색 조건. null이면 그 조건은 SQL에서 빠진다. 정렬은 latest(id DESC) 하나뿐이라 값으로 받지 않는다. */
public record PostSearchCondition(String keyword, String tag) {
}
