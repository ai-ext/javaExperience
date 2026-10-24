package com.example.javatrack.j05;

/** 글 목록 응답 한 줄. 엔티티에서 필요한 값만 복사해 담는다. */
public record PostResponse(long id, String title, String author, int tagCount) {

    /** 엔티티 하나를 응답 하나로 바꾼다. author는 작성자 닉네임, tagCount는 태그 수. */
    public static PostResponse from(Post post) {
        return new PostResponse(post.getId(), post.getTitle(), post.getAuthorNickname(), post.getTags().size());
    }
}
