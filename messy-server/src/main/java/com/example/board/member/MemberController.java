package com.example.board.member;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberRepository memberRepository;

    public MemberController(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    // 내 정보는 회원 엔티티와 필드가 같아 응답 DTO를 따로 두지 않는다. 필드가 늘면 화면에도 바로 나온다.
    @GetMapping("/me")
    public Member me(@AuthenticationPrincipal AuthMember auth) {
        return memberRepository.findById(auth.id())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다."));
    }
}
