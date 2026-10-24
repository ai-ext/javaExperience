# 기능 구현 학습 공백 감사

18개 항목. P0는 Controller/DTO 다음 구현을 막는 핵심 연결 또는 참조 코드 정확성 검증, P1은 기본 CRUD와 관계 업무 완성, P2는 이후 심화다. 번호는 추천 학습 순서 자체가 아니다.

추천 순서: I01→I03→I02→I10→I08→I12→I14→I13→I04→I05→I06→I07→I11→I15→I09→I18→I16→I17. 테스트는 각 단계에 포함하며 I15는 테스트 설계 방식의 독립 정리다.

- I01 P0: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I01-Controller-다음의-Service-설계.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I01-Controller-다음의-Service-설계.md`)
- I02 P0: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I02-한-요청의-트랜잭션-경계와-실패-뒤-상태.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I02-한-요청의-트랜잭션-경계와-실패-뒤-상태.md`)
- I03 P0: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I03-게시글-생성.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I03-게시글-생성.md`)
- I04 P1: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I04-상세-조회.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I04-상세-조회.md`)
- I05 P1: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I05-목록.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I05-목록.md`)
- I06 P1: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I06-PATCH와-PUT.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I06-PATCH와-PUT.md`)
- I07 P1: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I07-Soft-delete와-관계-데이터-수명.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I07-Soft-delete와-관계-데이터-수명.md`)
- I08 P0: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I08-좋아요-모델.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I08-좋아요-모델.md`)
- I09 P0: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I09-좋아요-동시성.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I09-좋아요-동시성.md`)
- I10 P0: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I10-댓글-작성으로-1.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I10-댓글-작성으로-1.md`)
- I11 P1: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I11-답글-2단계와-평평한-행에서-트리-응답-조립.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I11-답글-2단계와-평평한-행에서-트리-응답-조립.md`)
- I12 P0: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I12-태그-N.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I12-태그-N.md`)
- I13 P0: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I13-인증과-업무-권한.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I13-인증과-업무-권한.md`)
- I14 P0: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I14-입력·업무·DB-오류를-HTTP-계약으로-번역.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I14-입력·업무·DB-오류를-HTTP-계약으로-번역.md`)
- I15 P0: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I15-테스트-작성.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I15-테스트-작성.md`)
- I16 P1: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I16-스키마-제약과-마이그레이션.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I16-스키마-제약과-마이그레이션.md`)
- I17 P2: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I17-이벤트·비동기·outbox.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I17-이벤트·비동기·outbox.md`)
- I18 P1: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I18-관계-업무-확장.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/implementation/I18-관계-업무-확장.md`)

이 담당자는 정적 감사를 수행했다. 메인 담당자의 이번 격리 실행 결과를 읽어 I03/I08/I09/I14/I15에 별도 반영했다. 4-2 동시 DELETE 100호출은 정합성을 유지했고, 기본 TransactionTemplate의 외부tx 참여도 실측됐다. 기존 기록과 이번 메인 실행을 구분했다.
