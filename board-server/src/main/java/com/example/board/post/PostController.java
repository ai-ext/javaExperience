package com.example.board.post;

import java.net.URI;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.board.common.CursorPage;
import com.example.board.member.AuthMember;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;
    private final PostQueryService postQueryService;
    private final PopularPostService popularPostService;

    public PostController(PostService postService, PostQueryService postQueryService,
            PopularPostService popularPostService) {
        this.postService = postService;
        this.postQueryService = postQueryService;
        this.popularPostService = popularPostService;
    }

    @PostMapping
    public ResponseEntity<Void> create(@AuthenticationPrincipal AuthMember auth,
            @Valid @RequestBody PostCreateRequest request) {
        Long postId = postService.create(auth.id(), request);
        return ResponseEntity.created(URI.create("/api/posts/" + postId)).build();
    }

    @GetMapping
    public CursorPage<PostSummary> list(@Valid PostListRequest request) {
        return postQueryService.search(request.toCondition(), request.cursor(), request.size());
    }

    // 문자 그대로인 경로가 /{postId} 패턴보다 먼저 매치된다
    @GetMapping("/popular")
    public CursorPage<PopularPost> popular(@Valid PopularPostRequest request) {
        return popularPostService.page(request.cursor(), request.size());
    }

    @GetMapping("/{postId}")
    public PostDetailResponse detail(@PathVariable @Positive Long postId) {
        return postService.getDetail(postId);
    }

    @PutMapping("/{postId}")
    public PostDetailResponse update(@AuthenticationPrincipal AuthMember auth, @PathVariable @Positive Long postId,
            @Valid @RequestBody PostUpdateRequest request) {
        return postService.update(postId, auth.id(), request);
    }

    @PatchMapping("/{postId}")
    public PostDetailResponse patch(@AuthenticationPrincipal AuthMember auth, @PathVariable @Positive Long postId,
            @Valid @RequestBody PostPatchRequest request) {
        return postService.patch(postId, auth.id(), request);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthMember auth, @PathVariable @Positive Long postId) {
        postService.delete(postId, auth.id());
        return ResponseEntity.noContent().build();
    }
}
