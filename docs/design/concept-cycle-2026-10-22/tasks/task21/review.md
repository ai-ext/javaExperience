# task21 · D07 독립 감사

**판정: needs_completion.** 기존 부분 보강은 선언된 범위에서 일관되지만 전체 원문 학습 장면은 미완료다. spec을 승인하지 않았으므로 quality는 진단만 기록했다.

- 기준 HEAD: `4b0493af52b1a06decca909d6bf9a8b6f9610686`
- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D07-onprem-vs-cloud.md (300줄, SHA256 `0945450013d203109827f96fe2450233a1c79de1ce6caa4e904ccebd3da228b2`)
- 새 검사: `npm --prefix tools/site run test:d07` → **actual exit 0**, 2026-10-22T00:14:00.877302+00:00 ~ 2026-10-22T00:14:04.416374+00:00.
- 원시 출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task21/test-d07.raw.log; 시각·HEAD·소스 해시: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task21/test-d07.run.json.
- 검사 범위는 Node/JSDOM·생성HTML·보존된 근거/39개 dependency SHA다. native 서버 재실행/현재브라우저 검증은 아니다.

## spec: 원문 전문 대조

중첩 가능한 주요 의미 단위 74개: covered 40 / partial 29 / missing 2 / unrun 3. 원문 줄 커버리지 백분율이 아니다. 기존13질문·36상태는 native8/model·원문미실행28이며, 원문 bytes 보존과 전체 장면 완료를 구분했다.

전수표: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task21/source-coverage.json

