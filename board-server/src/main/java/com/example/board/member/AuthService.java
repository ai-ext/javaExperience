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
    private final LoginAttemptLimiter loginAttemptLimiter;

    // 없는 이메일에도 해시 비교를 한 번 하도록 둔 더미 해시(응답 시간으로 이메일 존재를 추측하지 못하게)
    private final String dummyHash;

    public AuthService(MemberRepository memberRepository, PasswordEncoder passwordEncoder, JwtProvider jwtProvider,
            LoginAttemptLimiter loginAttemptLimiter) {
        this.memberRepository = memberRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
        this.loginAttemptLimiter = loginAttemptLimiter;
        this.dummyHash = passwordEncoder.encode("dummy-password");
    }

    // 트랜잭션을 두지 않는다. 실패 횟수 제한(Redis)을 트랜잭션 안에서 부르지 않기 위해서다. 조회는 저장소가 따로 연다.
    public TokenResponse login(LoginRequest request) {
        // 검증 전에 시도를 예약한다. 틀리면 예약한 1회가 그대로 실패로 남는다.
        loginAttemptLimiter.reserve(request.email());
        Member member = memberRepository.findByEmail(request.email()).orElse(null);
        boolean matches = passwordEncoder.matches(request.password(), member == null ? dummyHash : member.getPasswordHash());
        if (member == null || !matches) {
            // 없는 이메일도 같이 센다(예약에서 이미 셌다). 응답만으로 이메일이 있는지 알 수 없게 한다.
            // 이메일·비밀번호 중 무엇이 틀렸는지 알리지 않는다
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        loginAttemptLimiter.reset(request.email());
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
