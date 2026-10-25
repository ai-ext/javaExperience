# D12 Task26 설계 계약 — PC 다크 전용

기준: D12 원문330행 SHA bcdd88b289812a79e82d1a705d38c0f11477afaadfc76985b2eb50b231d79b0c. 원문 수정 없이 추가 학습 장면을 붙인다. 기존 D11의 flat PC 구조, 공통 reader와 검색 복귀, 코드14px/관측값17px을 따른다. 모바일/라이트 새 구현 없음. 파일을 자동 실행하는 UI가 아니라 보관된 관측을 선택해 읽는 UI다.

## 완료 경계와 역량
학습자는 stdout/stderr/exit을 따로 추적하고, 계정과 경로 조건으로 접근 거절을 설명하고, 종료 요청과 관측·TCP와 HTTP·정의와 프로세스 반영·파일 경로와 파일시스템 점유를 구분한다. 구성도만으로 이해나 원문 전체 완료를 판정하지 않는다. task26은 아래45상태의 한정 보강이고 fullDocumentComplete=false다. 학습자의 서버 정답 코드는 변경하지 않는다.

## 근거 계약
- native-linux: source-proof/proof.py 실제 실행 구간, canonical 성공 attempt의 각 observations 원출력/명령과 source SHA. 이미지·UI는 한 canonical attempt를 가리키며 Sol 재실행은 독립 검증이다.
- native-docker: run_proof.py의 자체 disposable idle container logs/exec/PID1 관측. Linux 주 실험 PID1 python과 idle PID1 sleep은 다른 컨테이너다.
- original-code-unrun: 원문에 있는 Bash/INI 예시 분석. SSH, SCP, systemctl, journalctl, Java25서비스는 미실행.
- original-prose: 원문 산문. 파일 범위에 코드 fence를 포함하지 않고 코드인 척하지 않는다.
- explanatory-model: 아래의 명시 모델 문장. '설명 모델 · 명령 실행 결과 아님'을 기본 화면에 표시한다.
실행된 Python 스크립트에 Bash를 subprocess로 호출한 경우 '추가 Linux · Bash 실제 관측'으로 표시하고 Bash 코드만 보이려면 정확한 실제 argv[-1]를 표시한다. 원문 Bash 예시를 그대로 실행했다고 표시하지 않는다. 원출력은 접어도 핵심 조건·명령·결과·근거 유형은 접지 않는다.

canonicalProof는 Sol 최종 검증된 성공 attempt로 고정해 selected-proof.json에 source hash와 경로를 기록한다. 실패 원출력과 이전 성공 로그는 불변이다. 기존 연구 중 GNU 일부 URL timeout과 실제 SSH/systemd 미실행 한계를 유지한다. PID/포트/df 숫자는 canonical raw에서 직접 뽑고 서로 다른 attempt 수치를 섞지 않는다.

## 질문12개 / 상태45개

1. shell-boundary — 터미널 창과 Bash는 어떻게 다른가? 원문3.1/실습A/Q1.
   - terminal-shell: 설명 모델. '터미널 = 문자 입출력 창 / Bash = 명령 해석·실행기 / 프롬프트 모양 ≠ uid 증명'. 코드 대신 이 모델3줄 표시.
   - cd-builtin: native environment_path_cd.cd_builtin. 실제 명령 pwd; type cd; cd /tmp; pwd, 출력 /proof → cd is a shell builtin → /tmp. 현재 shell cwd 변경을 강조. 실제 terminal emulator 자체를 Linux에서 실행했다는 뜻 아님.
2. redirect-order — 순서만 바꿨는데 오류 출력은 어디로 갔나요? 원문3.1/Q2.
   - stdout-first: streams.redirect_stdout_then_stderr, a_bytes out\nerr\n, 부모 stdout/stderr 빈값, exit7. 그룹 producer 전체에 >a.log 2>&1 적용.
   - stderr-first: streams.redirect_stderr_then_stdout, b_bytes out\n, 부모 stdout err\n, stderr 빈값, exit7. 순서 설명.
   - append-output: 실제 append argv, a_after_append out\nerr\nappend\n. >> 추가, 원래a 초기내용과 이후내용 구분.
   - overwrite-output: 실제 overwrite argv, b_after_overwrite replace\n. > 기존b out\n대체. rm 같은 작업을 유도하지 않음.
3. pipeline-status — 앞 명령이 실패했는데 왜 파이프는 0인가요? 원문3.1/Q2.
   - default-pipeline: streams.pipeline_default 실제 wholeStatus0 / PIPESTATUS[7,0], stdout out / stderr err. 제어용 상태출력 줄과 payload를 구분.
   - pipefail-pipeline: streams.pipeline_pipefail 실제 wholeStatus7 / PIPESTATUS[7,0]. 오른쪽 마지막nonzero규칙이며 단순 첫값선택 일반화 금지. 실제 $?와 PIPESTATUS 동시 캡처 근거 필수.
