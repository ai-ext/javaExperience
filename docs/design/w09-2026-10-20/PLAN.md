# W09 개념 학습 계획

1. 원문 전체·엔티티/DTO/쿼리/mapper를 읽는다 → 원문 SHA와 예시별 경계.
2. 원문 엔티티를 별도 Hibernate/H2 메모리 DB에서 실행한다 → lazy 실패/열림 상태의 조회/DTO 매핑 쿼리 수/프로젝션의 실제 SQL 근거.
3. Mapper·record 계약을 별도 실행한다 → MapStruct 생성 코드/수동변환/얕은 불변성.
4. 공식 출처를 Luna 직접 경로로 검증하고 실제 값 기반 imagegen 시안을 만든다 → 질문/장면/시안/교정 기록.
5. 좁은 UI를 위임하고 desktop/mobile·원문 보존·조작 검증 → implemented/미검증 범위 분리.
6. build/관련 테스트/필수 감사/독립 리뷰 → 로컬 커밋, 통합·push 없음.

격리 H2는 MySQL과 다르며 Boot·OSIV 요청·실제 HTTP·Java25를 실행했다고 쓰지 않는다. OSIV의 개념 설명과 열린Session의실행은같은실험이아니다. 기존practice/학습자DB·서버파일은수정하지않는다. 측정전SQL개수·속도를가정해완료값으로쓰지않는다. 예시값은추가fixture로명시한다.