| 원문 의미 단위 | sourceLines | stageIds | 판정 | 공백 또는 근거 |
|---|---|---|---|---|
| 표제·요약: 위치/책임/선택 기준 | [1, 5] | placement-onprem, responsibility-infra, cost-cloud, migration-keep | partial | 규제·수요 변동·장애 허용도·팀 역량을 하나의 선택 사례에 대입하는 독립 장면 없음 |
| 1 NIST 운영 모델 정의 | [7, 10] | taxonomy-five, taxonomy-service, taxonomy-deploy | covered | 5특성/3서비스/4배치 모델과 executed:false 명시 |
| 1 요구사항→배치 후보 선택 지도 | [11, 26] | placement-onprem, placement-private, placement-hybrid | partial | 요구사항 입력에 따라 후보를 강조하는 규제→트래픽→인력→비용 의사결정 장면 없음 |
| 1 온프레미스 전체 스택 책임 | [28, 28] | responsibility-infra, placement-onprem | covered | 책임표 physical/OS/application/data 층, placement 이미지 on-prem/IDC 계약 경계 |
| 1 cloud EC2 및 관리형 DB 책임 | [30, 30] | responsibility-infra, responsibility-platform, managed-platform | partial | 관리형 DB의 스키마·백업 정책·잘못된 쿼리 책임은 독립 장면에서 구체적으로 비교하지 않음 |
| 1 D01/D06/D02 관계 안내 | [32, 32] | — | covered | 현재 HTML 원문에 관계 안내 보존; 보조 내비게이션으로 독립 stage 요구하지 않음 |
| 2 용어: 온프레미스 | [38, 38] | placement-onprem, responsibility-infra | covered | 고객 운영·시설/OS/앱 책임을 이미지/표로 구분 |
| 2 용어: IDC | [39, 39] | placement-onprem | covered | 시설 제공과 cloud 모델은 다른 축, 계약별 운영주체 |
| 2 용어: 코로케이션 | [40, 40] | placement-onprem | covered | 고객 서버/제공자 시설·전원·회선, 계약 경계 |
| 2 용어: 퍼블릭 클라우드 | [41, 41] | taxonomy-deploy, placement-onprem | partial | public 전용 focus/stage 및 multi-tenant 격리 설명의 DOM 관찰값 없음 |
| 2 용어: 프라이빗 클라우드 | [42, 42] | placement-private | covered | 전용성·off-premises/제3자 운영을 분리 |
| 2 용어: 하이브리드 | [43, 43] | placement-hybrid | covered | 별개 cloud infrastructure 결합; 단순 위치 혼용을 NIST 정의와 구분 |
| 2 용어: 멀티클라우드 | [44, 44] | placement-hybrid | partial | 공급자 종속 완화 대 운영·동기화 복잡성 증가의 구체 선택 비교 없음 |
| 2 용어: 리전 | [45, 45] | traffic-normal | partial | 지리·법률·지연·서비스 제공 여부로 region을 고르는 독립 내용 없음 |
| 2 용어: AZ | [46, 46] | traffic-failure | covered | AZ-a/AZ-b와 조건부 대체 경로, 복수AZ 자동 HA 아님을 명시 |
| 2 용어: IaaS | [47, 47] | responsibility-infra, managed-catalog | covered | guest OS customer/physical provider·EC2/AzureVM/GCE 그림 |
| 2 용어: PaaS | [48, 48] | responsibility-platform, managed-platform | covered | OS/runtime 위임·고객 app/data/access/정책과 제품별 제약 |
| 2 용어: SaaS | [49, 49] | responsibility-saas | covered | vendor 제품 운영과 고객 설정·접근·확장·데이터 구분 |
| 2 용어: 서버리스/FaaS | [50, 50] | — | missing | 함수 실행·프로비저닝 추상화·과금/서버 존재의 의미 연결 없음 |
| 2 용어: CaaS | [51, 51] | managed-k8s | covered | control plane 위임과 worker 옵션/워크로드·이미지·접근 책임 구분 |
| 2 용어: 하이퍼바이저 | [52, 52] | virtualization-vm | partial | hypervisor 역할·예시와 VM 이미지/시작 overhead를 DOM 관찰값으로 비교하지 않음 |
| 2 용어: VM | [53, 53] | virtualization-vm | partial | VM 중지 시 디스크 설정별 보존 조건 없음 |
| 2 용어: 컨테이너 | [54, 54] | virtualization-container, virtualization-mac | covered | 일반 Linux kernel 공유, Mac LinuxVM, 제품별 예외·미실행 경계 |
| 2 용어: 오브젝트 스토리지 | [55, 55] | storage-key, storage-hns | covered | S3 general purpose key/prefix/List API·directory bucket/HNS 경계 |
| 2 용어: 오토스케일링 | [56, 56] | managed-platform, cost-buying | partial | CPU 임계값→인스턴스 수와 stateless/data 계층 조건을 이어 설명하는 장면 없음 |
| 2 용어: 로드밸런서 | [57, 57] | traffic-normal, traffic-failure | covered | DNS 조회 뒤 직접 LB 요청·probe/정책 조건·DB 경계 그림 |
| 2 용어: 레지스트리 | [58, 58] | managed-catalog | covered | ECR registry≠runtime, 이미지 공급·설정별 scan·권한 역할 |
| 2 용어: 온디맨드 | [59, 59] | cost-buying | covered | 비약정·유연성·할인 옵션과 tradeoff 그림, 실제 가격 주장 없음 |
| 2 용어: 예약·약정 | [60, 60] | cost-buying | covered | usage commitment의 기간/예측·유연성 tradeoff, 실제 약정 없음 |
| 2 용어: 스팟 | [61, 61] | cost-buying | covered | capacity 회수/중단 가능·fault tolerant workload, 실제 중단 실험 없음 |
| 2 용어: 이그레스 | [62, 62] | cost-cloud | covered | 비용 그림 network/egress: 서비스간·인터넷·타region 전송 비용 항목 |
| 3.1 시설→앱·데이터 스택 및 코로케이션 | [66, 68] | placement-onprem, responsibility-infra | covered | 위치/계약·물리/OS/앱 책임표 |
| 3.1 AWS of/in 및 S3 IAM/암호화 | [70, 70] | responsibility-infra, responsibility-saas, storage-key | partial | S3 암호화 선택 및 서비스별 IAM 담당을 한 자산 사례로 연결하지 않음 |
| 3.1 책임 매트릭스 | [72, 79] | responsibility-infra, responsibility-platform, responsibility-saas | covered | onprem/IaaS/PaaS/SaaS의 데이터·설정·identity/앱/네트워크/OS/물리 표; SaaS broad shared 정정 |
| 3.1 관리형≠안전보장 | [81, 81] | responsibility-platform, responsibility-saas | partial | 과도한 app권한/공개버킷 같은 구체 오류·교정 전후 장면 없음 |
| 3.2 VM/container 층·조합 | [83, 96] | virtualization-vm, virtualization-container, virtualization-mac | covered | guest kernel/host kernel·Mac 경계와 VM안 container; 실행/성능 미측정 명시 |
| 3.3 DNS→HTTPS LB→정상 앱→DB→응답 | [98, 116] | traffic-normal, traffic-failure | covered | traffic-v4 실제 열람: DNS는 HTTP proxy 아님; 정상과 장애 경로를 대안으로 구분 |
| 3.3 Region/AZ 의미와 상태 외부화 | [118, 118] | traffic-failure | partial | region 선정 기준과 단일 DB/로컬세션→외부화한 구조의 전후 사례 부족 |
| 3.4 VM/K8s/PaaS 기능별 제품 대응 | [120, 126] | managed-platform, managed-k8s, managed-catalog | covered | managed-v2 직접 열람: EC2/AzureVM/GCE, EKS/AKS/GKE, 플랫폼 제품 비교·호환인증 아님 |
| 3.4 관리형 RDBMS와 JDBC/마이그레이션/권한 | [127, 127] | — | missing | RDS/AzureDatabase/CloudSQL 및 JDBC·쿼리·schema 역할 연결 장면 없음 |
| 3.4 Object storage 제품 대응/URL권한 | [128, 128] | storage-key, storage-hns | partial | S3/Blob/GCS 대응과 업로드 URL 권한 비교 없음 |
| 3.4 LB 제품 대응/TLS·헬스체크 | [129, 129] | traffic-normal | partial | AWS/Azure/GCP 제품 대응·TLS종료/세션과의 차이를 독립 장면에서 다루지 않음 |
| 3.4 DNS 제품 대응 | [130, 130] | traffic-normal | partial | Route53/AzureDNS/CloudDNS 기능 대응은 원문에만 있음 |
| 3.4 Registry 공급(push/pull)/scan | [131, 133] | managed-catalog, storage-key | covered | runtime과 image/artifact store 구분, 실제 제품·옵션 완전 호환 인증 아님 |
| 3.5 비용 범주와 구매 옵션 | [135, 137] | cost-onprem, cost-cloud, cost-buying | covered | cost-v2 직접 열람: 장비감가·시설·인력/compute·storage·request·로그·backup·network·잔여인력; TCO식/요금 측정 아님 |
| 3.5 7R 범위·선택과 점진적 전환 | [139, 141] | migration-keep, migration-move, migration-change | covered | migration-v3 직접 열람: 선택지/비필수순서/변경범위·종속성·규제/파일럿 고려; 실제 이전 아님 |
| 4 실습 환경과 선택 cloud 비용 경계 | [143, 145] | artifact-source, dockerfile-build | covered | 추가Java21 vs 원문Java25, Docker/cloud 미실행을 첫 화면/근거에 명시 |
| 4.1 SpringBoot4.1/Java25 원문 실습 | [147, 184] | artifact-source, artifact-build, health-ok | unrun | 원문Java25+bootRun/localhost8080의 정확한 환경 실행은 미실행; 이번 감사도 재실행 안 함 |
| 4.1 추가 native 원문 Java·JAR·HTTP 관찰 | [151, 184] | artifact-source, artifact-build, artifact-copies, health-ok, health-actuator, lifecycle-two, lifecycle-one, lifecycle-clean | covered | native fresh 실행은 이번 범위 밖; 과거 관측으로만 표기 |
| 4.2 원문 Java25 Dockerfile·build/run/curl | [186, 203] | dockerfile-build, dockerfile-publish, dockerfile-copy | unrun | 실제 image build/run/port publish/container curl 없음; Java21JVM 성공으로 대체하지 않음 |
| 4.2 패키징과 호스트/비밀/로그 책임 | [205, 205] | dockerfile-build, virtualization-mac, managed-platform | partial | 비밀주입·로그수집 주체/관측의 구체 사례 없음 |
| 4.3 실행 위치3가지/배포 주체 | [207, 220] | managed-platform, managed-k8s, artifact-copies | partial | 원문bootJar→registry push→VM pull/K8s/PaaS 전체 공급 경로를 이어 보는 장면 없음 |
| 4.3 선택 ECR push/EC2 pull·실행 | [222, 222] | managed-catalog, dockerfile-build | unrun | cloud/registry/VM 미실행은 의도한 경계; 감사에서 실행 요구하지 않음 |
| 4.3 계정정보/immutable tag·scan 연결 | [224, 224] | managed-catalog | partial | latest 대비 commitSHA/release tag·scan 결과를 연결하는 독립 예 없음 |
| 5 오해: 서버 없음 오해 | [228, 228] | placement-onprem, responsibility-infra | covered | 위치/운영/physical 책임 구분 |
| 5 오해: 보안 전가·소유자 체크리스트 | [229, 229] | responsibility-infra, responsibility-saas | partial | 패치·IAM·백업 소유자 자산별 체크리스트 없음 |
| 5 오해: 복수AZ 무중단 오해 | [230, 230] | traffic-failure | partial | 상태 외부화·장애주입·복구 검증 장면 없음 |
| 5 오해: 컨테이너 안전 오해 | [231, 231] | virtualization-container, managed-k8s | partial | 비root·최소이미지·scan·runtime권한 제한의 위험/개선 사례 없음 |
| 5 오해: 항상 저렴 오해 | [232, 232] | cost-onprem, cost-cloud | partial | 유휴/NAT·예산/태그/알람·이상egress 모니터링 조치 없음 |
| 5 오해: multicloud 종속/장애 제거 오해 | [233, 233] | placement-hybrid | partial | API/IAM/데이터포맷 복잡도·다중리전 대안 선택 사례 없음 |
| 5 오해: Replatform=Refactor 오해 | [234, 234] | migration-change | covered | 제품구매/플랫폼/구조 변경 및 단계별 평가 구분 |
| 6 설계 메모: 요구사항 선택 지도 | [238, 238] | placement-onprem, placement-private, placement-hybrid | partial | 규제→트래픽→운영인력→비용 순 입력/후보강조 없음 |
| 6 설계 메모: 책임 경계 단계 | [239, 239] | responsibility-infra, responsibility-platform, responsibility-saas | covered | IaaS/PaaS/SaaS stage/표/focus |
| 6 설계 메모: 요청생명주기·장애우회 | [240, 240] | traffic-normal, traffic-failure | covered | 정상/조건부 장애 대안 경로·focus |
| 6 설계 메모: VM/container 층 비교 | [241, 241] | virtualization-vm, virtualization-container, virtualization-mac | covered | VM/kernel/container 층·Mac 추가모델 |
| 6 설계 메모: 전환 의사결정 타임라인 | [242, 242] | migration-keep, migration-move, migration-change | partial | pilot→비용/장애 검증→확대의 단계별 관찰값/성공기준 없음 |
| 7 Q1 위치보다 조달·운영 경계/IDC | [246, 250] | placement-onprem, taxonomy-five | covered | 위치·전용성·운영/셀프서비스 모델을 설명 |
| 7 Q2 IaaS 패치/보안그룹/IAM·PaaS데이터 | [252, 256] | responsibility-infra, responsibility-platform, responsibility-saas | covered | guestOS와 데이터·설정·identity 책임표/이미지 |
| 7 Q3 리전선택과 DR 검증 | [258, 262] | traffic-failure | partial | 데이터주권/법·지연·서비스 제공 region선정, 복제지연/DNS/키/복구절차 사례 없음 |
| 7 Q4 VM/container 비교·패치 | [264, 268] | virtualization-vm, virtualization-container, virtualization-mac | partial | 시작/밀도 tradeoff 및 이미지 사용자공간 rebuild/host patch 책임을 단계별 연결 안 함 |
| 7 Q5 관리형K8s 잔여책임·단순대안 | [270, 274] | managed-k8s, managed-platform | partial | 작은SpringBoot에 K8s/단일VM/PaaS를 팀역량·운영표준으로 고르는 사례 없음 |
| 7 Q6 총비용/기간·Spot단일서버 | [276, 280] | cost-onprem, cost-cloud, cost-buying | partial | 1~3년 동등트래픽 TCO 비교 구성과 single stateful server Spot 위험 사례 부족 |
| 7 Q7 7R 선택·점진현대화 | [282, 286] | migration-keep, migration-move, migration-change | covered | 규제·의존성·목표·팀·위험으로 전략별 선택/비필수순서 |
| 8 참고문헌11개 보존/근거 연결 | [288, 300] | — | covered | 현재 URL 유효성/최신 제품계약 재조회는 감사범위 밖 |

