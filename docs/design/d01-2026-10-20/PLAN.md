# D01 개발 생명주기 개념 보강 계획

범위는 개념 문서뿐이다. 원문·학습자 서버·기존 Git 작업을 보존하고 실제 PR·push·배포·사용자 서비스 변경은 하지 않는다.

1. 원문277줄·코드/도표·기존HTML을 읽고 추출 → SHA·본문/앵커/지도/코드 기준을 기록한다.
2. 기존연구와현재원문대조·Luna/OpenAI 직접공식조사 → Git/CI/리뷰/산출물/환경/릴리스/장애 문헌과 실행을 구분한다.
3. 추가 private temp Git+Gradle/JDK21 작은 좋아요 정책 fixture → 브랜치포인터/커밋·테스트실패와수정/실행JAR·실제SHA로검사한다. 원문Java25/Boot앱·원격명령실행과구분한다.
4. 빌드한동일JAR의로컬복사·설정입력차이 → artifact와cache/환경이름·브랜치차이를확인한다. dev/stg/prod이름의사본은실제배포가아니다.
5. 리뷰/CI게이트·배포/릴리스·호환성/롤백·장애피드백은명시적추가시뮬레이션또는문헌 → 실행하지않은GitHub/registry/Docker/운영/DB동작을실측처럼표시하지않는다.
6. native관찰frozen/freshreplay/독립재현 → rawGitSHA/JAR메타데이터와비교가능한canonical범위를근거와함께기록한다.
7. 실제 image_gen별도시안·좁은UI구현 → 핵심현재값/코드/짧은이유를먼저노출하고전체원문·로그는보존한다.
8. actualChrome desktop/mobile/copy/history/기존Mermaid·코드·앵커/문서와원본보존 → build/관련suite/3audit 뒤localcommit한다. verified/merge/push/PR은하지않는다.
