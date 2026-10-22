package com.example.javatrack.j00;

/** 값 전달 연습. Java는 언제나 값을 복사해서 넘긴다 — 기본형은 값을, 객체는 참조(주소)를. */
public final class ValuePassing {

    private ValuePassing() {
    }

    /** 매개변수 likeCount에 1을 더해 다시 대입하고, 대입한 값을 돌려준다. */
    public static int likeInside(int likeCount) {
        throw new UnsupportedOperationException("J00: ValuePassing.likeInside — 매개변수에 1을 더해 대입하고 그 값을 돌려주세요");
    }

    /** 받은 글에 좋아요를 두 번 누른다. */
    public static void likeTwice(Post post) {
        throw new UnsupportedOperationException("J00: ValuePassing.likeTwice — 받은 글의 like()를 두 번 부르세요");
    }

    /** 매개변수 post에 새 글(제목 newTitle, 좋아요 0)을 대입하고, 대입한 글을 돌려준다. */
    public static Post replaceInside(Post post, String newTitle) {
        throw new UnsupportedOperationException("J00: ValuePassing.replaceInside — 매개변수 post에 새 Post를 대입하고 그 글을 돌려주세요");
    }
}