## 확정 범위 공백 (spec)

### D07-S01 · important · coverage_gap

/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d07-lesson-data.mjs:747

서버리스/FaaS의 독립 보충 장면이 없다.

- 근거: 원문 L50의 함수 실행·프로비저닝 추상화·서버 존재 의미는 원문 HTML에만 남는다. 13 lesson/36 stage에 대응 항목이 없다.
- 보완: Lambda/Functions 예시를 실제 배포 없이 설명하는 작은 모델 장면을 추가하고 함수/물리서버/제공자·고객 책임을 연결한다.
- 검증: 새 stage의 source L50 연결·executed:false·서버가 사라진다는 오해 방지·함수 단위 실행/과금 의미를 독립 spec 검토하고 D07 테스트+메인360px 확인을 한다.

### D07-S02 · important · coverage_gap

/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d07-lesson-data.mjs:1628

원문 서비스 대응표 중 관리형 RDBMS 행의 독립 장면이 없다.

- 근거: managed-v2의 실제 열람 표는 VM/K8s/PaaS/registry 4행이다. 원문 L127 RDS/Azure Database/Cloud SQL의 JDBC·migration·쿼리·권한 책임이 현재 stage/관찰값으로 연결되지 않는다.
- 보완: managed-catalog에 관리형 DB 예시와 팀의 JDBC/schema/query/access·backup 정책 책임을 보충한다. URL storage/LB/DNS 나머지 기능 대응의 partial도 함께 계획하되 호환/실운영 인증으로 쓰지 않는다.
- 검증: source L124~133을 행별 stage에 대조하고 DB 제품을 runtime/registry와 구별하는 값·검사를 추가한다. 실제 DB/cloud 실행 없이 모델임을 명시한다.