4. environment-path — 자식이 받는 변수와 실행 파일은 어떻게 정해지나요? 원문3.1/실습A.
   - variable-local: environment_path_cd.unexported_child, DEMO_ONLY synthetic은 shell변수, child=unset.
   - variable-exported: exported_child, export이후 child=synthetic.
   - path-first: path_first_then_second, /tmp/d12-proof/path-first/demo, first.
   - path-second: path_second_then_first, /tmp/d12-proof/path-second/demo, second.
   JAVA_HOME은 PATH와 별개이고 실제host환경을 읽은 결과 아님. 깨끗한 합성 환경·자식프로세스 조건 노출.
5. file-directory-permissions — 파일 rwx와 디렉터리 x는 무엇을 허용하나요? 원문3.2/실습B/Q3.
   - mode-owner: file640 소유1000:2000, 관측UID1000 GID2000 groups[], read true/write true.
   - mode-group: 같은file UID1001 GID2000 groups[], read true/write false errno13.
   - mode-other: UID1002 GID3000 groups[], read/write false errno13.
   - parent-no-search: file644이나 parent no-x700 소유자외 UID1002, cat exit1 Permission denied.
   - known-path-search: parent711 UID1002, 알려진 known파일cat exit0/known.
   - directory-no-list: 같은711UID1002, ls exit2 denied. x는 이름목록 r이아님.
   - directory-unlink: UID1002가소유한 parent700과 파일444, rm자체fixture entry exit0/existsfalse. 파일쓰기비트와directoryentry삭제 분리, 이조건(ACL/LSM/sticky범위외)노출.
   root0결과는 별도 상세로만 두고 non-root표에합치지 않는다. mode700/711/640소유자와상위경로조건 raw/source대조.
6. signal-lifecycle — TERM 요청을 보냈으면 종료한 걸까요? 원문3.2/실습B/Q4.
   - term-ack-alive: signals.kill_term exit0, handler_ack ack, alive_after_ack_before_release true. 실제PID+starttime, 후관측ps 기본 표시.
   - term-released: 동일child release이후 parent_returncode0. '모든서비스가즉시정상종료'로일반화금지.
   - kill-observed: 별도 self-started sleepchild에 KILL, 실제Popen -9이며 shell exit137로바꿔쓰지않는다. handler cleanup파일의실측은없음. 'KILL은처리불가/정리기회없음'은원문개념이고실험으로cleanup을비교했다고표시금지.
7. socket-http — 포트가 열리면 HTTP도 준비됐나요? 원문3.2/3.4/Q6.
   - socket-listen: network_readiness PID와ss localhostephemeral LISTEN. 프로세스/소켓이있음만.
   - tcp-connected: nc exit0, 실제addr/port. HTTP미판정.
   - http-warming: curl exit0이지만 HTTP503/bodywarming. curl에--fail없음 명시, curl종료0과HTTP200혼동금지.
   - http-ready: 제어readyflag후 HTTP200/bodyready. 내부loopback만, 외부도달/ICMP/Java/systemd증거아님.
8. ssh-transfer — SSH의 서버 확인과 사용자 인증은 같은가요? 원문3.3/실습D/Q8.
   - ssh-host-key: 설명모델 '서버 host key → 접속 대상의 키 확인 / known_hosts → 이전에 신뢰한 서버 키 기록'. 실제키·지문·연결·검증결과없음.
   - ssh-user-key: 설명모델 '클라이언트 개인키 → 사용자 소유 증명 / 서버 계정 authorized_keys → 허용 공개키'. 실제원문 ssh명령은rawdetail로, 실제서비스정상판정없음.
   - rsync-dry-run: local_rsync_dry_run 실제argv local두경로, new.txt목록/전후dst2fileSHA동일. 원격SSH예시와다른추가Linux로컬실측, DRY RUN은실제복사아님.
9. systemd-start — Type=exec가 확인하는 시작은 어디까지인가요? 원문3.3/unit/Q6.
   - unit-context: original INI excerpt User/Group/WorkingDirectory/EnvironmentFile/ExecStart, orders계정/Java25경로환경전제. 미실행. EnvironmentFileKEY=value는shell실행아님/접두-는없는파일허용.
   - exec-boundary: explanatory model 'systemd → fork/execve(Java) / Type=exec → 실행 파일 시작 확인 / HTTP readiness → 별도 요청으로 확인'. 'execve가돌아온다'는오개념금지; 실제systemd실행미확인.
   - network-ordering: original-code-unrun After=network.target, 순서조건과네트워크연결/계속되는가용성분리. network-online.target도실제HTTP보장아님. 원문설명+공식문서모델.
