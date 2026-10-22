package com.example.javatrack.j01;

import java.util.List;

/**
 * 태그를 가진 글. 태그 목록은 이 클래스의 {@link #addTag}로만 바뀌어야 한다.
 * <ul>
 *   <li>생성자에 넘긴 리스트를 밖에서 바꿔도 글의 태그는 그대로다</li>
 *   <li>{@link #getTags()}로 받은 리스트는 고칠 수 없다(고치려 하면 UnsupportedOperationException)</li>
 *   <li>생성자에 {@code List.of()}를 넘겨도 {@link #addTag}가 된다</li>
 * </ul>
 */
public class Post {

    // TODO: 제목·태그 목록 필드를 선언하세요

    public Post(String title, List<String> tags) {
        throw new UnsupportedOperationException("J01: Post 생성자 — 받은 태그 리스트를 복사해서 담으세요");
    }

    public String getTitle() {
        throw new UnsupportedOperationException("J01: Post.getTitle — 제목을 돌려주세요");
    }

    public List<String> getTags() {
        throw new UnsupportedOperationException("J01: Post.getTags — 밖에서 고칠 수 없는 태그 목록을 돌려주세요");
    }

    public void addTag(String tag) {
        throw new UnsupportedOperationException("J01: Post.addTag — 태그 목록에 더하세요");
    }
}
