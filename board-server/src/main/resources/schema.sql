-- 스키마는 이 파일 하나로 관리한다 (Flyway 미사용). 재기동해도 실행되므로 IF NOT EXISTS를 쓴다.

CREATE TABLE IF NOT EXISTS banned_word (
    id   BIGINT       NOT NULL AUTO_INCREMENT,
    word VARCHAR(50)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_banned_word_word (word)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS common_code (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    group_code VARCHAR(30)  NOT NULL,
    code       VARCHAR(30)  NOT NULL,
    name       VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_common_code_group_code (group_code, code)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS member (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    email         VARCHAR(100) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    nickname      VARCHAR(20)  NOT NULL,
    role          VARCHAR(10)  NOT NULL,
    point_balance BIGINT       NOT NULL DEFAULT 0,
    created_at    DATETIME(6)  NOT NULL,
    updated_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    -- 동시 가입의 최종 방어선. existsBy 조회만으로는 두 요청이 모두 통과한다.
    UNIQUE KEY uk_member_email (email),
    UNIQUE KEY uk_member_nickname (nickname)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