10. unit-application — unit 편집·재읽기·재시작·자동 등록은 어떻게 다른가요? 원문실습D/Q5.
   전체 5상태는아래고정모델, 실제명령성공/active/PID/부팅결과없음.
   - unit-edited: 파일정의v2 / 관리자보유정의v1 / 실행프로세스v1 / 부팅등록변경없음.
   - daemon-reloaded: 정의v2 / 관리자v2 / 실행v1.
   - process-restarted: 정의v2 / 관리자v2 / 새프로세스v2 가정(성공조건하의모델). restart가실패할수있음표시.
   - boot-enabled: enable 요청은부팅자동등록 / 지금기동요청없음 / 현재프로세스유지모델.
   - enable-now: enable --now는등록+지금start요청 / HTTP준비확인은별도. 이미active서비스를restart한다고표시금지.
11. logs-disk — 경로를 지웠는데 왜 파일시스템 공간은 그대로인가요? 원문3.4/실습C/Q7.
   - log-sources: original-prose journal과텍스트파일로그구분, journalctl과tail/grep조회경계. journal실측없음.
   - disk-written: disk_df_du_deleted_open file8MiB=8388608, stat_blocks16384*512, du8388608, 실제df after_write와before_write별도.
   - disk-unlinked-open: 같은파일unlink후du그경로exit1ENOENT, fd열림, df사용블록/available변화없음. '디렉터리du전체0'로변환금지.
   - disk-closed: fd닫은뒤실제df/statvfs여유증가. 원래sampletmpfs조건표시,hostAPFS/다른마운트일반화금지.
   - memory-available: original-prose free -h는메모리 / available은회수가능cache등고려한추정 / 실제free미실행, 숫자없음. disk와memory단위별도.
12. container-observation — 컨테이너 안에서는 어떤 프로세스와 로그를 보나요? 원문실습C/Q8.
   - container-pid1: native-docker idleContainer.pid1Comm sleep / cmdline sleep300 실제관측. 주proofPID1python별개임.
   - container-exec: idle.execProcess 실제exec_pid>1, before/afterPID1sleep같음. exec추가프로세스가container주프로세스교체하지않음.
   - container-logs: dockerlogs 실제 D12 synthetic bootline. stdout/stderr driver와파일로그별개, 이미지에쉘도구없을수있음설명. 실제app서비스상태증거아님.

## 이미지와 포커스
질문마다별도 imagegen 1장 이상, 질문2의추가/덮어쓰기와질문5디렉터리권한을별도장으로나눈다. 질문11의journal/파일과memory도서로다른측정대상이므로각각분리해총16장을계획한다. 각각독립수평1672x941 PCdark, D11재질/정렬/문자위계기준. 대표시안에는한질문만보이고전체12개콜라주금지. selected JPGquality92/native폭높이와SHA/원본PNG외부경로/prompts/실제생성기록/선택·거절이유를남긴다. PNGrepo금지.
상태45개는시안안에서그상태의실제대상영역을좌표로선택(모두동일한전체좌표금지). 확대최대높이540px, 핵심글자읽힘, 모바일처리없음. 기본전체시안과포커스둘다실제PC실측후검수. 의미가정확하지않거나작으면생성교정.

## UI/테스트
질문선택/앞뒤상태/키보드/URL topic,stage,read/복사/확대/원문가기/reader/searchreturn을D11수준으로구현. 원문/기존genericmap/anchor/code/SHA보존. 공통build조건은D12만추가하고다른문서출력변화금지.
모든45상태의관측값·sourcefragments·code·codeKind/evidenceKind·copy가독립기대표와DOM에일치해야한다. production값으로자기기대값을만들지않는다.
복사pending동일A재선택/A→B→A/역순resolve/fallback/권한실패를검사. 버튼의성공상태가다른payload선택에새어나가지않아야한다.
sourceProof변경/잘못된관측값/모델을native로승격/목록포커스누락/코드출처경계틀림을mutant로검출한다. native대상명령을UI에서실행하지않는다.
메인실제PC45상태기본/확대+copy45,1280/1440/1672overflow,reader→scene/sourceanchor/Q&A8개개별접기/keyboard/reload/catalogquery복귀확인. 이미지SVG/그라데이션은HTMLcontrast만으로보증금지.
하네스task26만등록하고기존25+새1,build/visual/versioncards/parity/보존해시검증후로컬커밋. inventory는 새45개만 implemented로 기록하고 verified로 일괄 승격하지 않는다. 원문전체/134개완료는주장하지않음.
