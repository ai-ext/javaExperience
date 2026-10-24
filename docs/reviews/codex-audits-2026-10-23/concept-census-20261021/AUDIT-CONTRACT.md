# 개념 전수 조사 계약

목표: 개념명도 모르는 학습자가 필요한 내용을 발견하고, 무엇인지/언제 쓰는지/어떤 대안이 있는지/실제 코드·SQL·상태로 어떻게 이어지는지 이해할 수 있는지 검증한다. 기존 문서134개 전부를 읽고 의미 단위 개념별로 기록한다. 기존 목록 밖에 필요한 개념도 별도 누락 후보로 기록한다.

기준 worktree: $WORKTREE_ROOT/concept-census-20261021 (audit/concept-census-20261021), 공개 공통 기반 d66dc21a54b442175da6427654c1d5efb4659bc9.
진행중 보강 비교: $WORKTREE_ROOT/concept-learning-night. 공개 기반에 없는 보강을 공개 화면에서 찾을 수 있다고 판정하지 않는다. 기존 CRUD 확장은 $WORKTREE_ROOT/scenario-crud-redesign 에서 필요한 연결만 참고한다.

산출물은 이 폴더에만 작성하고 학습자 소스·학습 자료·생성HTML을 수정하지 않는다. 새 학습 콘텐츠 구현·이미지 제작·merge·push는 이번 요청이 아니다.

검사 축: 정의와 실제 역할 / 사용 시점·선택기준 / 선수개념 / 예제·코드·SQL / 실패와 경계 / 스스로 해볼 과제·합격기준 / 초보자 질문·동의어·검색 / 들어오는 경로와 다음 경로 / 시각적 전달·모바일·조작 / 기술사실과 실행근거.

상태: 충분, 부분, 누락, 부정확, 미검증. 문서수·이미지수·검사통과만으로 이해도를 판정하지 않는다. 시각성은 정적 구조와 실제 캡처 관찰을 별도로 기록하고, 실제 보지 않은 화면을 확인했다고 쓰지 않는다. 상자/장식/긴코드만 존재해도 상태 전후를 전달한다고 평가하지 않는다.

기존 문서별 records JSON 공통형식:
- id,title,source,source_sha256,read_ranges (전체 읽기 범위)
- concepts: name,aliases,novice_questions,definition,when_to_use,comparison,example,prerequisites,gaps,evidence[{path,line_start,line_end}],priority
- discovery: incoming_paths,next_paths,problems
- visual_static: existing_representation,limitations,proposed_scenes
- visual_review: status(pending_render/inspected),screenshots,findings
- in_progress_supplement: source_paths,what_added,public_gap
- verdict,priority,uncertainties

각 문서의 Markdown과 JSON을 documents/<ID>.md 및 documents/<ID>.json에 저장한다. 전문을 읽은 사실을 해시와 라인범위로 남긴다. 보고서 내용은 문서마다 고유해야 하며 '설명있음/부족함' 자동문구 반복으로 전수조사를 대체하지 않는다. 개념별 분해는 원문의 제목수와 같을 필요 없고 독립적으로 이해/선택/조작하는 의미단위를 기준으로 한다.

사용자 명시 개념: IoC,DI,Bean 생명주기,Entity,EntityManager,트랜잭션/readOnly/rollback,MyBatis,JPA,MVC,Layered,Monolith,MSA,N:1,1:N,N:N,LAZY,EAGER,index,B-tree/B+tree,UNION/UNION ALL,복합인덱스,UK/UNIQUE,커버링인덱스,Value Object,DTO,DTO→Entity 저장,Entity 직접응답을 피하는 이유. 이에 한정하지 않고 Java/Spring/DB/네트워크/테스트/운영/보안/설계 전 범위를 조사한다.

상시 웹 리서치는 지정된 Luna 서브에이전트가 직접 수행한다. LiteLLM/외부모델 재위임은 금지한다. 공식문서/명세 등 일차자료를 실제 열고 출처URL·확인일·버전·한계를 sources/에 기록한다. 이미있는 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/ 자료는 참고용이며 이번 전수검토의 대체가 아니다.
