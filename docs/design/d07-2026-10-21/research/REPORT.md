# D07 사실 검수 — 온프레미스 vs 클라우드

확인일: 2026-10-21 KST. 읽기 전용 원문은 정본 300줄과 구판 294줄이며 SHA-256이 다르다. 공식 페이지 22개 열람 성공(고유 URL 기준), 한 URL은 재시도 후 성공했다.

## 판정

1. **클라우드는 위치만의 구분이 아니다.** NIST SP 800-145: 5특성(온디맨드 셀프서비스·네트워크 접근·자원 풀링·탄력성·측정), IaaS/PaaS/SaaS, public/private/community/hybrid. Private는 조직 전용이어도 제3자가 운영하거나 off-premises일 수 있다. Colocation/IDC는 시설·공간·전력·냉각·회선을 제공하며 고객 서버의 장비·OS 책임은 관리계약에 따라 남는다. Hybrid는 NIST 배치모델이지만 multicloud는 동일 분류항목이 아니며 NIST도 옛 taxonomy의 한계를 인정한다. [NIST SP 800-145](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf) · [NIST multicloud](https://csrc.nist.gov/projects/mcspwg/mcspw-charter)

2. **SaaS ‘앱코드·설정 공유’ 단일 셀은 모호하다.** AWS EC2에서 guest OS·패치·앱·security group은 고객, 추상화 서비스에서도 데이터 분류·암호화 선택·IAM은 고객이다. Azure는 데이터·설정·계정/사용자 접근을 전 모델의 고객 책임, OS를 IaaS 고객·PaaS/SaaS 공급자, 앱을 IaaS 고객·PaaS/SaaS shared로 표시한다. 앱코드까지 공유라 그리면 SaaS 제품 코드 운영이나 설정·접근제어 책임을 오해한다. identity infrastructure와 user access도 별개다. Azure 표는 계정/사용자와 접근관리를 고객 책임으로 두지만 디렉터리 기반시설은 서비스별로 달라진다. Runtime은 두 표의 독립 행이 아니므로 실제 PaaS 제품 문서에서 확인한다. 코드 보안·서비스 설정·데이터도 나누고 제품/계약별 차이를 남긴다. EKS 관리형 노드도 패치 AMI 배포가 고객 몫일 수 있고 Fargate도 이미지·앱·설정 책임을 지우지 않는다. 관리형은 모든 보안·백업 책임의 면제가 아니다. [AWS 책임표](https://aws.amazon.com/compliance/shared-responsibility-model/) · [Azure 책임표](https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility)

3. **VM·컨테이너·Dockerfile.** VM은 guest OS/kernel을 포함하고 Linux 컨테이너는 Linux kernel을 공유하므로 VM 안에서 container 실행 가능. Docker Desktop Mac은 Linux VM 안에서 Engine/containers를 실행하며 Darwin kernel과 구별된다. `FROM` 기반 이미지, `COPY` 파일 복사, `EXPOSE` 포트 선언, `ENTRYPOINT` 시작 명령. EXPOSE만으로 host port가 publish되지 않아 `-p` 등이 필요하다. `COPY build/libs/*.jar app.jar`가 여러 파일에 매치되면 목적지는 `/`로 끝나는 directory여야 한다. Java 21 native 실행은 Java 25 container 실행 증거가 아니다. [Dockerfile](https://docs.docker.com/reference/dockerfile) · [Docker Desktop Mac](https://docs.docker.com/desktop/setup/install/mac-permission-requirements/)

4. **복수 AZ도 무중단 보증이 아니다.** Region은 지리영역, AZ는 리전 내 실패격리 단위. DNS는 정책과 health 설정에 따라 대상을 반환하고 LB는 설정 probe로 대상을 선택한다. Probe가 앱 정상성·세션 이동·DB 복제를 보장하지 않으며 복제·일관성은 DB/앱 구성에 달렸다. 여러 AZ 자체는 자동 HA/DR 인증이 아니다. 상태 외부화, 복제·백업, 전환·복구 확인이 별도다. [AWS 복원력 책임](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/shared-responsibility-model-for-resiliency.html)

5. **공급자 비교는 기능 대응이며 호환성 선언이 아니다.** 대표 대응: EC2/Azure VM/Compute Engine; EKS/AKS/GKE; Elastic Beanstalk/App Service/App Engine·Cloud Run; RDS/Azure Database/Cloud SQL; S3/Blob/Cloud Storage; ELB/Azure LB·Application Gateway/Cloud Load Balancing; Route 53/Azure DNS/Cloud DNS; ECR/ACR/Artifact Registry. 기능·API·책임은 다르다. ECR은 레지스트리이지 실행환경이 아니다. S3는 key/prefix 기반 flat object model이지만 Azure Blob은 hierarchical namespace 선택지가 있어 모든 object storage가 POSIX 계층을 지원하지 않는다고 일반화할 수 없다. [Google 비교표](https://docs.cloud.google.com/docs/get-started/aws-azure-gcp-service-comparison) · [S3 key](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html)

6. **비용·7R.** 온프레미스는 장비 CAPEX·전력·상면·회선·운영비, cloud는 compute·storage·request·logs·backup·egress 등이 비용항목. 견적·요율·할인율은 만들지 않는다. On-demand는 약정 부담이 작고 Savings Plans는 사용 commitment, Spot은 회수·중단 가능성이 경계다. 7R: Retire(폐기), Retain(유지), Rehost(변경 없이 이전), Relocate(플랫폼 이동), Repurchase(제품 교체), Replatform(일부 최적화), Refactor/re-architect(구조 변경). Refactor는 필수 후속이 아니며 AWS도 대규모 이전 때 복잡성을 경고한다. [AWS 7R](https://docs.aws.amazon.com/prescriptive-guidance/latest/large-migration-guide/migration-strategies.html) · [Spot 중단](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-interruptions.html)

7. **`/health`는 진단 endpoint가 아니다.** 정본 route는 `GET /health`에서 literal `ok`를 반환한다. DB·노드·리전 상태나 Actuator readiness와 다르다. Actuator readiness는 별도 endpoint이며 외부 의존 검사도 기본 자동 포함되지 않는다. Java 21/Boot 4.1.1 loopback fixture를 실행하면 route·상태코드·본문·loopback 응답을 확인할 수 있으나 이번 조사에서는 실행하지 않았다. 실행결과, DB, Docker, 클라우드/AZ 가용성은 미검증이다. [Spring Actuator](https://docs.spring.io/spring-boot/3.4/reference/actuator/endpoints.html)

## 시안·범위

위치(사내/외부), 전용성(private/public), 운영책임, 서비스모델, 실패도메인을 분리한다. private cloud=사내 서버, IDC=cloud로 그리지 않는다. SaaS 책임은 코드 보안·서비스 설정·계정/접근·데이터를 나누고 제품별 예외를 표시한다. 자동 HA·무중단·DR, 세션 이동·복제, Java 25 실실행, 비용 수치·추천을 발명하지 않는다. 변동성 큰 Region/AZ 총수는 생략. 원문 Java와 Dockerfile은 보존하며 wildcard 다중매치와 EXPOSE/publish 설명만 보완한다.

## 접근 실패와 한계

AWS 7R 공식 페이지 첫 open은 `UnexpectedStatusCode`, 동일 URL 재열람 성공. Codex CLI 0.163.0 도움말 및 설정 확인: 기본 모델 gpt-6-astra, provider 목록 lite_llm만 있어 gpt-6-luna CLI 접근은 확인할 수 없었다. 재위임·LiteLLM·모델 전환 없이 이 세션 웹 도구에서 읽은 자료만 사용했다. 원문 실행·빌드·포트·Docker·cloud/VM/AZ 실험은 안 했다. 계약/상품별 책임, 실제 probe·DB 설정, 복구결과·가격은 미검증이다.
