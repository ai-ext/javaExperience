package com.example.javatrack.j00;

/** 값 전달 연습. Java는 언제나 값을 복사해서 넘긴다 — 기본형은 값을, 객체는 참조(주소)를. */
public final class ValuePassing {

    private ValuePassing() {
    }

    /** 매개변수 likeCount에 1을 더해 다시 대입하고, 대입한 값을 돌려준다. */
    public static int likeInside(int likeCount) {
        // 바뀌는 것은 복사된 값(매개변수)뿐이다. 호출한 쪽 변수는 그대로다
        likeCount = likeCount + 1;
        return likeCount;
    }

    /** 받은 글에 좋아요를 두 번 누른다. */
    public static void likeTwice(Post post) {
        // 복사된 참조도 같은 객체를 가리키므로 호출한 쪽에서도 바뀐 값이 보인다
        post.like();
        post.like();
    }

    /** 매개변수 post에 새 글(제목 newTitle, 좋아요 0)을 대입하고, 대입한 글을 돌려준다. */
    public static Post replaceInside(Post post, String newTitle) {
        // 매개변수가 새 객체를 가리키게 될 뿐, 호출한 쪽 변수는 여전히 원래 글을 가리킨다
        post = new Post(newTitle, 0);
        return post;
    }
}
