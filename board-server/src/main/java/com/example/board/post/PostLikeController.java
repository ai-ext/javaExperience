package com.example.board.post;

import jakarta.validation.constraints.Positive;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.board.member.AuthMember;

@RestController
public class PostLikeController {

    private final PostLikeService postLikeService;

    public PostLikeController(PostLikeService postLikeService) {
        this.postLikeService = postLikeService;
    }

    @PutMapping("/api/posts/{postId}/like")
    public ResponseEntity<Void> like(@AuthenticationPrincipal AuthMember auth, @PathVariable @Positive Long postId) {
        postLikeService.like(postId, auth.id());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/posts/{postId}/like")
    public ResponseEntity<Void> unlike(@AuthenticationPrincipal AuthMember auth, @PathVariable @Positive Long postId) {
        postLikeService.unlike(postId, auth.id());
        return ResponseEntity.noContent().build();
    }
}
