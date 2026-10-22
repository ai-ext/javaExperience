package com.example.board.admin;

import com.example.board.post.PostStatus;

public record HidePostResponse(Long postId, PostStatus status, Long reportId) {
}
