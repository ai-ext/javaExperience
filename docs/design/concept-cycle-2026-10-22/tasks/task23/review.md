# task23 D09 독립 감사
기준 HEAD `4b0493af52b1a06decca909d6bf9a8b6f9610686` / 원문 SHA256 `6ed92233be6bfa75029c31c3bb89eff723192bdbc58d27677cf29b4247eeee79`.

판정은 **needs_completion**, `fullDocumentComplete=false`다. 14질문39상태의 현재 사실·코드·기존 raw 불일치는 확인되지 않았지만 원문 전체의 학습 의미가 다 보강된 상태는 아니다. spec 미승인으로 quality는 진단만 수행했다.

원문309줄을 주요 의미 단위88개로 나눠 covered 53 / partial 26 / missing 3 / unrun 6으로 연결했다. 용어·본문·Q&A 반복 의미가 있으므로 이 숫자를 문서 줄/고유 개념의 완료율로 해석하지 않는다.

## 확정한 범위 공백

- D09-S01 (important): 3.2의 신호 파이프라인 운영 경계가 보충 학습에서 일부 빠져 있다. 원문 근거와 수정/검증 조건은 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task23/review.json에 기록했다.
- D09-S02 (important): 3.3 대시보드 운영과 반복 알림/당직 준비가 보충되지 않았다. 원문 근거와 수정/검증 조건은 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task23/review.json에 기록했다.
- D09-S03 (minor): 전체 운영 피드백 루프·모니터링 대비·버짓 의사결정은 구성 요소 설명에 머문다. 원문 근거와 수정/검증 조건은 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task23/review.json에 기록했다.
- D09-S04 (important): 복원 toy 이후 사본 정책·가용성 전환/다른 위치 DR·목표 시간 대조가 남아 있다. 원문 근거와 수정/검증 조건은 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task23/review.json에 기록했다.

## 검증과 경계