### D07-S03 · important · coverage_gap

/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d07-lesson-data.mjs:1563

Region 선택·DR·운영 예방 조치의 핵심 조건은 부분 설명에 머문다.

- 근거: traffic 두 stage는 정상/복수AZ≠자동복구를 설명한다. source L258~262 region 선택(주권·법·지연·서비스), key/DNS/복제지연·복구시험 사례가 없고 L229~233 소유자/비root/알람·태그/멀티클라우드 tradeoff도 관찰할 전후 사례가 없다.
- 보완: region 조건 비교, 단일DB/로컬세션 대 외부화 구조·백업/복구 책임, 컨테이너·비용 운영 예방 항목을 모델의 작은 묶음으로 설계한다. 실제AZ/DR/scaling 미실행을 유지한다.
- 검증: 선택 조건과 예상 위험/책임을 source별 값으로 검증하고 설명모델과 실측의 라벨을 검사한다. 메인 desktop/mobile stage·확대·원문 연결을 확인한다.

### D07-S04 · important · coverage_gap

/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d07-lesson-data.mjs:1889

배치 선택과 전환 파일럿의 단계별 의사결정 흐름은 독립 장면으로 완성되지 않았다.

- 근거: source L238의 규제→트래픽→인력→비용 후보 강조와 L242의 의존성조사→7R→pilot→비용/장애검증→확대가 현재 비교 그림·7R 세 stage와 완전히 대응하지 않는다. VM중지/디스크·stateless autoscale 조건 등 표의 partial도 남는다.
- 보완: 기존 배치/7R 설명을 보존하고 요구조건 사례 한 건의 후보·변경범위·파일럿 성공기준을 단계별로 연결한다. 남은29partial의 실제 작업 범위를 메인이 확정한다.
- 검증: 전수표의 partial마다 새/기존 stage와 남긴 제한을 지정하고 sourceLines-stageIds를 다시 대조한다. actual migration/TCO/HA 증거를 만들지 않는다.

