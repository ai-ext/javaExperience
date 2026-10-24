package com.example.board.member;

/** 인증된 요청의 주체. 컨트롤러는 @AuthenticationPrincipal로 받는다. */
public record AuthMember(Long id, Role role) {
}
