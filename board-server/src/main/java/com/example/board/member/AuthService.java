package com.example.board.member;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.board.common.BusinessException;
import com.example.board.config.JwtProvider;
import com.example.board.common.ErrorCode;
import com.example.board.common.NicknameNormalizer;

@Service
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    // 없는 이메일에도 해시 비교를 한 번 하도록 둔 더미 해시(응답 시간으로 이메일 존재를 추측하지 못하게)
    private final String dummyHash;

    public AuthService(MemberRepository memberRepository, PasswordEncoder passwordEncoder, JwtProvider jwtProvider) {
        this.memberRepository = memberRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
        this.dummyHash = passwordEncoder.encode("dummy-password");
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        Member member = memberRepository.findByEmail(request.email()).orElse(null);
        boolean matches = passwordEncoder.matches(request.password(), member == null ? dummyHash : member.getPasswordHash());
        if (member == null || !matches) {
            // 이메일·비밀번호 중 무엇이 틀렸는지 알리지 않는다
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        return new TokenResponse(jwtProvider.issue(member.getId(), member.getRole()), "Bearer",
                jwtProvider.expiresInSeconds());
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
