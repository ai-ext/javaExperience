ALTER TABLE member DROP CHECK ck_member_status;
ALTER TABLE member MODIFY member_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
ALTER TABLE member ADD COLUMN password_hash VARCHAR(255) NULL,
  ADD COLUMN email_verified_at DATETIME(6) NULL,
  ADD COLUMN phone_verified_at DATETIME(6) NULL,
  ADD COLUMN credential_version INT NOT NULL DEFAULT 0,
  ADD CONSTRAINT ck_member_status CHECK
    (member_status IN ('PENDING','ACTIVE','SUSPENDED','WITHDRAWN'));

CREATE TABLE verification_challenge (
  id BINARY(16) PRIMARY KEY, member_id BIGINT NOT NULL,
  purpose VARCHAR(24) NOT NULL, channel VARCHAR(8) NOT NULL,
  code_mac CHAR(64) NOT NULL, pepper_version SMALLINT NOT NULL,
  expires_at DATETIME(6) NOT NULL, attempts SMALLINT NOT NULL DEFAULT 0,
  consumed_at DATETIME(6) NULL, created_at DATETIME(6) NOT NULL,
  FOREIGN KEY (member_id) REFERENCES member(id),
  CHECK (purpose IN ('SIGNUP','PHONE_CONFIRM')),
  CHECK (channel IN ('EMAIL','SMS')),
  KEY ix_vc_latest (member_id,purpose,channel,created_at)
);
CREATE TABLE password_reset_token (
  id BINARY(16) PRIMARY KEY, member_id BIGINT NOT NULL,
  token_hash BINARY(32) NOT NULL UNIQUE, expires_at DATETIME(6) NOT NULL,
  used_at DATETIME(6) NULL, created_at DATETIME(6) NOT NULL,
  FOREIGN KEY (member_id) REFERENCES member(id),
  KEY ix_prt_member (member_id,created_at), KEY ix_prt_expiry (expires_at)
);
