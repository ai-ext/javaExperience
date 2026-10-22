package com.example.javatrack.j01;

import java.util.List;

/**
 * 주어진 함정 코드: 고치지 않는다. {@link Post}와 비교하려고 둔다.
 * 받은 리스트를 그대로 필드에 담고, getter로 그 리스트를 그대로 내준다.
 */
public class LeakyPost {

    private final String title;
    private final List<String> tags;

    public LeakyPost(String title, List<String> tags) {
        this.title = title;
        this.tags = tags;
    }

    public String getTitle() {
        return title;
    }

    public List<String> getTags() {
        return tags;
    }

    public void addTag(String tag) {
        tags.add(tag);
    }
}
