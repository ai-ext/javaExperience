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

CREATE TABLE IF NOT EXISTS post (
    id         BIGINT        NOT NULL AUTO_INCREMENT,
    member_id  BIGINT        NOT NULL,
    title      VARCHAR(100)  NOT NULL,
    content    VARCHAR(5000) NOT NULL,
    status     VARCHAR(10)   NOT NULL,
    like_count INT           NOT NULL DEFAULT 0,
    created_at DATETIME(6)   NOT NULL,
    updated_at DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_post_member FOREIGN KEY (member_id) REFERENCES member (id),
    -- 목록 조회(status 필터 + id 커서)용
    KEY idx_post_status_id (status, id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS tag (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    name       VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_tag_name (name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS post_tag (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    post_id    BIGINT      NOT NULL,
    tag_id     BIGINT      NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_post_tag_post FOREIGN KEY (post_id) REFERENCES post (id),
    CONSTRAINT fk_post_tag_tag FOREIGN KEY (tag_id) REFERENCES tag (id),
    UNIQUE KEY uk_post_tag_post_tag (post_id, tag_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS comment (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    post_id    BIGINT       NOT NULL,
    member_id  BIGINT       NOT NULL,
    content    VARCHAR(500) NOT NULL,
    deleted    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at DATETIME(6)  NOT NULL,
    updated_at DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES post (id),
    CONSTRAINT fk_comment_member FOREIGN KEY (member_id) REFERENCES member (id),
    -- 글별 댓글 목록(id 커서)용
    KEY idx_comment_post_id (post_id, id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS post_like (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    post_id    BIGINT      NOT NULL,
    member_id  BIGINT      NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_post_like_post FOREIGN KEY (post_id) REFERENCES post (id),
    CONSTRAINT fk_post_like_member FOREIGN KEY (member_id) REFERENCES member (id),
    -- 동시 좋아요의 최종 방어선. "조회 후 없으면 저장"만으로는 두 요청이 모두 통과한다.
    UNIQUE KEY uk_post_like_post_member (post_id, member_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS point_ledger (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    member_id     BIGINT      NOT NULL,
    type          VARCHAR(10) NOT NULL,
    -- 적립은 양수, 차감은 음수. 합계가 member.point_balance와 같아야 한다.
    amount        BIGINT      NOT NULL,
    balance_after BIGINT      NOT NULL,
    ref_type      VARCHAR(30) NOT NULL,
    ref_id        BIGINT      NULL,
    created_at    DATETIME(6) NOT NULL,
    updated_at    DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_point_ledger_member FOREIGN KEY (member_id) REFERENCES member (id),
    -- 이력 목록(id 커서)용. 행은 추가만 하고 수정·삭제하지 않는다.
    KEY idx_point_ledger_member_id (member_id, id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS coupon (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    name            VARCHAR(100) NOT NULL,
    total_quantity  INT          NOT NULL,
    issued_quantity INT          NOT NULL DEFAULT 0,
    expires_at      DATETIME(6)  NOT NULL,
    created_at      DATETIME(6)  NOT NULL,
    updated_at      DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    -- 총 수량 초과 발급의 최종 방어선
    CONSTRAINT ck_coupon_issued CHECK (issued_quantity >= 0 AND issued_quantity <= total_quantity)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS member_coupon (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    coupon_id  BIGINT      NOT NULL,
    member_id  BIGINT      NOT NULL,
    status     VARCHAR(10) NOT NULL,
    used_at    DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_member_coupon_coupon FOREIGN KEY (coupon_id) REFERENCES coupon (id),
    CONSTRAINT fk_member_coupon_member FOREIGN KEY (member_id) REFERENCES member (id),
    -- 1인 1매의 최종 방어선. "이미 받았나" 조회만으로는 두 요청이 모두 통과한다.
    UNIQUE KEY uk_member_coupon_coupon_member (coupon_id, member_id),
    -- 내 쿠폰 목록용
    KEY idx_member_coupon_member (member_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS shop_item (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    price      BIGINT       NOT NULL,
    stock      INT          NOT NULL,
    created_at DATETIME(6)  NOT NULL,
    updated_at DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    -- 재고 음수의 최종 방어선
    CONSTRAINT ck_shop_item_stock CHECK (stock >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
