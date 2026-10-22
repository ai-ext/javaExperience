package com.example.javatrack.j00;

/**
 * 주어진 클래스: 고치지 않는다.
 * 값 전달을 눈으로 확인하려고 좋아요 수를 {@link #like()}로 바꿀 수 있게 열어 두었다.
 */
public class Post {

    private final String title;
    private int likeCount;

    public Post(String title, int likeCount) {
        this.title = title;
        this.likeCount = likeCount;
    }

    public String getTitle() {
        return title;
    }

    public int getLikeCount() {
        return likeCount;
    }

    public void like() {
        likeCount++;
    }
}