`npm --prefix tools/site run test:d09`는 새 실행 exit0. UTC/HEAD/소스SHA/stdout/stderr는 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task23/runs/sol-20261022T001957Z/`에 보존했다. native/DB/HTTP/Java는 재실행하지 않았다.

기존 rawHTTP108/query99 가운데 업무4건과 실제 사건4개가 일치한다. outcome1/2/1, 유효3·업무성공1·유효HTTP2002, up1→0→1·선택counter6개0, 같은 Prom/TSDB 유지, SQLite source2/snapshot1/restored1과 integrity/close, 지정 산술 allowed10/remaining-10/burn2를 대조했다. raw runtime과 저장본8파일은 byte 동일하다. 지정10000건/벡터는 측정 traffic/latency가 아니고 원문 Java25·Actuator·Grafana 미실행 경계도 유지한다.

선정 business-v2/backup-v2/original-v4 3장과 과거 desktop-business/mobile-counters/mobile-original 3장을 view_image로 직접 열람했다. JPEG 실제 크기·SHA는 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task23/evidence-crosscheck.json에 기록했다. 14선정/28캡처 전체 pixel 검수 주장은 하지 않는다. 메인의 현재 browser-desktop/mobile/special 기록도 읽었으며 reviewer 자신의 브라우저 실행과 구분한다.

## 의미 단위 전수표

| 원문 의미 단위 | 원문 줄 | stageIds | 판정 | 남은 부분 |
|---|---|---|---|---|
| 도입: 사용자 신호·장애 완화·학습 | 1–5 | sli-definition, signals-logs, signals-metrics, signals-traces, incident-mitigate, incident-review | covered | 선언한 설명 범위에서 연결됨 |
| 1. 요구사항→배포→관측→대응→목표의 피드백 루프 | 7–27 | sli-definition, signals-metrics, alerts-signals, incident-review | partial | 전체 루프와 D01의 위치, postmortem이 목표·설계로 되돌아가는 연결이 보충 단계에 드러나지 않음. |
| 2. 용어: 가용성 | 33–33 | business-badpayload, counters-denominator | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: 다운타임 | 34–34 | sli-time | partial | 정의된 SLI 미달 구간이라는 다운타임 정의·사례의 직접 비교는 원문에만 있음. |
| 2. 용어: SLI | 35–35 | sli-definition, counters-denominator | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: SLO | 36–36 | sli-definition, sli-budget | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: SLA | 37–37 | sli-definition | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: 에러 버짓 | 38–38 | sli-budget, alerts-burn | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: 모니터링 | 39–39 | signals-logs, signals-metrics, signals-traces | partial | 알려진 상태 추적과 관측성의 예상 못한 원인 질의를 직접 비교하지 않음. |
| 2. 용어: 관측성 | 40–40 | logs-trace, signals-traces | partial | 모니터링과 대비한 능력의 정의는 원문에만 보존. |
| 2. 용어: 로그 | 41–41 | logs-correlate, signals-logs | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: 메트릭 | 42–42 | counters-outcomes, signals-metrics | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: 트레이스/span | 43–43 | logs-trace, signals-traces | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: 대시보드 | 44–44 | signals-metrics, alerts-signals | partial | 핵심 상태·추세를 읽는 화면 정의와 단위/기간/배포 표식 장면 부재. |
| 2. 용어: 알림 alert/page | 45–45 | alerts-signals, alerts-burn | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: 임계치와 노이즈 | 46–46 | alerts-signals, alerts-no-data | partial | 반복/억제/집계 기간·수신자 조정은 누락. |
| 2. 용어: 온콜/당직 | 47–47 | incident-detect | partial | 당직 시간·권한·지원 담당·runbook 준비는 보충되지 않음. |
| 2. 용어: 장애 incident | 48–48 | incident-detect, incident-mitigate | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: 완화 mitigation | 49–49 | incident-mitigate | partial | 롤백·우회·기능 차단·제한·읽기 전용의 구체 행동 예시는 원문에만 남음. |
| 2. 용어: 포스트모템 | 50–50 | incident-review | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: 용량 계획 | 51–51 | capacity-scale, capacity-hpa | partial | 예상 피크와 자원 한도 비교로 여유를 정하는 계획 사례는 없음. |
| 2. 용어: 스케일 업 | 52–52 | capacity-scale | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: 스케일 아웃 | 53–53 | capacity-scale | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: 오토스케일 | 54–54 | capacity-hpa | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: 무상태 설계 | 55–55 | capacity-scale | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: 캐시 | 56–56 | capacity-cache | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: CDN | 57–57 | capacity-cache | partial | 엣지 전달·재사용이 원본 부하/전달 지연에 미치는 기본 흐름은 보충 단계에서 약함. |
| 2. 용어: 백업 | 58–58 | backup-snapshot, backup-restored, recovery-rto | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: RPO | 59–59 | recovery-rpo | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: RTO | 60–60 | recovery-rto | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: scrape | 61–61 | scrape-running, scrape-stopped, scrape-restarted, signals-metrics | covered | 선언한 설명 범위에서 연결됨 |
| 2. 용어: 라벨 카디널리티 | 62–62 | labels-bounded, labels-unbounded | covered | 선언한 설명 범위에서 연결됨 |
| 3.1 사용자 정상·유효 분모·HTTP 의미 | 66–68 | business-success, business-httpfail, business-badpayload, business-invalid, counters-denominator | covered | 선언한 설명 범위에서 연결됨 |
| 3.1 SLO 기간·위치·목표·시간환산 | 70–70 | sli-definition, sli-budget, sli-time | covered | 선언한 설명 범위에서 연결됨 |
| 3.1 에러 버짓으로 출시 위험/안정화 판단 | 72–72 | sli-budget, alerts-burn | partial | 예산 소진→위험 변경 보류/안정화 선택의 운영 의사결정 사례가 없음. |
| 3.2 세 신호의 질문과 수집 경로 | 74–91 | signals-logs, signals-metrics, signals-traces | covered | 선언한 설명 범위에서 연결됨 |
| 3.2 주문→결제의 span 생성·응답·export 순서 | 93–111 | logs-trace, signals-traces | partial | 원문의 주문/결제 한 요청에서 부모·자식 span이 언제 생기고 완료되는지의 순차 사례는 없음. 원문 Mermaid 보존과 구분. |
| 3.2 문맥 전파·샘플링·민감정보 | 113–113 | logs-trace, signals-traces | partial | 토큰/개인정보 제외·샘플링 비용 정책을 눈에 보이는 학습 장면에서 함께 판단하지 않음. |
| 3.2 수집 지연의 버퍼·재시도·드롭 | 115–115 | 없음 | missing | 지연된 수집기가 요청을 막지 않도록 신호 큐→retry/drop의 선택/실패 경계를 보충해야 함. |
| 3.2 bounded label과 개별 로그 문맥 | 115–115 | logs-correlate, labels-bounded, labels-unbounded | covered | 선언한 설명 범위에서 연결됨 |
| 3.3 대시보드 네 신호·배포 시각·단위/범위 | 117–119 | alerts-signals, percentile-vector, percentile-histogram | partial | 시간창·단위·배포 표식을 같은 대시보드에 놓고 변화 원인을 읽는 장면은 없음. |
| 3.3 page/ticket와 행동 가능한 기준 | 121–121 | alerts-signals, alerts-burn, alerts-no-data | covered | 선언한 설명 범위에서 연결됨 |
| 3.3 반복 알림·억제·수신자·당직 권한/문서 | 121–121 | 없음 | missing | 반복 경보의 기간/집계/억제/수신자, 권한/runbook 준비를 판단하는 사례가 없음. |
| 3.3 첫 운영 기본 구성 | 123–123 | sli-definition, signals-metrics, original-prometheus, original-compose, alerts-signals | covered | 선언한 설명 범위에서 연결됨 |
| 3.4 탐지·역할·공지 시간 | 125–146 | incident-detect | covered | 선언한 설명 범위에서 연결됨 |
| 3.4 완화 행동·회복·postmortem | 148–148 | incident-mitigate, incident-review | partial | 롤백/우회/기능 차단/제한/읽기 전용의 선택 및 다음 공지→복구 공지 메시지 예시는 원문에만 있음. |
| 3.5 확장과 상태·하위 병목 | 150–152 | capacity-scale | covered | 선언한 설명 범위에서 연결됨 |
| 3.5 HPA15s·준비 지연·여유 | 154–154 | capacity-hpa | covered | 선언한 설명 범위에서 연결됨 |
| 3.5 캐시/CDN과 과부하 대응 | 156–156 | capacity-cache | partial | 품질 저하·요청 제한으로 연쇄 장애를 막는 선택은 접힌 모델 문구 수준; 부하 전달 변화 사례 없음. |
| 3.6 사본 정책·격리 복원·데이터/앱 검증 | 158–160 | backup-snapshot, backup-later, backup-restored, recovery-rpo, recovery-rto | partial | 백업 주기/보존/사본 위치/키 접근의 정책과 실제 손실 시간·회복 시간 목표 비교는 아직 없음. |
| 3.6 가용성 전환과 다른 위치 DR 구분 | 162–162 | 없음 | missing | 컴포넌트 중복/빠른 전환과 전체 워크로드의 다른 위치 재가동을 대조하는 장면 없음. |
| 4. 원문 Java25/S16/Boot4.1 사전 준비 | 164–168 | original-prometheus, original-compose, original-commands | unrun | 원문 실습 실행 검증은 별도 승인/준비 후 수행할 남은 범위; 이 감사에서 실행 금지. |
| 4. 원문 Prometheus YAML15s/Actuator/host | 170–181 | original-prometheus | unrun | 원문 Compose→호스트 Actuator 경로는 실행하지 않음. |
| 4. 원문 Compose·이미지·포트·Grafana | 183–204 | original-compose | unrun | 원문 Grafana 로그인/네트워크 통신 및 재현 가능한 이미지 pin은 미실행 예시 범위. |
| 4. bootRun·curl·up/ps·404/targets | 206–219 | original-commands, original-prometheus, scrape-running | unrun | 404 원인 진단과 Java/Compose의 실제 targets 화면 검증은 미실행. |
| 4. Grafana 데이터소스 내부 이름 | 221–221 | original-compose | unrun | Grafana datasource 연결 실행 없음. |
| 4. 종료→up0→재실행up1·업무 정상 경계 | 223–223 | scrape-running, scrape-stopped, scrape-restarted, business-badpayload | covered | 원문 앱 환경 실행을 뜻하지 않음; covered는 추가 사례의 의미 전달에 한정. |
| 4. 원문 Compose down | 225–227 | original-commands | unrun | 원문 compose down 미실행; 기존 서비스 조작은 감사 범위 밖. |
| 5. 오해: 프로세스 생존≠사용자 정상 | 231–231 | business-badpayload, scrape-running | covered | 선언한 설명 범위에서 연결됨 |
| 5. 오해: 요청 SLI≠시간 환산 | 232–232 | sli-time | covered | 선언한 설명 범위에서 연결됨 |
| 5. 오해: 대시보드≠관측성 | 233–233 | signals-logs, signals-metrics, signals-traces, logs-trace | partial | 선택한 대시보드 질문과 미지 오류 탐색 능력의 대비는 없음. |
| 5. 오해: 로그량≠원인 발견 | 234–234 | logs-correlate, logs-trace | partial | 보존·민감정보 정책 적용 장면 없음. |
| 5. 오해: CPU80%≠항상 page | 235–235 | alerts-signals | covered | 선언한 설명 범위에서 연결됨 |
| 5. 오해: autoscale≠용량 계획 완료 | 236–236 | capacity-scale, capacity-hpa | covered | 선언한 설명 범위에서 연결됨 |
| 5. 오해: backup job≠복원 인증 | 237–237 | backup-restored, recovery-rto | covered | 선언한 설명 범위에서 연결됨 |
| 5. 오해: 원인 분석 전 공지/완화 | 238–238 | incident-detect, incident-mitigate | covered | 선언한 설명 범위에서 연결됨 |
| 5. 오해: postmortem≠개인 경고 | 239–239 | incident-review | covered | 선언한 설명 범위에서 연결됨 |
| 5. 오해: 캐시≠공짜 | 240–240 | capacity-cache | covered | 선언한 설명 범위에서 연결됨 |
| 6. 큰 흐름 애니메이션 설계 | 242–246 | sli-definition, signals-metrics, incident-review | partial | 목표→배포→관측→대응→목표의 연속 학습 루프 없음. |
| 6. 한 요청의 세 신호 교차 확인 설계 | 247–247 | signals-logs, signals-metrics, signals-traces, logs-correlate, logs-trace | partial | 한 요청의 세 신호를 시간/ID로 교차 확인하는 실제 trace/backend 예시는 미실행. |
| 6. 역할별 장애 대응 순서 설계 | 248–248 | incident-detect, incident-mitigate, incident-review | covered | 선언한 설명 범위에서 연결됨 |
| 6. RPO/RTO를 별도 시간축에 연결 | 249–249 | backup-snapshot, backup-later, backup-restored, recovery-rpo, recovery-rto | partial | 복구 시점·서비스 재개 시점에 명시 시간을 둔 목표 대조는 없고 실행 시간 측정도 없음. |
| 7. Q1 SLI/SLO/SLA | 253–255 | sli-definition, counters-denominator | covered | 선언한 설명 범위에서 연결됨 |
| 7. Q1 에러 버짓 의사결정 | 257–257 | sli-budget, alerts-burn | partial | 배포 위험/안정화 결정의 사례 없음. |
| 7. Q2 모니터링/관측성 | 259–261 | signals-logs, signals-metrics, signals-traces | partial | 알려진 지표 추적과 예상하지 못한 원인 질의의 비교 없음. |
| 7. Q2 traceID 유용성 | 263–263 | logs-correlate, logs-trace | covered | 선언한 설명 범위에서 연결됨 |
| 7. Q3 CPU/SLO 알림 | 265–267 | alerts-signals | covered | 선언한 설명 범위에서 연결됨 |
| 7. Q3 반복 알림 재검토 | 269–269 | alerts-signals | partial | 억제·오너·조치 문서 조정 사례 없음. |
| 7. Q4 scale-out 병목 | 271–273 | capacity-scale | covered | 선언한 설명 범위에서 연결됨 |
| 7. Q4 stateless와 도메인 데이터 | 275–275 | capacity-scale | covered | 선언한 설명 범위에서 연결됨 |
| 7. Q5 RPO/RTO1h와 복원 시험 | 277–279 | recovery-rpo, recovery-rto, backup-restored | covered | 선언한 설명 범위에서 연결됨 |
| 7. Q5 복제와 백업 | 281–281 | recovery-rpo | covered | 선언한 설명 범위에서 연결됨 |
| 7. Q6 초기 조사·역할·완화·회복 | 283–285 | incident-detect, incident-mitigate | covered | 선언한 설명 범위에서 연결됨 |
| 7. Q6 롤백은 완화 | 287–287 | incident-mitigate | partial | 롤백이라는 구체 사례에 원인 미해결을 적용하는 설명은 원문에만 있음. |
| 7. Q7 시스템 기여 요인 | 289–291 | incident-review | covered | 선언한 설명 범위에서 연결됨 |
| 7. Q7 후속 action | 293–293 | incident-review | covered | 선언한 설명 범위에서 연결됨 |
| 주제 경계 S16/S17 | 295–295 | original-prometheus, original-commands | covered | 선언한 설명 범위에서 연결됨 |
| 8. 참고문헌 및 공식 근거 | 297–309 | 없음 | covered | 선언한 설명 범위에서 연결됨 |

## 남은 묶음

- 수집 파이프라인·trace 순서·buffer/retry/drop·민감정보/보존 정책 장면(D09-S01)
- 대시보드 단위/창/배포·반복 경보·당직 준비(D09-S02)
- 전체 환류·monitoring 대비·예산 의사결정(D09-S03)
- 사본 정책·HA/DR·복구 목표 시간축(D09-S04)
- 원문 Java25/Actuator/Compose/Grafana 실행은 별도 미실행 범위; 감사에서는 재실행 금지
- 메인 현재 browser 증거 종합 및 전체 pixel/학습자 이해와 분리한 최종 판정

판정: needs_completion (spec 범위 공백, quality 진단만)
fullDocumentComplete: false
커버리지: 88단위 = covered53/partial26/missing3/unrun6
이슈 수: 기술 결함0 / 범위 공백4묶음(important3, minor1)
exit: test:d09 0
