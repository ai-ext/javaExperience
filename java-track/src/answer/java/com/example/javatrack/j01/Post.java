package com.example.javatrack.j01;

import java.util.ArrayList;
import java.util.Collections;
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

    private final String title;
    private final List<String> tags;

    public Post(String title, List<String> tags) {
        this.title = title;
        // 방어적 복사: 받은 리스트와 연결을 끊는다. 받은 것이 List.of()여도 내 리스트는 add할 수 있다
        this.tags = new ArrayList<>(tags);
    }

    public String getTitle() {
        return title;
    }

    public List<String> getTags() {
        // 읽기 전용 뷰를 내준다. 밖에서 add하면 UnsupportedOperationException
        return Collections.unmodifiableList(tags);
    }

    public void addTag(String tag) {
        tags.add(tag);
    }
}
