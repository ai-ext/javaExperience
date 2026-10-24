# 시나리오 전수 감사 계약

요청: 모든 시나리오의 부족함과 확장 필요성을 하나씩 조사하여, 기초 구현에서 어렵고 깊은 업무·쿼리·DB 문제까지 학습할 수 있는지 검증한다. 기존 학습자 코드나 정답을 대신 완성하지 않고 조사·확장 명세·검증 결과를 만든다.

기준 worktree: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021 (audit/concept-census-20261021). 산출물: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/ . 최신 후속 화면은 /Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign 의 별도 근거로 대조한다. 조사 기준/파일 해시는 _data/corpus.json.

범위는 본편101, DB경로14, 쿼리Q18, 선택랩L15/L16 2, 실전티켓30, 미션M10, 연결레슨50의 225단위다. scenario/README 및 L12~14 공통 준비·코드·채점 영역은 단위들의 공통 입력으로 읽는다. 같은 .md의Q/M은 구간별단위이며중복문서수가아니다. 제공된 원문의 해당구간 전문, 공동 준비사항, 연관정답/스냅샷 실제코드와 검사 기준을 함께 읽는다.

## 검토 기준

- 단계에 맞는 목표·선수·시작 코드·설정·DB/seed·끝 상태가 명확한가.
- 요구에서 Controller/DTO/Service/Repository/Entity/DDL/SQL 책임을 직접 결정하게 하는가.
- 정상·오류·권한·중복·상태전이·관계 수명·트랜잭션 원자성 계약이 구체적인가.
- 실제 정답 코드가 계약을 구현하며, 테스트/검사기가 그 조건을 검사하는가.
- 쿼리: JOIN/집계/NULL/EXISTS/서브쿼리/UNION/정렬/페이징/동적조건/프로젝션/카디널리티·중복.
- DB: 타입·제약·PK/FK/UK·정규화·키 생성·인덱스/계획/통계·격리/락·교착/재시도·커넥션·migration/백필·backup/restore.
- 어려움은 코드길이가 아니라 선택 이유·실패 진단·반례·측정·운영 제약을 직접 해결하는가로 판정.
- 단계별 기본·심화·전이(다른 요구) 과제로 이어지고 그 다음 링크가 실제 있는가.
- 브라우저/시각 흐름이 지금 구현/실행/관찰할 것을 보여 주고, 설명용 상태와 실측을 구분하는가.

**기초 단계에 모든 고급 주제가 없다는 것을 결함으로 세지 않는다.** 후속 단계가 담당하면 연결을 기록한다. 기존 시나리오/티켓/레슨에 있는 것을 다른 담당분야에 없다는 이유로 새 누락으로 세지 않는다. 난이도 라벨과 테스트 통과수만으로 충분 판정하지 않는다.

## 산출물 소유권과 언어

담당자는 _data/assignments/<owner>.json에 지정된 ID의 units/<ID>.json만 생성한다. 모든 설명문은 한국어, 코드식별자·공식명·URL·정확한 소스 인용만 원문을 허용한다. 영어 초안으로 마치지 않는다. Markdown 렌더링과 전체 목록·검사기는 메인이 담당한다. 타담당파일/공용renderer/기존개념감사폴더를 덮어쓰지 않는다.

최소 JSON 필드:
- id,title,kind,source,source_sha256,read_ranges([{line_start,line_end}]),shared_sources
- intent_and_prerequisites: string
- learner_work: 직접 작성/제공되는 부분 구분
- contract: [{requirement,source_lines,evidence[{path,line_start,line_end}],implementation_status,test_status,gap}]
- implementation_evidence: [{path,sha256,read_ranges,role}] (스냅샷이면blob경로와논리파일명둘다)
- query_db_review: 내용/현재범위/빠진범위/기존다른단계연결
- difficulty: {current,reason,progression_links}
- gaps: [{id,severity,category,claim,evidence,scope_limit}]
- expansion: [{title,why,starting_state,learner_tasks,normal_cases,failure_cases,concurrency_or_performance,db_observations,acceptance,existing_overlap,priority}] (없는부분만. 무관한고급기능억지추가금지)
- visual_review: {status:'pending_render'|'inspected',screenshots,findings,limits}
- latest_variant: source/HTML/도구 차이 및 현재 공개기반에없는보강
- verdict,priority,limits

근거는 실제 절대경로·행 범위다. 존재하지 않는 단축 경로나 제목만으로 검토 완료하지 않는다. 전체 읽은범위와 SHA를 기록한다. 큰 출력이 잘리면 분할해서 다시 읽는다. 같은 소스 코드가 반복되면 해시가 같은 것을 확인해 공동 근거로 재사용할 수 있다.

## 실행과 외부 근거

메인이 스냅샷/쿼리 프로젝트의 격리 복원·빌드·원래 테스트와 고위험 쟁점을 실행한다. 담당자는 실행하지 않고 원문/코드/검사 계약 대조와 재현 후보를 전달한다. 기존 로그는 '기존 실행 기록', 새 실행은 '이번 실행'으로 구분한다. 테스트가 없거나 실행 불가도 명시적 결과다. 정답코드가 green이어도 테스트하지 않은 계약을 성공으로 표시하지 않는다.

일반 기술 사실이 불확실하면 Luna가 공식 일차자료를 직접 검색/열람해 sources/<owner>.md/json에 URL/확인일/버전/한계를 기록한다. 외부CLI/LiteLLM/추가에이전트 재위임 금지. 원래 개발DB·볼륨을 수정/삭제하거나 서비스를 임의로 실행하지 않는다.
