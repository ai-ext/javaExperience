package com.example.javatrack.j06;

/** 주어진 예외: 고치지 않는다. 전역 예외 처리기가 404로 바꾸는 예외라고 생각한다. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String target, long id) {
        super("찾을 수 없습니다: " + target + " id=" + id);
    }
}
