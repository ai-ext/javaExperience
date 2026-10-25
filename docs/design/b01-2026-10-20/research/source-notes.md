# 출처 메모 — B01 검증

확인일: 2026-10-20. 조사 범위는 공개 공식 OWASP, Redis, Oracle JDK, Spring 문서/공식 릴리스 저장소다. 브라우징으로 페이지 본문 또는 공식 저장소 조회 결과를 확인했다. 실제 서비스 호출, mail/SMS 발송, Redis 실행, 다운로드·컴파일은 하지 않았다.

- OWASP Forgot Password: 일관된 본문 및 응답 시간, 과도한 자동 요청 방지, URL host/HTTPS, `no-referrer`, token 강도·보관·1회 사용·만료, reset 후 세션 무효화를 확인. 비용 숫자·최대 발송비 한도나 시간 동등성 측정값은 제시하지 않는다.
- Redis INCR/Lua: 분리 INCR/EXPIRE 중단 race와 script 결합 예시 확인. Lua 원자 실행의 비개입 의미는 확인했으나, 오류 시 전체 rollback 의미로 읽지 않는다. 첫 증가 시 EXPIRE는 fixed window다.
- Oracle `SecureRandom`: 암호학적 강도 및 비결정 출력 요구 확인. 테스트 대역의 운영 보안성은 증명하지 않는다.
- Spring Boot 4.1.1 coordinates: `spring-security-*` 7.1.1 확인. Spring Security 7.1.1 password storage 및 authentication events 문서 확인.
- Redis release: 공식 GitHub release 목록은 8.10.2를 2026-09-17 공개, latest 표시로 노출. 공식 `redis-hashes`가 8.10.2 tarball SHA-256 제공. 선택 버전: 8.10.2; URL `https://download.redis.io/releases/redis-8.10.2.tar.gz`; SHA-256 `b9ffee226b5eecdba98a679260dad764b2a4ebd90dce4ad5ac9e9f3eef9c02b3`.

제한: 동적 문서의 현재 상태·표시 내용은 확인일에 관찰한 값이다. 라이선스 적합성, 로컬 빌드 성공, 실제 보안성, 운영 환경 성능은 조사 범위 밖이다. 다음 Redis 명령 실험은 메인의 별도 실행 대상이며 여기서 실행한 것으로 간주하지 않는다.
