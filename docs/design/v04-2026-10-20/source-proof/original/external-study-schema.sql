-- 클라이언트 문자셋을 고정한다. 없으면 mysql 클라이언트 기본값(latin1 등)으로 한글이 이중 인코딩돼 저장된다(회원 → íšŒì›).
SET NAMES utf8mb4;
DROP DATABASE IF EXISTS ds_practice;
CREATE DATABASE ds_practice CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE ds_practice;

-- 상태는 CHECK 가능한 문자열로 두어 SQL 연습에서 상태 전이를 직접 다룬다.
CREATE TABLE member (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  login_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  member_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT ck_member_status CHECK (member_status IN ('ACTIVE','SUSPENDED','WITHDRAWN')),
  KEY ix_member_status_created (member_status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='원본: E1 CUSTOMER_USER_TBL, E2 MEMBER, E3 MEMBER, E6 MEMBER_MASTER; Y/N·문자열 식별자를 정규화';

CREATE TABLE category (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  parent_id BIGINT NULL,
  name VARCHAR(100) NOT NULL,
  depth TINYINT NOT NULL,
  sort_order INT NOT NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES category(id),
  CONSTRAINT ck_category_depth CHECK (depth IN (1,2)),
  KEY ix_category_parent_sort (parent_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='원본: E2 Category/ProdCategory, E4 category/new_category, E5 tb_content_category; 2단계 계층';

CREATE TABLE product (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT NOT NULL,
  name VARCHAR(160) NOT NULL,
  product_type VARCHAR(20) NOT NULL DEFAULT 'GOODS',
  price DECIMAL(12,0) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  sale_status VARCHAR(20) NOT NULL DEFAULT 'ON_SALE',
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES category(id),
  CONSTRAINT ck_product_type CHECK (product_type IN ('GOODS','MAGAZINE','EBOOK','CARTOON')),
  CONSTRAINT ck_product_sale_status CHECK (sale_status IN ('ON_SALE','SOLD_OUT','HIDDEN')),
  CONSTRAINT ck_product_price_stock CHECK (price >= 0 AND stock >= 0),
  KEY ix_product_category_sale (category_id, sale_status, created_at),
  -- L4 재료: 인덱스 없음 (name 검색 컬럼)
  KEY ix_product_stock (stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='원본: E2 ProdMst, E4 prod, E5 tb_ebook/tb_ecartoon; 재고·판매상태를 타입화';

CREATE TABLE product_option (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  option_name VARCHAR(100) NOT NULL,
  extra_price DECIMAL(12,0) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_product_option_product FOREIGN KEY (product_id) REFERENCES product(id),
  CONSTRAINT ck_product_option_values CHECK (extra_price >= 0 AND stock >= 0),
  KEY ix_product_option_product (product_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='원본: E2 ProdOptMst/ProdOptDtl, E4 prod_opt; 옵션별 가격·재고';

CREATE TABLE cart_item (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  product_option_id BIGINT NULL,
  quantity INT NOT NULL,
  cart_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_cart_member FOREIGN KEY (member_id) REFERENCES member(id),
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES product(id),
  CONSTRAINT fk_cart_option FOREIGN KEY (product_option_id) REFERENCES product_option(id),
  CONSTRAINT ck_cart_status CHECK (cart_status IN ('ACTIVE','ORDERED','REMOVED')),
  CONSTRAINT ck_cart_quantity CHECK (quantity > 0),
  KEY ix_cart_member_status (member_id, cart_status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='원본: E1 PERIOD_CART, E2 OrderCart, E4 cart; 회원 장바구니';

CREATE TABLE orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(30) NOT NULL UNIQUE,
  member_id BIGINT NOT NULL,
  order_status VARCHAR(20) NOT NULL,
  total_amount DECIMAL(12,0) NOT NULL,
  ordered_at DATETIME NOT NULL,
  canceled_at DATETIME NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_orders_member FOREIGN KEY (member_id) REFERENCES member(id),
  CONSTRAINT ck_orders_status CHECK (order_status IN ('PAYMENT_PENDING','PAID','SHIPPED','DELIVERED','CANCELED','REFUNDED')),
  CONSTRAINT ck_orders_amount CHECK (total_amount >= 0),
  KEY ix_orders_member_date (member_id, ordered_at DESC),
  KEY ix_orders_status_date (order_status, ordered_at),
  KEY ix_orders_date_amount (ordered_at, total_amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='원본: E1 PERIOD_TBL/PACKAGE_TBL/ENDBOOK_ORD_TBL, E2 OrderMst, E4 ord, E7 TB_ORDER';

CREATE TABLE order_item (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  product_option_id BIGINT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,0) NOT NULL,
  item_status VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES product(id),
  CONSTRAINT fk_order_item_option FOREIGN KEY (product_option_id) REFERENCES product_option(id),
  CONSTRAINT ck_order_item_status CHECK (item_status IN ('ORDERED','CANCELED','REFUNDED')),
  CONSTRAINT ck_order_item_values CHECK (quantity > 0 AND unit_price >= 0),
  KEY ix_order_item_order (order_id, id),
  KEY ix_order_item_product (product_id, item_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='원본: E2 OrderDtl, E4 ord_prod, E7 TB_ITEM; 주문 상품 라인';

CREATE TABLE payment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  payment_status VARCHAR(20) NOT NULL,
  amount DECIMAL(12,0) NOT NULL,
  approved_at DATETIME NULL,
  canceled_at DATETIME NULL,
  external_key VARCHAR(80) NULL UNIQUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT ck_payment_method CHECK (payment_method IN ('CARD','BANK','POINT','MIXED')),
  CONSTRAINT ck_payment_status CHECK (payment_status IN ('READY','APPROVED','FAILED','CANCELED','REFUNDED')),
  CONSTRAINT ck_payment_amount CHECK (amount >= 0),
  KEY ix_payment_order_status (order_id, payment_status),
  KEY ix_payment_status_created (payment_status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='원본: E1 ALLAT_CARD_TBL/VBANK_TBL, E2 결제, E7 주문 결제 상태; 결제수단 테이블을 통합';

CREATE TABLE delivery (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  recipient_name VARCHAR(80) NOT NULL,
  postal_code VARCHAR(10) NULL,
  address_line VARCHAR(240) NULL,
  tracking_no VARCHAR(50) NULL,
  delivery_status VARCHAR(20) NOT NULL,
  shipped_at DATETIME NULL,
  delivered_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_delivery_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT ck_delivery_status CHECK (delivery_status IN ('READY','SHIPPED','DELIVERED','FAILED','REDELIVERY')),
  KEY ix_delivery_status_date (delivery_status, created_at),
  KEY ix_delivery_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='원본: E1 INNOGIS_TBL/INNOGIS_PACK_TBL, E2 OrderDelivery, E4 배송';

CREATE TABLE subscription (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  order_item_id BIGINT NULL,
  media_type VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  subscription_status VARCHAR(20) NOT NULL,
  auto_renew TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_subscription_member FOREIGN KEY (member_id) REFERENCES member(id),
  CONSTRAINT fk_subscription_product FOREIGN KEY (product_id) REFERENCES product(id),
  CONSTRAINT fk_subscription_order_item FOREIGN KEY (order_item_id) REFERENCES order_item(id),
  CONSTRAINT ck_subscription_status CHECK (subscription_status IN ('ACTIVE','EXPIRED','CANCELED','PAUSED')),
  CONSTRAINT ck_subscription_dates CHECK (end_date >= start_date),
  KEY ix_subscription_member_status (member_id, subscription_status, end_date),
  KEY ix_subscription_expiry (subscription_status, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='원본: E1 PERIOD_TBL/MEDIA_TBL, E7 TB_SUBSCRIPTION_INFO; 기간·매체 구독';

CREATE TABLE coupon (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  discount_amount DECIMAL(12,0) NOT NULL,
  min_order_amount DECIMAL(12,0) NOT NULL DEFAULT 0,
  valid_from DATETIME NOT NULL,
  valid_to DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT ck_coupon_values CHECK (discount_amount > 0 AND min_order_amount >= 0 AND valid_to > valid_from),
  KEY ix_coupon_validity (valid_from, valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='원본: E2 쿠폰/OrderCartGift; 쿠폰 정책 마스터';

CREATE TABLE member_coupon (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NOT NULL,
  coupon_id BIGINT NOT NULL,
  issued_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  expires_at DATETIME NOT NULL,
  member_coupon_status VARCHAR(20) NOT NULL,
  order_id BIGINT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_member_coupon_member FOREIGN KEY (member_id) REFERENCES member(id),
  CONSTRAINT fk_member_coupon_coupon FOREIGN KEY (coupon_id) REFERENCES coupon(id),
  CONSTRAINT fk_member_coupon_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT ck_member_coupon_status CHECK (member_coupon_status IN ('AVAILABLE','USED','EXPIRED')),
  KEY ix_member_coupon_member_status (member_id, member_coupon_status, expires_at),
  KEY ix_member_coupon_coupon (coupon_id, member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='원본: E2 회원별 쿠폰; 한 회원 다중 쿠폰·사용/만료 상태';

CREATE TABLE point_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NOT NULL,
  order_id BIGINT NULL,
  point_type VARCHAR(20) NOT NULL,
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  memo VARCHAR(200) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_point_member FOREIGN KEY (member_id) REFERENCES member(id),
  CONSTRAINT fk_point_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT ck_point_type CHECK (point_type IN ('EARN','USE','CANCEL','EXPIRE')),
  KEY ix_point_member_date (member_id, created_at, id),
  KEY ix_point_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='원본: E1 PERIOD_SAVE_POINT_TBL, E2 MEMBER_POINT_LOG; 적립·사용 원장';

CREATE TABLE article (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT NOT NULL,
  author_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  article_type VARCHAR(20) NOT NULL,
  published_at DATETIME NULL,
  view_count INT NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_article_category FOREIGN KEY (category_id) REFERENCES category(id),
  CONSTRAINT fk_article_author FOREIGN KEY (author_id) REFERENCES member(id),
  CONSTRAINT ck_article_type CHECK (article_type IN ('NEWS','MAGAZINE','EBOOK','NOTICE')),
  KEY ix_article_category_published (category_id, published_at DESC),
  KEY ix_article_author_created (author_id, created_at)
  -- L4 재료: 인덱스 없음 (body 전문 검색 컬럼)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='원본: E3 KIDS_ARTICLE, E5 tb_article, E6 POSTING_MASTER/STORYCON_MASTER; 콘텐츠';

CREATE TABLE comment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  article_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  parent_id BIGINT NULL,
  body VARCHAR(1000) NOT NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_comment_article FOREIGN KEY (article_id) REFERENCES article(id),
  CONSTRAINT fk_comment_member FOREIGN KEY (member_id) REFERENCES member(id),
  CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES comment(id),
  KEY ix_comment_article_created (article_id, created_at),
  KEY ix_comment_parent_created (parent_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='원본: E3 KIDS_COMMENT/PLASTIC_COMMENT, E6 게시물 댓글; 대댓글 self FK';

CREATE TABLE review (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  order_item_id BIGINT NULL,
  rating TINYINT NOT NULL,
  body VARCHAR(2000) NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES product(id),
  CONSTRAINT fk_review_member FOREIGN KEY (member_id) REFERENCES member(id),
  CONSTRAINT fk_review_order_item FOREIGN KEY (order_item_id) REFERENCES order_item(id),
  CONSTRAINT ck_review_rating CHECK (rating BETWEEN 1 AND 5),
  KEY ix_review_product_created (product_id, created_at),
  KEY ix_review_member_created (member_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='원본: E2 상품 리뷰; 상품별 평점·리뷰 없는 상품 집계 재료';
