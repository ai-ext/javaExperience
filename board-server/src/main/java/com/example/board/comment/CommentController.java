package com.example.board.comment;

import java.net.URI;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.board.member.AuthMember;

@RestController
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping("/api/posts/{postId}/comments")
    public ResponseEntity<CommentResponse> create(@AuthenticationPrincipal AuthMember auth,
            @PathVariable @Positive Long postId, @Valid @RequestBody CommentRequest request) {
        CommentResponse body = commentService.create(postId, auth.id(), request.content());
        return ResponseEntity.created(URI.create("/api/comments/" + body.id())).body(body);
    }

    @GetMapping("/api/posts/{postId}/comments")
    public CommentPage list(@PathVariable @Positive Long postId, @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int size) {
        return commentService.list(postId, cursor, size);
    }

    @DeleteMapping("/api/comments/{commentId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthMember auth,
            @PathVariable @Positive Long commentId) {
        commentService.delete(commentId, auth.id(), auth.role());
        return ResponseEntity.noContent().build();
    }
}