## quality: 진단만 수행

확정 기술 결함은 0개다. 범위 공백 4건은 위 spec에 기록했으며 품질 승인으로 우회하지 않았다. 수정 후 fresh spec→quality 재검토가 필요하다.

- 기존36상태 내 확정 기술 오류/critical/important/minor 발견 없음. 이는 전체 문서 quality 승인이 아니다.
- 8 native 상태와28 model/unrun 상태의 CHECK/PASS 노출이 구분되고 모델6개 executed:false가 유지된다.
- 같은 artifact 두 사본/두JVM은 동일 Mac 직접HTTP 근거이며 원격 VM/container/AZ/자동LB/HA로 주장하지 않는다.
- /health literal ok와 미등록Actuator404 application/json, 원문Java25 대 추가target21,39dep 대34nested,143 HTTPJVM 종료 대 별도 build exit0 경계가 일관된다.
- IaaS guestOS·SaaS broad applications shared·일반Linux kernel/MacVM·EXPOSE/publish·COPY glob·DNS주소조회·TCO 단순식·7R 선택의 조건을 renderer/data/근거에서 구분한다.
- 자동검사는 실제 DB/scaling/복원력/가격 실측을 하지 않으며 학습자가 같은 뜻으로 이해했는지 인증하지 않는다.

