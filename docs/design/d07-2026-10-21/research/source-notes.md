# Source notes — D07 사실 검수

확인일은 모두 2026-10-21 KST. UTC 날짜와 혼동하지 않도록 로컬 작업일 기준으로 기입. 검색과 페이지 열람은 웹 도구로 직접 진행했다. 아래는 읽은 원문의 요지이며 직접 인용은 각 페이지당 25단어 이하로 제한했다.

## 읽은 공식 자료와 세부 메모

1. **NIST SP 800-145 HTML** — https://csrc.nist.gov/pubs/sp/800/145/final — 정의 페이지가 5 essential characteristics, 3 service models, 4 deployment models를 명시한다. HTML 요약은 세부 설명이 생략되어 PDF를 함께 확인.
2. **NIST SP 800-145 PDF** — https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf — 5특성은 on-demand self-service / broad network access / resource pooling / rapid elasticity / measured service. 서비스 모델은 SaaS/PaaS/IaaS. Private cloud는 조직 전용이되 소유·운영 주체가 조직, 제3자 또는 혼합일 수 있으며 on/off premises 가능. Hybrid는 서로 다른 cloud infrastructure 2개 이상을 연결해 portability가 가능하게 한 구성이다. NIST 본문은 배치모델을 위치만으로 규정하지 않는다.
3. **NIST Multi-cloud WG** — https://csrc.nist.gov/projects/mcspwg/mcspw-charter — NIST는 SP 800-145의 네 deployment model이 현재의 복합 multicloud 구조를 충분히 설명하기 어렵다고 명시. 따라서 hybrid와 multicloud를 같은 taxonomy 계층으로 설명하지 않는다.
4. **IBM Data Center/colocation** — https://www.ibm.com/think/topics/data-centers — 전통 colocation 예시는 고객 인프라 소유, 공간 임대, 하드웨어 관리 책임. 다만 현재는 원격 관리/모니터링 서비스도 제공될 수 있으므로 계약이 책임을 바꿀 수 있다. IDC 건물 이용과 클라우드 서비스 이용은 동일 개념이 아니다.
5. **AWS Shared Responsibility** — https://aws.amazon.com/compliance/shared-responsibility-model/ — EC2에서는 guest OS update/patch, instance에 설치한 app/utilities, security group 설정이 고객 책임. S3/DynamoDB 같이 추상화된 서비스는 provider가 infra/OS/platform을 운영하지만 고객 data classification, encryption choices, IAM permissions는 남는다.
6. **Azure Shared Responsibility** — https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility — 책임 매트릭스에서 data, configurations/settings, identities/users는 네 모델 전부 고객. Applications는 IaaS 고객, PaaS/SaaS shared. OS는 IaaS 고객, PaaS/SaaS Microsoft. 앱코드와 사용자별 제품 설정을 한 셀에 압축하면 코드 작성/취약점 수정, 테넌트 설정, identity/access 책임이 구별되지 않는다. Microsoft는 문서가 개별 계약을 수정하지 않는 illustrative governance guidance라고 제한한다.
7. **EKS Managed Node Groups** — https://docs.aws.amazon.com/eks/latest/userguide/managed-node-groups.html — node provision/lifecycle을 관리하지만 AWS가 패치 AMI를 만들더라도 관리형 node group에 배포하는 일은 고객 책임일 수 있다.
8. **EKS Fargate** — https://docs.aws.amazon.com/eks/latest/userguide/fargate.html — VM node group 운영 부담을 줄이는 설명과 함께 EKS 사용이 shared responsibility를 바꾸지 않는다고 명시. CaaS에서 workload/config 책임을 구분한다.
9. **Dockerfile reference** — https://docs.docker.com/reference/dockerfile — FROM base image 지정, COPY 파일/디렉터리 이동, EXPOSE는 이미지가 사용할 port 선언, ENTRYPOINT는 container 시작 시 수행할 executable. Wildcard는 filepath.Match 규칙. 여러 source가 지정되거나 wildcard가 여러 파일과 매치되면 destination은 `/`로 끝나는 directory여야 한다. 따라서 `COPY build/libs/*.jar app.jar`는 JAR가 하나라고 보장하지 않으면 단일파일 destination으로 부적절하다.
10. **Docker Desktop Mac permissions** — https://docs.docker.com/desktop/setup/install/mac-permission-requirements/ — daemon/containers가 lightweight Linux VM에서 동작하며 Linux VM이 macOS host와 경계가 된다. macOS Darwin kernel이 Linux container kernel이라는 설명은 없다.
11. **Docker Desktop networking** — https://docs.docker.com/desktop/features/networking/ — Engine은 Linux VM 내부. Mac에서 host 접속 포트를 backend가 VM을 거쳐 container로 전달한다.
12. **Docker publish port** — https://docs.docker.com/get-started/docker-concepts/running-containers/publishing-ports/ — EXPOSE로 선언한 포트는 기본 publish되지 않는다. 실제 host mapping은 container creation 시 `-p`/`--publish`로 설정한다.
13. **AWS resiliency shared responsibility** — https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/shared-responsibility-model-for-resiliency.html — EC2 multi-location, self-healing, workload architecture는 고객 할 일. Managed S3/DynamoDB에서도 backup/versioning/replication strategy는 고객 데이터 복원력 책임. Multi-AZ는 한 AZ 문제에 대한 HA 전략 일부이지 전체 DR 보증이 아니다.
14. **AWS AZ fault isolation** — https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/availability-zones.html — AZ는 분리된 physical infra/failure isolation 영역으로 설계된다. 이는 앱 인스턴스 수, 데이터 복제, 전환 구성 완료를 의미하지 않는다.
15. **Route 53 health checks** — https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover-complex-configs.html — DNS latency/weighted record 선택과 health check는 설정 기반 의사결정이다. probe 누락, alias health 설정 등으로 결과가 달라질 수 있고 DNS가 앱의 의미적 정상성/세션 이동을 판단하는 것은 아니다.
16. **Google Cloud provider comparison** — https://docs.cloud.google.com/docs/get-started/aws-azure-gcp-service-comparison — Google의 명시적 표현은 “similar or comparable offerings”. 이름 대응은 기능 탐색용이지 API, SLA, 보안 책임, 의미의 완전 호환성 선언이 아님. 예: EKS/AKS/GKE; Compute VM; App Engine/App Service/Elastic Beanstalk; Cloud SQL/RDS/Azure Database; Cloud Storage/S3/Blob; Cloud Load Balancing/ELB/Azure LB; Cloud DNS/Route 53/Azure DNS; Artifact Registry/ECR/ACR.
17. **S3 object keys** — https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html — S3는 bucket/object의 flat model. slash prefix와 delimiter로 논리적 hierarchy/folder UI를 보일 수 있다. POSIX filesystem directory semantics라고 그리지 않는다.
18. **Azure Data Lake HNS** — https://learn.microsoft.com/en-us/azure/storage/blobs/data-lake-storage-namespace — Azure Storage에서 hierarchical namespace를 활성화할 수 있으며 directory/file semantics 제공. 다만 전환 후 flat namespace로 되돌릴 수 없다고 안내하므로 “모든 object storage는 POSIX처럼 못 씀” 같은 전체 제품군 금지가 틀리다.
19. **AWS 7R** — https://docs.aws.amazon.com/prescriptive-guidance/latest/large-migration-guide/migration-strategies.html — 순서는 문서의 리스트와 별개로 개념 구분: Retire decommission/archive, Retain 원본 유지·이전 보류, Rehost 변경 없이 옮김, Relocate 플랫폼/서버 대량 이동, Repurchase 다른 제품으로 대체, Replatform 최적화 일부 적용, Refactor/re-architect 구조 변경. AWS는 대규모 migration에서 refactor가 복잡해 일반적으로 먼저 rehost/relocate/replatform하고 나중에 modernize할 수 있다고 설명한다. 보편적 필수 절차는 아님.
20. **Savings Plans** — https://docs.aws.amazon.com/savingsplans/latest/userguide/sp-ris.html — 금액 commitment에 대한 할인 모델의 유연성 개요를 확인. 본 산출물에는 숫자 가격/할인율을 싣지 않음.
21. **EC2 Spot interruptions** — https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-interruptions.html — spare capacity를 제공하는 대신 provider가 회수하면 interrupt 가능하며 stop/terminate/hibernate 선택될 수 있다. 시점별 capacity 보장이라고 표현하지 않음.
22. **Spring Boot Actuator (3.4 reference)** — https://docs.spring.io/spring-boot/3.4/reference/actuator/endpoints.html — liveness/readiness는 `/actuator/health/liveness`, `/actuator/health/readiness` 등 별도 health group. 외부 시스템 체크를 기본 readiness에 자동 추가하지 않으며 외부 의존 체크는 신중히 구성해야 한다. 이 문서는 예시 버전의 개념 근거로 사용했고, Java 21/Boot 4.1.1 fixture 호환·실행 증거로 사용하지 않음.

