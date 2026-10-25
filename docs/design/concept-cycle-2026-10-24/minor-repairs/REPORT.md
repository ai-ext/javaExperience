# 기존24개 잔여 minor9 수정 결과

기준 a41846fc + 이번 bounded diff. 2026-10-24 기존 감사에서 남았던9건을 수정하고 새 Sol spec/quality의 승인을 받았다. **미해결 reviewer finding C/I/M0이며, 이는 원문 전체 학습 범위의 완성 판정과 다르다.** 기존 중요4건 수정은 이전 커밋에 있다.

- P09 출처152줄 교정, 역사PNG79항목/44고유경로→변환manifest/sourceGitBlob SHA→현행JPG SHA 검증.
- P16 20상태/S09 31상태 active범위·실제강조 검사, S09 fetch-join의 두줄 모두강조.
- W11 장면세대와copy요청ID로낡은성공·실패completion 무시. 왕복/역순 resolve/reject 회귀와guard제거변이검출.
- V04 준비runtimeScope는역사원본으로보존하고 최종범위정정JSON을공개보조자료앞에연결. 실행/미실행·중첩검사수를구분.
- B01 encoder.matches·version mismatch판단식을짧은발췌로표시. sourceFragments의원문정합과화면정합을검사하며부정연산자·비교연산자·literal공백변이가실패함.
- D02 handler호출수로잘못부른지표를완료proxy기록증가로좁힘. raw명칭/화면라벨의대응과handler진입미계측을명시. 네트워크없는AST실행에서upstream예외시진입1/완료0 확인. 실제imagegen교정본 tls-v2.jpg/JPEG92 적용.
- D04 원문의선형test→JAR설명앞에한계와실제두장면이동추가. 이동후제목focus/스크롤,모바일기존header가림도후속교정했다.

## 검증

최종안정본에서 main24하네스24/24통과·현재codefingerprint전후동일, build/audit:visual/audit:version-cards/audit:parity exit0. Sol은spec9pass후별도freshquality승인. 초기B01plumbing/D02잔존문구/AST cwd·import/표시predicate변이등실패와후속통과를attempts/와raw logs에보존했다. 수정도중검사는최종승인검사로합치지않았다.

메인Chrome7문서53상태를desktop1672×941/mobile360×800로관측해106행의제목·설명·출처·값·코드·강조·이미지로딩·문서넘침을대조했다. 첫clipboard읽기는13/14일치, P09별도payload재관측으로일치확인. B01빈줄placeholder가정과V04 JSON key순서문자열비교는초기기대식오류로분리한뒤실제문자/구조동등성으로재확인했다. V04scopeJSON두모드일치, D04양쪽2장면focus/이동과원문anchor를확인했다. D04mobile제목top64px/header89px가림을찾아112px로교정후재관측했다. TLS교정JPG가두모드실제로딩됨을확인했다. 21JPEG중메인이직접읽은대표9개는browser/summary.json에명시했다. 전수pixel/학습자이해도주장이아니다.

원문135·학습자17·역사proof1366·초기Sol24JSON·기존미커밋AGENTS/RESUME2개SHA불변. 이번9건에서 Java/DB/HTTP/TLS native를새실행하지않았다. 별도P09추가Java21 proof13관측은다음작업이며이수치에합치지않는다.

## 최신 사용자 지시와 다음 작업

이후 설계·구현·검증은 **PC 다크 화면만** 기준으로 한다. 위 모바일/라이트 증거는 이 지시 전에 이미 수행한 역사 기록이며 추가 검증 조건으로 요구하지 않는다.

개념134개 전체·기존24개 원문 전체는 미완료다. P09 두질문9상태 추가는 별도사양/실행/시안을준비했고, 사용자가추가한 전체진입·산문·표·코드배치를미리캔버스보완조사와연결해구현한다. 해당조사는 /Users/ds/research/javaexperience-concept-ia-20261024 이며8766보드는비교자료이다. push/PR/merge는하지않는다.