## 실제 열람과 실행 경계

실제로 view_image로 본 시안6개:

- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d07-2026-10-21/images/responsibility-v3.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d07-2026-10-21/images/traffic-v4.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d07-2026-10-21/images/cost-v2.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d07-2026-10-21/images/placement-v2.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d07-2026-10-21/images/managed-v2.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d07-2026-10-21/images/migration-v3.jpg

실제로 본 역사캡처3개 (새 브라우저 확인 아님):

- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d07-2026-10-21/captures/desktop-responsibility.jpg · JPEG 1672×2517
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d07-2026-10-21/captures/mobile-traffic.jpg · JPEG 360×2534
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d07-2026-10-21/captures/desktop-lifecycle.jpg · JPEG 1672×3235

- 책임표의 provider/customer/shared와 DOM 단계가 대응한다.
- traffic 그림은 DNS 응답 뒤 client→LB HTTPS와 정상/장애 대안경로를 구분한다.
- cost 그림은 비용범주·backup·egress·잔여인력·기호식의 한계를 명시한다.
- 역사 desktop-lifecycle에서 긴 dt는 값과 분리되어 보이며, mobile-traffic은 확대그림의 일부만 보이는 상태와 가로이동 안내가 있다. 가로이동을 현재 실행한 것은 아니다.

- 현재 실제 브라우저 조작은 메인 담당이며 이번 reviewer는 호출하지 않았다. 과거캡처 3개와 시안6개만 실제 열람했다.
- 36상태 전수의 현재 pixel/레이아웃 검수 및 학습자 이해도 인증은 하지 않았다.
- 원문Java25·Docker/container/원격VM·cloud·registry·DB·LB/AZ·DR/백업복구·운영scaling·가격/TCO·실제migration을 실행하지 않았다.
- fresh Node 검사 통과는 저장된 근거/DOM 일치의 확인이며 Java 서버/HTTP 실험의 fresh 재실행이 아니다.
- 공식 URL을 새로 열거나 CLI/LLM을 호출하지 않았다. source-proof와 research의 기존 공식근거 기록을 읽었으며 제품별 현행계약/요금은 인증하지 않는다.
- 교육 목표의 JPA flush/commit/rollback/별도 DB관찰은 이 원문의 실행 예제에 없는 주제다. D07에 임의 DB 과제를 추가하거나 200 ok를 DB진단으로 해석하지 않는다.

## 남은 묶음

- 빠진 독립 의미 장면: FaaS L50, 관리형 관계형DB 제품/애플리케이션 책임 L127
- 조건·운영·의사결정 확장: 리전 선택·DR/백업 복구/세션·상태 외부화, IAM/패치·비root/이미지·비용알람/태그·멀티클라우드 선택, 서비스 표 나머지 대응·immutable tag/scan·VM디스크/autoscale 조건, 요구조건→배치와 조사→파일럿→확대
- 실행 경계 유지: 원문Java25/컨테이너 경로, 선택 ECR/EC2 cloud 경로, 실운영LB/AZ/DR/scaling/요금·migration은 현 근거로 미실행 유지
- 메인 현재브라우저 관문: desktop/mobile topic·stage·keyboard·확대/pan·copy·원문·overflow

reviewer는 application·원문·기존 증거·공유 장부·Git·다른task를 수정하지 않았다. 보고서 작성 스크립트의 초기 ValueError는 자기 출력에서 교정했고 D07 실제 검사 exit0과 구분한다.

판정: needs_completion
fullDocumentComplete: false
커버리지: 74 = covered 40 / partial 29 / missing 2 / unrun 3
이슈 수: spec 범위 공백 4 / quality 결함 0
actual exit: 0
