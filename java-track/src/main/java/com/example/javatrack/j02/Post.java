package com.example.javatrack.j02;

/** 주어진 엔티티: 고치지 않는다. id는 {@link BaseEntity}가 가진다. */
public class Post extends BaseEntity {

    private String title;

    public Post(String title) {
        this.title = title;
    }

    public String getTitle() {
        return title;
    }

    public void changeTitle(String title) {
        this.title = title;
    }
}
