package com.example.javatrack.j00;

import java.util.ArrayList;
import java.util.List;

/** 글을 담아 두는 게시판. 글 목록 필드는 직접 선언하고 초기화한다. */
public class PostBoard {

    // static이 아니라 인스턴스 필드여야 게시판마다 따로 가진다. 선언과 함께 초기화해 null을 막는다
    private final List<Post> posts = new ArrayList<>();

    public void add(Post post) {
        posts.add(post);
    }

    public Post get(int index) {
        return posts.get(index);
    }

    public int size() {
        return posts.size();
    }

    /** 일반 for(인덱스 i)로 좋아요 수를 모두 더한다. */
    public int totalLikes() {
        int total = 0;
        for (int i = 0; i < posts.size(); i++) {
            total += posts.get(i).getLikeCount();
        }
        return total;
    }

    /** 향상된 for로 제목을 담은 순서대로 모은다. */
    public List<String> titles() {
        List<String> titles = new ArrayList<>();
        for (Post post : posts) {
            titles.add(post.getTitle());
        }
        return titles;
    }
}
