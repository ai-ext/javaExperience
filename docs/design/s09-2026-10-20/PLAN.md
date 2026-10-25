# S09 개념 보강 계획

원문304줄·Java4블록과 기존집중화면/예상값시뮬레이션을읽었다. 원문실제모델은PurchaseOrder/OrderLine이며기존Post42그림은설명용이다. 원문·기존조작·시안·학습자서버를보존하고추가native Hibernate/H2실험을분리한다. 원문@BatchSize32를무시한가짜N+1수치를만들지않는다.

1. 원문4Java파일추출/SHA·컴파일 → 추가bootstrap으로원문관계/helper/service실행범위와Spring프록시미실행을구분한다.
2. 추가ProbePost42(title/version)로실제Hibernate loadedState·같은컨텍스트find·dirtychecking·flush/commit/별도rollback·merge반환/removed·optimistic conflict를측정 → 별도READ_COMMITTED JDBC와rawSQL은분리한다. 원문에Post클래스가있었다고하지않는다.
3. 원문@BatchSize32와fetchjoin/graph의실제SQL·반환부모/child/DBjoin행수를조건별측정 → 원문예제미실행표현은보존하고추가실행으로구분한다.
4. Luna직접공식조사/메인대조 → JPA3.2·Hibernate7.4의flush/AUTO/merge/version/fetchpagination구분. MySQL/OSIV/HTTP/Java25은미실행으로남긴다.
5. 실제image_gen/선택교정/좁은UI위임 → 원문/기존UI/bundle보존·Chrome양쪽전상태·조작·필수build/visual/version/parity검사. 근거있는항목만implemented, verified아님.
6. 로컬checkpoint로분리하고통합/push/PR하지않는다. 모든원문세부장면완료를전파하지않는다.
