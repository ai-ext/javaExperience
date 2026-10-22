package com.example.board.post;

import java.net.URI;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.board.member.AuthMember;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping
    public ResponseEntity<Void> create(@AuthenticationPrincipal AuthMember auth,
            @Valid @RequestBody PostCreateRequest request) {
        Long postId = postService.create(auth.id(), request);
        return ResponseEntity.created(URI.create("/api/posts/" + postId)).build();
    }

    @GetMapping("/{postId}")
    public PostDetailResponse detail(@PathVariable @Positive Long postId) {
        return postService.getDetail(postId);
    }
}
