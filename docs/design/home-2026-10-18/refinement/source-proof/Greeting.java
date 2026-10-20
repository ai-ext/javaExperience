package org.example.start;

// 응답 JSON의 모양. 구성 요소 이름(name·message·nameLength)이 그대로 JSON 키가 된다
public record Greeting(String name, String message, int nameLength) {
}