## 접근 실패와 검증 한계

- 2026-10-21 KST: AWS Prescriptive Guidance 7R URL 첫 open 호출이 `UnexpectedStatusCode`로 실패. 검색에서 해당 공식 결과를 확인한 다음 동일 URL 재시도하여 페이지 본문을 성공적으로 열었음. 최종 claims는 성공 열람 본문에서만 도출.
- Codex CLI 0.163.0 및 `codex --help` 실행. 설정에서 default model `gpt-6-astra`, provider list `lite_llm`만 조회되어 `gpt-6-luna` CLI 제공자/접근 가능성을 확인하지 못함. LiteLLM 호출, 다른 모델 실행, 재위임은 안 함. 조사는 이 세션에서 접근된 웹 도구로 실제 원문을 읽고 진행.
- NIST AWS/Azure/GCP/Docker/Spring 공식 페이지는 검색 또는 open에서 본문 접근 성공. HTTP 상태를 별도 네트워크 도구로 점검하지는 않음.
- 정본/구판은 read-only로만 열고, SHA-256이 다름을 확인. 이 작업은 원문 코드 실행, 포트 할당, build, Docker image build/run, cloud/VM/container/AZ 실패 실험을 하지 않음.
- 그러므로 `/health`가 실제 Java 21 / Spring Boot 4.1.1 fixture에서 응답하는지, DB 연결/readiness, 노드·리전 상태, AZ 전환, DR/RTO/RPO, 운영 로그는 검증 범위 밖. 컨테이너의 base image 이름만으로 Java 25 실행 증명 불가.
- 페이지 간 매트릭스는 추상화된 일반 모델이다. 실제 product, tier, feature flag, region, deployment, enterprise contract와 개별 backup/reliability policy는 서비스별 문서를 다시 확인해야 한다.
