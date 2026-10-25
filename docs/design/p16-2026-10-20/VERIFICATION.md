# P16 보강 검증 기록

2026-10-20 KST. 원문 전문을 읽고 기존 요청/응답 3단계와 실패1개를 보존했다. 이름 매핑·포함/무시·날짜/순간·Enum·unknown 정책·creator·JSON 구조·primitive null의 8질문20상태를 추가했다. 이는 P16 원문의 모든 장면을 새로 완성했다는 뜻이 아니다. JPA 순환/지연 로딩과 전역 naming·NON_EMPTY·레거시 날짜 포맷의 개별 실행/이미지 등은 남았다.

## 근거와 범위

- Codex CLI 직접 gpt-6-luna/openai 경로를 사용했다. 현재 도움말·기본 제공자 설정과 ACCESS_OK를 확인한 뒤 공식 FasterXML/Spring 원문을 조사했다. LiteLLM·재위임·임의 모델 전환 없음. 원자료/실행로그: LOCAL_HOME/research/javaexperience-p16-20261020/_data . 보고서와 출처메모를 research에 복사했다.
- 메인이 공식 Jackson3 변경표·Spring 메시지 변환기·Boot JSON 문서를 라이브 대조했다. unknown 기본false, Enum toString 사용, annotations namespace 및 실행 범위를 구분했다. 원문은 수정하지 않고 별도 버전 안내를 추가했다.
- JDK21.0.6/Jackson3.1.5/annotations2.21로 원문 MapperExample의 출력2줄을 재현했다. 추가 mapper24검사, Spring7.0.9/ServletAPI6.1.0 MockMvc11검사를 실행했다. 현재 명령은 source-proof/verify-source.py, 결과는 verification.json·stdout·compile/stderr 파일이다.
- 원문 §3.2의 DTO/반환식에 호출계수만 더한 추가 Controller다. JSON converter를 하나 명시 등록했다. 200/400/415/406은 MockMvc 결과이며 실제 포트·Boot4.1.1·Java25·JPA·DB 실행이 아니다. 응답406일 때 본문이 이미 호출된 것을 호출계수로 확인했다.
- 기존 캐시 JAR와 명시 ServletAPI6.1.0 공식 MavenCentral 다운로드를 사용했고 좌표·SHA를 기록했다. dependency JAR는 gitignore다. 체크포인트23검사의 초기기록은 source-proof/checkpoints에 두고 현재24검사 기록과 구분했다.

## 이미지와 실제 화면

built-in image_gen 17개 중8개를 선택했고9개는 draft다. 원본·프롬프트·참조·해시는 generation-records.json, 최종 선택/시각구간/캡처는 asset-review.json에 연결했다. record와class의 차이, 유효한설정코드, JSON발췌vs전체객체, 빈문자열, 원문Kim29와추가Mina의 구분을 교정했다.

Chrome viewport1672×941/360×800에서 새20상태를 각각 전환했다. 40관찰의 질문/제목/값/코드/PASS로그/이미지 경로를 데이터와 대조했고 로드성공·페이지가로넘침없음을 확인했다. 기존정상3+오류1을 양쪽에서 확인한8관찰은 browser-original-states.json으로 따로 보관한다. 최종이미지별 desktop/mobile full-page 캡처16개가 있다. 모바일은 그림을 충분히 확대해 내부 좌우 이동으로 읽으며 DOM값과코드는 기본노출한다.

실제조작: 코드정확복사, 보조로그기본접기·확대뒤열림유지, 모바일끝포커스, 새로고침복원, 기존읽음toggle과원상복구, 기존/신규장면독립, End포커스이동/Enter선택, 원문펼침·깊은앵커스크롤. browser-special-checks.json에 기록했다. 원문 전체14,300자·code15개·기존id26개를 공백포함코드/정규화본문으로 보존했고 중복id없음·실제bundle20상태·이미지실측검사를 통과했다.

## 한계

최종 명령·출력·종료코드는 checks/final-checks.txt다. 독립 리뷰는 소스/실행/선택8이미지를 확인했고 최종 기록은 REVIEW.md에 둔다. 실제16캡처의 전수픽셀정밀대조·Chrome외환경·학습자이해도는 미검증이다. 일부모바일캡처의 번역확장overlay는 사이트UI가 아니다. 이미지판과실제전체화면의밀도/DOM배치는다르며전면동일성을주장하지않는다. parity와20상태는implemented이고verified로올리지않는다. 다른개념·기존원문블록전체로완료를전파하지않는다.
