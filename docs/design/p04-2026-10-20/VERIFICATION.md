# P04 검증 기록

2026-10-20 KST. 원문 전체를 읽고 14개 질문·48개 상태를 구현했다. 실제 생성 이미지 36개 중 교정·선택한 17개를 공개하며 19개는 draft로 분리했다. 질문별 근거는 questions.json, 이미지별 해시·시안·실제 화면은 asset-review.json에 연결한다.

Chrome 1672×941·360×800에서 각각 48상태를 전환했다. 96개 관찰에서 제목·질문·값·코드·stdout·선택 이미지가 데이터와 일치하고 이미지 로드 성공·페이지 가로 넘침 없음이었다. 선택 이미지17개마다 양쪽 full-page 캡처를 보관한다. 모바일 초기화는 한 Child 안의 Parent.marker와 Child.marker를 세로 DOM으로 함께 표시하며, 긴 그림은 내부 좌우 이동으로 읽는다.

핵심 값·현재 코드는 기본 노출한다. 초기화 등 의미 있는 stdout은 펼쳐 보이고, 추가 실험 assertion 로그는 접어 둔다. 같은 장면의 그림 확대는 사용자가 펼친 로그 상태를 유지한다. 실제 Chrome에서 코드 복사·끝 포커스·기존 앵커 열림/스크롤·검색복귀·키보드·새로고침 복원을 확인했다. 첫25상태에서 확인한 공통 조작과 전체48상태 전환 증거를 구분한다.

원문13,775자·코드15개·기존 앵커14개와 생성 bundle을 검사한다. P09 보존 검사에서 원문 Markdown135개·학습자17파일 해시를 확인한다. 학습자 서버 구현은 바꾸지 않았다.

## 실행 근거

- 원문 CreationDemo/RequestDemo JDK21 stdout 전체 일치.
- 추가 P04StateProof15상태: Builder 같은this·build검증·방어복사·record정규화·거부 확인.
- Lombok1.18.46/JDK21 추가12검사: required/allargs 시그니처, initialized final/static 제외, final만으로null거부안함, NonNull검증, Builder.Default0/20/7, force null/0, 생성자대상Builder검증.
- 생성자 javac거부4개·긍정2개, override가 자식초기화전labelnull을 읽고 완료뒤ready가 되는3확인.
- Spring7.0.9/Lombok1.18.46/JDK21 독립컨텍스트9검사: 원문Java소스파일4개 컴파일, application Bean타입3개 명시등록, private필드 reflection 동일성, 직접Java메서드 호출의 Mina/2/UUID형식, 잘못된record입력, generatorBean누락실패. outer UnsatisfiedDependencyException과 cause NoSuchBeanDefinitionException을 구분한다.
- Spring 의존성은 기존 Gradle캐시와 누락된 선언 버전의 공식 Maven Central 다운로드를 사용했다. dependencies는 gitignore되며 좌표·URL·버전·SHA와 재실행 스크립트를 보관한다. verify-source.py와 verify-extensions.py로 재실행한다.

## 검토와 한계

독립 리뷰가 선택 이미지17장과 원문·상태 데이터·실행 fixture를 대조했다. 원문2개와 추가 상태·override·Lombok·Spring을 임시 폴더에서 독립 실행하고 stdout과 생성자 거부/긍정을 재현했다. Critical0·Important0, 오래된 본 기록1건을 지적해 현재 내용으로 갱신했다. 공유 브라우저의 독립 재조작은 하지 않았다.

교정 항목: 초기화 print/필드대입 시점, List.copyOf의 할당 보장 과장, record첫예외뒤두번째검사 미도달, Builder필수값 누락의 별도입력, Builder.Default의 생략입력/반환값, 생성자대상Builder 선언, DI의 가짜id/type필드·반환타입·참조방향, 정상/누락실패 및 DTO유효/거부입력의 별도그림. 교정 전 이미지는 공개하지 않는다.

최종 명령·출력·종료코드는 checks/final-checks.txt에 기록한다. Boot서버·HTTP·JPA·Java25는 실행하지 않았다. Java25와 Entity 규칙은 원문설명으로 표시한다. 전체 시안과 34개 캡처의 픽셀 정밀 일치·실제학습자 이해도·Chrome외환경은 미검증이다. parity와 48개 상태는 implemented이며 verified로 올리지 않는다. 문서 전체의 모든 원문 블록이나 다른 개념까지 완료로 전파하지 않는다.
