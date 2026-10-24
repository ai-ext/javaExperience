package com.example.board.member;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank @Email @Size(max = 100) String email,
        @NotBlank @Size(min = 8, max = 64)
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).*$", message = "영문과 숫자를 각 1자 이상 포함해야 합니다") String password,
        @NotBlank @Pattern(regexp = "^[가-힣A-Za-z0-9]{2,20}$", message = "2~20자의 한글·영문·숫자만 가능합니다") String nickname) {
}
