package com.example.javatrack.j05;

import java.util.List;

/** 주어진 엔티티: 고치지 않는다. 응답으로 그대로 내보내지 않고 DTO로 바꿔 내보낸다. */
public class Post {

    private final Long id;
    private final String title;
    private final String authorNickname;
    private final int likeCount;
    private final PostStatus status;
    private final List<String> tags;

    public Post(Long id, String title, String authorNickname, int likeCount, PostStatus status, List<String> tags) {
        this.id = id;
        this.title = title;
        this.authorNickname = authorNickname;
        this.likeCount = likeCount;
        this.status = status;
        this.tags = List.copyOf(tags);
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getAuthorNickname() {
        return authorNickname;
    }

    public int getLikeCount() {
        return likeCount;
    }

    public PostStatus getStatus() {
        return status;
    }

    public List<String> getTags() {
        return tags;
    }
}
