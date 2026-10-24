package com.example.board.comment;

import java.util.List;

public record CommentPage(List<CommentResponse> items, String nextCursor) {
}
