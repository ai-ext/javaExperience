# P09 두 질문·9상태 최종 검증

2026-10-25 KST. 기존20질문84상태에 공유static3상태와 varargs/overload6상태를 추가해22질문93상태다. 기존 저작질문27개는 다른 목록이며 보존했다. P09 전체 문서·기존24 전체 문서·134개 전체의 학습 완료 판정은 아니다.

## 구현과 실제 동작

quantity를 객체 a/b별로, latestName을 하나의클래스필드로 분리해0/0/null→2/0/Ada→2/5/Grace를 보여 준다. sum의입력[]/[2,3]/[4,6]과반환0/5/10, choose두선언에서고정인자/배열/빈호출의선택을 나눈다. 핵심대입·전체sum누적식·두overload선언과현재호출은 기본코드패널에 노출한다. 소스비연속발췌범위를 sourceFragments로 고정했고 선택한선언/현재호출을 강조한다. 전체Java와raw13관측은 원문#p09-original밖에별도이름의details로 제공한다.

새JPG2개는실제imagegen선정본이며 기존45기록과원본자료를 변경하지않았다. 숫자·소스는추가Java21순차실행에근거하며 HTTP/Spring/DB/동시요청·성능을실행한결과로표시하지않는다. 배열원소는호출코드기반설명이며디버거캡처가아니다. Java전체는준비단계의메인및독립Sol새임시컴파일/실행13관측승인자료와연결했다. 이번UI하네스가Java를다시실행했다는뜻은아니다.

P09복사handler에render세대와요청ID를적용해장면변경·A→B→A·역순완료후낡은성공/실패가현재status나selection을덮지않도록했다. 현재정상복사와수동선택fallback은유지한다. 다른controller일괄변경없음.

## 검증 결과

- Luna high 구현 뒤 독립 Sol high가 spec→quality로검수했다. 최초quality M1(잘못된배열길이/원소가검사를통과)이있었고전체values독립맵으로수정했다. 정상baseline PASS, 길이/원소변이2·guard삭제4·문자열리터럴변이1의총7mutant가모두검출됐다. attempt2 최종C/I/M0. 최초실패보고/테스트snapshot/재현로그는보존했다.
- test:p09, build, test:concept-reader/dark 통과. 기존24최신하네스24/24가실행전후현재코드fingerprint와일치한다. rawrun은기존task별append-only디렉터리에남긴다.
- 메인실제Chrome PC1672×941에서새9상태를전환하고모든복사payload9개를표시코드와직접대조했다. 이미지로딩/native크기와현재값·강조·버튼상태를기록했다. 실제JPG9개를직접봤다.
- 실제확대에서오른쪽choose()/sum시작글자잘림을발견해6focus좌표를교정했다. 최종varargs6+sharedB1의실제확대JPG7개를직접판독했다. 실패화면도browser/attempts에보존했다. 기존varargs전체화면6개는좌표교정전값/복사자료로manifest에명시했다.
- PC1280/1366/1440의장면3+설명1씩총12사례에서문서가로넘침0. 신규모바일/라이트검증없음. 실제reader장면유지, 추가전체Java/raw13펼침과DOM전문일치, 원문전체링크의설명전환·#p09-original초점을확인했다.
- 원문135·학습자17·기존dirty2·역사proof1366·초기감사24JSON SHA불변. 독립Sol은기존20질문/84데이터·sourceRoot HTML바이트·생성bundle exact재생성도확인했다.

inventory typed P09는93행이며새9행만시안→구현단계로기록한다. verified승격과기존84/다른행상태변경은없다. 상세집계/최종감사결과는 main-summary.json과 main-audits/에기록한다. 시안·실제PC캡처는parity의implemented두레코드로만연결한다.

남은P09공백(원문전체범위의추가guard/연산/컴파일교정·실제Boot/HTTP등)은기존원문감사와별도다. 이번9상태와공통reader를개별문서전체완성으로확대하지않는다. push/PR/merge는수행하지않는다.
