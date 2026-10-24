package com.example.board.member;

public record TokenResponse(String accessToken, String tokenType, long expiresIn) {
}
