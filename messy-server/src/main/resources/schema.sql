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
    -- 목록 조회용. 커서(id < ?)로 범위를 먼저 좁히고 status로 거른다
    KEY idx_post_id_status (id, status)
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

CREATE TABLE IF NOT EXISTS notification (
    id         BIGINT        NOT NULL AUTO_INCREMENT,
    member_id  BIGINT        NOT NULL,
    channel    VARCHAR(10)   NOT NULL,
    type       VARCHAR(20)   NOT NULL,
    title      VARCHAR(100)  NOT NULL,
    body       VARCHAR(1000) NOT NULL,
    ref_id     BIGINT        NULL,
    created_at DATETIME(6)   NOT NULL,
    updated_at DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_notification_member FOREIGN KEY (member_id) REFERENCES member (id),
    -- 내 알림함(IN_APP) 최신순 조회용
    KEY idx_notification_member_channel_id (member_id, channel, id)
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

CREATE TABLE IF NOT EXISTS shop_order (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    member_id        BIGINT       NOT NULL,
    item_id          BIGINT       NOT NULL,
    quantity         INT          NOT NULL,
    paid_amount      BIGINT       NOT NULL,
    member_coupon_id BIGINT       NULL,
    idempotency_key  VARCHAR(64)  NOT NULL,
    created_at       DATETIME(6)  NOT NULL,
    updated_at       DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_shop_order_member FOREIGN KEY (member_id) REFERENCES member (id),
    CONSTRAINT fk_shop_order_item FOREIGN KEY (item_id) REFERENCES shop_item (id),
    CONSTRAINT fk_shop_order_member_coupon FOREIGN KEY (member_coupon_id) REFERENCES member_coupon (id),
    -- 같은 멱등 키의 중복 주문을 막는 최종 방어선
    UNIQUE KEY uk_shop_order_member_key (member_id, idempotency_key)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS pg_payment (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    member_id       BIGINT      NOT NULL,
    order_id        VARCHAR(40) NOT NULL,
    amount          INT         NOT NULL,
    payment_key     VARCHAR(64) NULL,
    status          VARCHAR(10) NOT NULL,
    idempotency_key VARCHAR(64) NOT NULL,
    requested_at    DATETIME(6) NOT NULL,
    responded_at    DATETIME(6) NULL,
    created_at      DATETIME(6) NOT NULL,
    updated_at      DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_pg_payment_member FOREIGN KEY (member_id) REFERENCES member (id),
    -- 같은 멱등 키로 두 번 결제 요청을 남기지 않는 최종 방어선
    UNIQUE KEY uk_pg_payment_idempotency_key (idempotency_key),
    UNIQUE KEY uk_pg_payment_order_id (order_id),
    -- 승인 전에는 NULL이다. MySQL UNIQUE는 NULL 여러 개를 허용한다.
    UNIQUE KEY uk_pg_payment_payment_key (payment_key)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS report (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    post_id     BIGINT       NOT NULL,
    reporter_id BIGINT       NOT NULL,
    reason      VARCHAR(10)  NOT NULL,
    detail      VARCHAR(300) NULL,
    status      VARCHAR(10)  NOT NULL,
    created_at  DATETIME(6)  NOT NULL,
    updated_at  DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_report_post FOREIGN KEY (post_id) REFERENCES post (id),
    CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES member (id),
    -- 같은 회원의 재신고를 막는 최종 방어선. exists 조회만으로는 동시 요청이 모두 통과한다.
    UNIQUE KEY uk_report_post_reporter (post_id, reporter_id),
    -- 관리자 신고 목록(status 필터 + id 커서)용
    KEY idx_report_status_id (status, id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    actor_id    BIGINT       NOT NULL,
    action      VARCHAR(50)  NOT NULL,
    target_type VARCHAR(30)  NOT NULL,
    target_id   BIGINT       NULL,
    detail      VARCHAR(500) NULL,
    created_at  DATETIME(6)  NOT NULL,
    updated_at  DATETIME(6)  NOT NULL,
    -- 조회는 id 내림차순 커서뿐이라 PK 인덱스로 충분하다. 추가만 하고 수정·삭제하지 않는다.
    -- 회원·글 FK는 두지 않는다. 기록은 대상 행이 바뀌거나 지워져도 그대로 남아야 한다.
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
