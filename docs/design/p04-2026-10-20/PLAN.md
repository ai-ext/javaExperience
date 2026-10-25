# P04 객체 생성 학습

원문 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P04-constructors-builder.md 전체를 읽었다. 원문·기존 앵커·학습자 서버는 보존한다. 먼저 순수 Java의 실제 예제부터 다룬다.

1. new Child()와 this("delegated")의 경로, 부모/자식 필드·블록·생성자 본문 7개 출력 → 원문 stdout 대조, 현재 필드 값을 구분해 장면 전환.
2. Order.of("ORD-1",2)의 이름 있는 생성 → 실제 private 생성자의 검증과 List.of() 입력, 정확한 결과 비교.
3. Builder의 같은 this 반환·미완성 상태·build 검증 → ORD-2/3/gift 실제 값과 예외 대조. 일반 Builder가 컴파일 때 필수값을 보장한다고 쓰지 않음.
4. List.copyOf의 방어 복사 → Builder에 late를 추가한 별도 실험에서 이미 생성한 Order의 tags는 gift 유지. 얕은 복사이며 요소까지 복제한다고 쓰지 않음.
5. SignupRequest compact constructor의 매개변수 trim → 마지막 필드 대입, 정상 record와 bad 입력 예외 구분. 실패가 객체 할당 자체를 하지 않았다는 뜻으로 그리지 않음.
6. 기본 생성자/this 위임·final 초기화 오류, Lombok 생성자/Builder.Default, Spring 생성자 주입, DTO/Entity 생성 관례 → 원문 대조와 가능한 로컬 실행을 구분해 후속 장면 작성. 아직 구현 완료 아님.

원문 CreationDemo/RequestDemo는 JDK21에서 stdout 전체 일치했다. 추가 P04StateProof 15개 상태와 카운터 확인도 통과했다. Boot/Java25/Lombok/JPA/Spring HTTP는 미실행이며 현재 지원 버전을 새로 조사한 것이 아니다. 출력 없는 원문 예제에 임의 숫자·UUID·실측 HTTP 응답을 만들지 않는다.

이미지 기준은 gpt-image-prompt의 정밀한 재질·정렬·큰 값·정확한 연결, 한 화면의 현재 질문·장면·값·코드 동기화다. 각 생성 프롬프트에 실제 코드/값/한계를 명시한다. 생성 이미지를 검수한 후 UI로 옮기고 원문 보존·전환·브라우저·필수 감사를 수행한다. 모호한 범용 카드로 문서 전체를 완료 표시하지 않는다.
