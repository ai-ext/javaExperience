-- 추가 SQLite 번역 예시. 원문 PostgreSQL 18 DDL의 실행 결과가 아니다.
-- INTEGER PRIMARY KEY는 SQLite rowid alias이며 PG IDENTITY/BIGINT와 다르다.
-- TEXT는 VARCHAR 길이·TIMESTAMPTZ 의미를 검증하지 않는다.
CREATE TABLE student (
  id INTEGER PRIMARY KEY,
  campus_no TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);
CREATE TABLE course (
  id INTEGER PRIMARY KEY,
  course_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL
);
CREATE TABLE offering (
  id INTEGER PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES course(id),
  term_code TEXT NOT NULL,
  section_no INTEGER NOT NULL CHECK (section_no > 0),
  UNIQUE (course_id, term_code, section_no)
);
CREATE TABLE enrollment (
  student_id INTEGER NOT NULL REFERENCES student(id),
  offering_id INTEGER NOT NULL REFERENCES offering(id),
  enrolled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL CHECK (status IN ('ENROLLED', 'DROPPED')),
  PRIMARY KEY (student_id, offering_id)
);
