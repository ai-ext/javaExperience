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
