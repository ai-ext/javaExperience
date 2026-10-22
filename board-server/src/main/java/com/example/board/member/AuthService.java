package com.example.board.member;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;
import com.example.board.common.NicknameNormalizer;

@Service
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(MemberRepository memberRepository, PasswordEncoder passwordEncoder) {
        this.memberRepository = memberRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Long signup(SignupRequest request) {
        String nickname = NicknameNormalizer.normalize(request.nickname());
        if (memberRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.DUPLICATE, "이미 가입된 이메일입니다.");
        }
        if (memberRepository.existsByNickname(nickname)) {
            throw new BusinessException(ErrorCode.DUPLICATE, "이미 사용 중인 닉네임입니다.");
        }
        Member member = Member.create(request.email(), passwordEncoder.encode(request.password()), nickname, Role.USER);
        try {
            // 동시 가입은 UNIQUE 제약이 막는다. 즉시 flush해서 여기서 잡는다.
            return memberRepository.saveAndFlush(member).getId();
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.DUPLICATE, "이미 가입된 이메일 또는 닉네임입니다.");
        }
    }
}
