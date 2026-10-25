-- PostgreSQL 18 예시: 키와 참조 무결성에 초점을 둔 최소 스키마
CREATE TABLE student (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  campus_no VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(254) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE course (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_code VARCHAR(20) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL
);

CREATE TABLE offering (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES course(id),
  term_code VARCHAR(10) NOT NULL,
  section_no SMALLINT NOT NULL CHECK (section_no > 0),
  UNIQUE (course_id, term_code, section_no)
);

CREATE TABLE enrollment (
  student_id BIGINT NOT NULL REFERENCES student(id),
  offering_id BIGINT NOT NULL REFERENCES offering(id),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(12) NOT NULL CHECK (status IN ('ENROLLED', 'DROPPED')),
  PRIMARY KEY (student_id, offering_id)
);
