from pathlib import Path
import json,datetime,collections,hashlib,subprocess
root=Path('.').resolve();out=root/'docs/design/concept-cycle-2026-10-22/tasks/task23';src='docs/knowledge/D09-operations-observability.md'; data='tools/site/d09-lesson-data.mjs';proof='docs/design/d09-2026-10-21/source-proof/'; design='docs/design/d09-2026-10-21/'
coverage=[]
def add(section,start,end,stages,verdict,evidence,gap=''):
 coverage.append({'id':f'D09-U{len(coverage)+1:03}','sourceSection':section,'sourceLines':[start,end],'stageIds':stages.split() if isinstance(stages,str) else stages,'verdict':verdict,'evidence':evidence,'gap':gap,'originalPreserved':True})
add('도입: 사용자 신호·장애 완화·학습',1,5,'sli-definition signals-logs signals-metrics signals-traces incident-mitigate incident-review','covered','목표/신호/완화·postmortem의 설명 단계가 연결됨. 모델은 미실행 설명이다.')
add('1. 요구사항→배포→관측→대응→목표의 피드백 루프',7,27,'sli-definition signals-metrics alerts-signals incident-review','partial','구성 요소는 분산 단계 및 원문 Mermaid4 보존으로 확인.','전체 루프와 D01의 위치, postmortem이 목표·설계로 되돌아가는 연결이 보충 단계에 드러나지 않음.')
glossary=[
('가용성','business-badpayload counters-denominator','covered','정상 응답의 정의와 HTTP200의 한계를 1/3 대 2/3으로 비교한다.',''),
('다운타임','sli-time','partial','시간 기반 SLI와 요청 SLI 환산 경계는 명시.','정의된 SLI 미달 구간이라는 다운타임 정의·사례의 직접 비교는 원문에만 있음.'),
('SLI','sli-definition counters-denominator','covered','분자/분모·측정 위치/기간·제외 조건을 설명.',''),
('SLO','sli-definition sli-budget','covered','목표·기간·정책 및 목표99.9% 산술을 명시.',''),
('SLA','sli-definition','covered','고객 약속·미달 결과와 내부 목표를 구분.',''),
('에러 버짓','sli-budget alerts-burn','covered','허용10/사용20/remaining-10/burn2의 지정 예시.',''),
('모니터링','signals-logs signals-metrics signals-traces','partial','세 신호의 질문·경로는 있음.','알려진 상태 추적과 관측성의 예상 못한 원인 질의를 직접 비교하지 않음.'),
('관측성','logs-trace signals-traces','partial','상관/문맥 전파·질의 경계를 설명.','모니터링과 대비한 능력의 정의는 원문에만 보존.'),
('로그','logs-correlate signals-logs','covered','실제 사건4개와 수집·검색 모델을 분리.',''),
('메트릭','counters-outcomes signals-metrics','covered','집계 숫자·시계열·제한 label의 역할을 설명.',''),
('트레이스/span','logs-trace signals-traces','covered','부모 문맥·span 생성/완료·export/조회 분리.',''),
('대시보드','signals-metrics alerts-signals','partial','PromQL/Grafana와 네 신호만 연결.','핵심 상태·추세를 읽는 화면 정의와 단위/기간/배포 표식 장면 부재.'),
('알림 alert/page','alerts-signals alerts-burn','covered','사용자 영향·행동과 ticket/page 구분, window 정책 설명.',''),
('임계치와 노이즈','alerts-signals alerts-no-data','partial','CPU 단독 page 오류와 no-data/low traffic은 설명.','반복/억제/집계 기간·수신자 조정은 누락.'),
('온콜/당직','incident-detect','partial','조정/조사/공지역할만 있음.','당직 시간·권한·지원 담당·runbook 준비는 보충되지 않음.'),
('장애 incident','incident-detect incident-mitigate','covered','영향 범위/현재 증상·원인 확정 전 완화로 구분.',''),
('완화 mitigation','incident-mitigate','partial','원인 확정 전 완화와 근본 수정 구분은 있음.','롤백·우회·기능 차단·제한·읽기 전용의 구체 행동 예시는 원문에만 남음.'),
('포스트모템','incident-review','covered','기여 요인과 담당자/기한/검증 방법을 설명.',''),
('용량 계획','capacity-scale capacity-hpa','partial','공유 병목과 확장 지연/여유 조건은 있음.','예상 피크와 자원 한도 비교로 여유를 정하는 계획 사례는 없음.'),
('스케일 업','capacity-scale','covered','한 인스턴스 자원 확대와 out 비교.',''),
('스케일 아웃','capacity-scale','covered','인스턴스/Pod 수와 세션/파일/공유 병목 설명.',''),
('오토스케일','capacity-hpa','covered','설정 가능한15s 제어 간격, 준비/warmup 및 한도를 분리.',''),
('무상태 설계','capacity-scale','covered','실행 상태 외부화이며 도메인 데이터 제거 아님이 코드 모델에 있음.',''),
('캐시','capacity-cache','covered','TTL/무효화/일관성·stampede·원본 보호를 값/제목과 모델로 설명.',''),
('CDN','capacity-cache','partial','키/forwarding·CloudFront minTTL 위험은 설명.','엣지 전달·재사용이 원본 부하/전달 지연에 미치는 기본 흐름은 보충 단계에서 약함.'),
('백업','backup-snapshot backup-restored recovery-rto','covered','별도 사본/restore와 job 성공만으로 서비스 복구 인증 불가 설명.',''),
('RPO','recovery-rpo','covered','허용 손실 기간 목표이며 SQLite 결과와 분리.',''),
('RTO','recovery-rto','covered','중단 후 서비스 재개 목표·기능 확인과 파일 복원 분리.',''),
('scrape','scrape-running scrape-stopped scrape-restarted signals-metrics','covered','실제 query와 Prom→endpoint의 pull 방향 및 up 경계 설명.',''),
('라벨 카디널리티','labels-bounded labels-unbounded','covered','고유 label 조합/가능 조합≠실제 series, request ID 제외.','')]
for i,(name,st,v,e,g) in enumerate(glossary):add('2. 용어: '+name,33+i,33+i,st,v,e,g)
add('3.1 사용자 정상·유효 분모·HTTP 의미',66,68,'business-success business-httpfail business-badpayload business-invalid counters-denominator','covered','4case=200/500/200/400, 유효3·업무성공1·유효HTTP2002, invalid 제외는 toy 정책.')
add('3.1 SLO 기간·위치·목표·시간환산',70,70,'sli-definition sli-budget sli-time','covered','10000/9980/20은 명시 Decimal 산술; 30일43.2분은 시간 기반 정의에만 적용.')
add('3.1 에러 버짓으로 출시 위험/안정화 판단',72,72,'sli-budget alerts-burn','partial','예산 사용량 산술은 있음.','예산 소진→위험 변경 보류/안정화 선택의 운영 의사결정 사례가 없음.')
add('3.2 세 신호의 질문과 수집 경로',74,91,'signals-logs signals-metrics signals-traces','covered','로그/stdout수집기→검색, Prom pull→시계열/조회, span/Collector→backend를 모델로 구분; 실제 실행 아님.')
add('3.2 주문→결제의 span 생성·응답·export 순서',93,111,'logs-trace signals-traces','partial','문맥 inject/extract, span lifecycle, export/backend 경계는 설명.','원문의 주문/결제 한 요청에서 부모·자식 span이 언제 생기고 완료되는지의 순차 사례는 없음. 원문 Mermaid 보존과 구분.')
add('3.2 문맥 전파·샘플링·민감정보',113,113,'logs-trace signals-traces','partial','context와 sampling은 단계에 있고 민감정보 금지는 models.signals-context.boundaries의 접힌 근거에 있음.','토큰/개인정보 제외·샘플링 비용 정책을 눈에 보이는 학습 장면에서 함께 판단하지 않음.')
add('3.2 수집 지연의 버퍼·재시도·드롭',115,115,'','missing','D09 lesson/model에 버퍼·재시도·드롭 정책은 없고 원문 보존 영역에만 존재.','지연된 수집기가 요청을 막지 않도록 신호 큐→retry/drop의 선택/실패 경계를 보충해야 함.')
add('3.2 bounded label과 개별 로그 문맥',115,115,'logs-correlate labels-bounded labels-unbounded','covered','request_id는 사건/응답 문맥이며 exporter label은 outcome만. Prom job/instance는 별도.')
add('3.3 대시보드 네 신호·배포 시각·단위/범위',117,119,'alerts-signals percentile-vector percentile-histogram','partial','네 신호/percentile 계산·단위 경계는 설명.','시간창·단위·배포 표식을 같은 대시보드에 놓고 변화 원인을 읽는 장면은 없음.')
add('3.3 page/ticket와 행동 가능한 기준',121,121,'alerts-signals alerts-burn alerts-no-data','covered','사용자 영향/중요도/행동 기준, 자원 사전 위험·low traffic/no-data를 명시.')
add('3.3 반복 알림·억제·수신자·당직 권한/문서',121,121,'','missing','알림 모델은 userImpact/resourceSignals/burnRate/lowTraffic/noData만 보유.','반복 경보의 기간/집계/억제/수신자, 권한/runbook 준비를 판단하는 사례가 없음.')
add('3.3 첫 운영 기본 구성',123,123,'sli-definition signals-metrics original-prometheus original-compose alerts-signals','covered','SLI/SLO→Prom/Grafana→즉시 조치 알림의 요소와 원문/추가 native의 경계가 표시됨. 실행 달성으로 해석하지 않음.')
add('3.4 탐지·역할·공지 시간',125,146,'incident-detect','covered','증상·영향·시각·최근 변경과 조정/조사/공지역할·갱신 시각을 모델로 설명.')
add('3.4 완화 행동·회복·postmortem',148,148,'incident-mitigate incident-review','partial','회복 SLI/기능·의존성과 비난 없는 개선은 설명.','롤백/우회/기능 차단/제한/읽기 전용의 선택 및 다음 공지→복구 공지 메시지 예시는 원문에만 있음.')
add('3.5 확장과 상태·하위 병목',150,152,'capacity-scale','covered','up/out, 세션/파일 상태, DB/lock/queue/API 병목을 구분. 실제 부하 실험 없음.')
add('3.5 HPA15s·준비 지연·여유',154,154,'capacity-hpa','covered','15s는 설정 가능한 제어 간격; min/max/여유/지연/downscale/하위 한도는 모델 근거 및 현재값에 있음.')
add('3.5 캐시/CDN과 과부하 대응',156,156,'capacity-cache','partial','키/TTL/무효화/stampede·개인화 경계는 설명.','품질 저하·요청 제한으로 연쇄 장애를 막는 선택은 접힌 모델 문구 수준; 부하 전달 변화 사례 없음.')
add('3.6 사본 정책·격리 복원·데이터/앱 검증',158,160,'backup-snapshot backup-later backup-restored recovery-rpo recovery-rto','partial','SQLite source2/snapshot1/restore1·integrity/close, 파일과 서비스/RPO/RTO 구분은 명확.','백업 주기/보존/사본 위치/키 접근의 정책과 실제 손실 시간·회복 시간 목표 비교는 아직 없음.')
add('3.6 가용성 전환과 다른 위치 DR 구분',162,162,'','missing','현재 recovery 모델은 RPO/RTO·복원 타임라인과 SQLite 경계만 보유.','컴포넌트 중복/빠른 전환과 전체 워크로드의 다른 위치 재가동을 대조하는 장면 없음.')
add('4. 원문 Java25/S16/Boot4.1 사전 준비',164,168,'original-prometheus original-compose original-commands','unrun','원문 전제/범위는 sourceNote와 전체 근거에 있고 실제 Java/Actuator 실행은 명시적으로 없음.','원문 실습 실행 검증은 별도 승인/준비 후 수행할 남은 범위; 이 감사에서 실행 금지.')
add('4. 원문 Prometheus YAML15s/Actuator/host',170,181,'original-prometheus','unrun','block05 전문과 같은 코드. 추가 native /metrics1s와 구분.','원문 Compose→호스트 Actuator 경로는 실행하지 않음.')
add('4. 원문 Compose·이미지·포트·Grafana',183,204,'original-compose','unrun','코드는 연속11줄 발췌; credentials/depends_on 포함 block06 전문은 원문/보충 근거에 보존.','원문 Grafana 로그인/네트워크 통신 및 재현 가능한 이미지 pin은 미실행 예시 범위.')
add('4. bootRun·curl·up/ps·404/targets',206,219,'original-commands original-prometheus scrape-running','unrun','block07/08 전문 보존; source /actuator/prometheus와 native /metrics를 혼합하지 않음.','404 원인 진단과 Java/Compose의 실제 targets 화면 검증은 미실행.')
add('4. Grafana 데이터소스 내부 이름',221,221,'original-compose','unrun','http://prometheus:9090의 Compose 내부 이름 의미는 현재값/lead/선정 original-v4 그림과 일치.','Grafana datasource 연결 실행 없음.')
add('4. 종료→up0→재실행up1·업무 정상 경계',223,223,'scrape-running scrape-stopped scrape-restarted business-badpayload','covered','추가 native own exporter에서 실제 up1→0→1 및 counter0 확인. 같은 Prom 유지, TSDB 과거 sample 삭제 아님.','원문 앱 환경 실행을 뜻하지 않음; covered는 추가 사례의 의미 전달에 한정.')
add('4. 원문 Compose down',225,227,'original-commands','unrun','block09 전체 보존, own 프로세스3개 cleanup과 원문 down 구분.','원문 compose down 미실행; 기존 서비스 조작은 감사 범위 밖.')
mis=[
('프로세스 생존≠사용자 정상','business-badpayload scrape-running','covered','up1이어도 업무 실패2건을 실제 기록과 대조.',''),
('요청 SLI≠시간 환산','sli-time','covered','43.2분의 시간 기반 조건을 표시.',''),
('대시보드≠관측성','signals-logs signals-metrics signals-traces logs-trace','partial','신호별 질문과 ID 상관 경계는 있음.','선택한 대시보드 질문과 미지 오류 탐색 능력의 대비는 없음.'),
('로그량≠원인 발견','logs-correlate logs-trace','partial','request ID/time/구조 필드와 span 구분.','보존·민감정보 정책 적용 장면 없음.'),
('CPU80%≠항상 page','alerts-signals','covered','사용자 영향·행동 기준, 낮은 CPU도 정상 증거 아님.',''),
('autoscale≠용량 계획 완료','capacity-scale capacity-hpa','covered','확장 지연·여유/minmax/downscale·하위 의존성은 모델로 있음.',''),
('backup job≠복원 인증','backup-restored recovery-rto','covered','restore 데이터/앱·키/의존성·기능을 구분; 실제 운영 시간 미측정.',''),
('원인 분석 전 공지/완화','incident-detect incident-mitigate','covered','갱신 시각·공지 역할·원인 확정 전 병행.',''),
('postmortem≠개인 경고','incident-review','covered','시스템 조건·담당자/기한/검증 방법.',''),
('캐시≠공짜','capacity-cache','covered','TTL/무효화/stampede·키/원본 보호와 minTTL 위험.','')]
for i,(n,s,v,e,g) in enumerate(mis):add('5. 오해: '+n,231+i,231+i,s,v,e,g)
add('6. 큰 흐름 애니메이션 설계',242,246,'sli-definition signals-metrics incident-review','partial','요소별 보충과 기존 전체 개념 지도를 보존.','목표→배포→관측→대응→목표의 연속 학습 루프 없음.')
add('6. 한 요청의 세 신호 교차 확인 설계',247,247,'signals-logs signals-metrics signals-traces logs-correlate logs-trace','partial','신호별 경로·사건4건·상관/trace의 차이를 설명.','한 요청의 세 신호를 시간/ID로 교차 확인하는 실제 trace/backend 예시는 미실행.')
add('6. 역할별 장애 대응 순서 설계',248,248,'incident-detect incident-mitigate incident-review','covered','역할→완화→회복 확인→후속 action의 설명 단계. 실제 연락 없음.')
add('6. RPO/RTO를 별도 시간축에 연결',249,249,'backup-snapshot backup-later backup-restored recovery-rpo recovery-rto','partial','snapshot 전후 행과 서비스 목표의 경계는 있음.','복구 시점·서비스 재개 시점에 명시 시간을 둔 목표 대조는 없고 실행 시간 측정도 없음.')
qa=[
(253,255,'Q1 SLI/SLO/SLA','sli-definition counters-denominator','covered','분모/기간·내부목표·고객약속을 구분.',''),
(257,257,'Q1 에러 버짓 의사결정','sli-budget alerts-burn','partial','산술 예시만 있음.','배포 위험/안정화 결정의 사례 없음.'),
(259,261,'Q2 모니터링/관측성','signals-logs signals-metrics signals-traces','partial','각 신호의 장점은 설명.','알려진 지표 추적과 예상하지 못한 원인 질의의 비교 없음.'),
(263,263,'Q2 traceID 유용성','logs-correlate logs-trace','covered','응답/로그 ID 상관과 span/context 경계·실제 trace 미실행을 명시.',''),
(265,267,'Q3 CPU/SLO 알림','alerts-signals','covered','사용자 영향과 자원 사전위험을 구분.',''),
(269,269,'Q3 반복 알림 재검토','alerts-signals','partial','page/ticket 분류만 있음.','억제·오너·조치 문서 조정 사례 없음.'),
(271,273,'Q4 scale-out 병목','capacity-scale','covered','DB connection/lock/queue/API·상태 병목을 설명.',''),
(275,275,'Q4 stateless와 도메인 데이터','capacity-scale','covered','코드 모델에 도메인 데이터 제거가 아님을 명시.',''),
(277,279,'Q5 RPO/RTO1h와 복원 시험','recovery-rpo recovery-rto backup-restored','covered','목표 기간을 정의하고 파일/앱/의존성 검증을 분리. 목표 달성 측정 아님.',''),
(281,281,'Q5 복제와 백업','recovery-rpo','covered','삭제/손상 전파와 보존 사본 정책을 구분.',''),
(283,285,'Q6 초기 조사·역할·완화·회복','incident-detect incident-mitigate','covered','영향/증상→역할·갱신시각→완화→SLI/기능 회복.',''),
(287,287,'Q6 롤백은 완화','incident-mitigate','partial','완화와 근본 수정은 다르다고 표시.','롤백이라는 구체 사례에 원인 미해결을 적용하는 설명은 원문에만 있음.'),
(289,291,'Q7 시스템 기여 요인','incident-review','covered','권한/절차/검증/탐지/복구 조건과 사실·개선 책임 설명.',''),
(293,293,'Q7 후속 action','incident-review','covered','담당자·기한·검증 방법 포함.','')]
for a,b,n,s,v,e,g in qa:add('7. '+n,a,b,s,v,e,g)
add('주제 경계 S16/S17',295,295,'original-prometheus original-commands','covered','Actuator/Micrometer 설정은 S16 전제로 sourceNote에 표시, 성능 실험은 미실행 경계. 기존 링크는 원문 보존.')
add('8. 참고문헌 및 공식 근거',297,309,'','covered','원문 참고문헌 전문과 research/main-verification.json/source 전체가 HTML 보충 근거에 보존됨. 이 감사는 새 웹 조사/최신 재검증을 하지 않음.')
counts=dict(collections.Counter(x['verdict'] for x in coverage));counts={k:counts.get(k,0) for k in ['covered','partial','missing','unrun']}
full={'taskId':'task23','documentId':'D09','reviewedHEAD':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'source':str(root/src),'sourceSHA256':hashlib.sha256((root/src).read_bytes()).hexdigest(),'sourceLines':309,'coveragePolicy':'원문의 주요 의미 단위 전수표. covered는 지정 단계가 해당 개념을 설명한다는 뜻이며 운영 실행·pixel/이해 인증이 아니다. 모델은 executed=false를 유지한다. partial/missing은 보충 학습 장면 공백으로 원문 삭제가 아니다. unrun은 원문 실습 실행 경계다. 용어/본문/Q&A 중복 의미가 있으므로 비율은 문서 줄·고유 개념 완료율이 아니다.','summary':{'totalUnits':len(coverage),**counts},'coverage':coverage,'fullDocumentComplete':False}
(out/'source-coverage.json').write_text(json.dumps(full,ensure_ascii=False,indent=2)+'\n')
run=out/'runs/sol-20261022T001957Z';cmd=json.loads((run/'result.json').read_text());cross=json.loads((out/'evidence-crosscheck.json').read_text());absolute=lambda p:str(root/p)
gaps=[
{'id':'D09-S01','severity':'important','category':'source_coverage','path':absolute(data),'line':339,'problem':'3.2의 신호 파이프라인 운영 경계가 보충 학습에서 일부 빠져 있다.','evidence':[{'sourceLines':[93,115],'observed':'signals-context는 paths/context/sampling만 설명. collector 버퍼·재시도·드롭 정책이 없고 민감정보/보존 정책은 짧은 모델 경계 문구 수준. 주문→결제 span의 구체 순서도 원문 Mermaid에만 남음.'}],'fix':'명시 요청 하나의 span/로그 생성과 export·저장·조회 순서를 보여 주고 collector 지연 때 buffer/retry/drop 및 민감정보 제외 판단을 작은 장면으로 연결한다. 실제 OTel 실행을 요구하는 경우 별도 실행 사양을 정한다.','validation':'원문93~115의 의미별 stage/값/그림/근거 연결과 네트워크 미실행 표시를 검토; 현재 test:d09는 이 누락에도 exit0임을 기록.'},
{'id':'D09-S02','severity':'important','category':'source_coverage','path':absolute(data),'line':435,'problem':'3.3 대시보드 운영과 반복 알림/당직 준비가 보충되지 않았다.','evidence':[{'sourceLines':[119,123],'observed':'alerts 모델에는 signals/userImpact/resourceSignals/burnRate/lowTraffic/noData만 있다. 배포 표식·패널 단위/집계창과 반복 알림의 억제/수신자·당직 권한/조치 문서가 없음.'},{'sourceLines':[269,269],'observed':'Q3 꼬리질문도 같은 공백.'}],'fix':'명시 시간창/단위/배포 표식이 있는 예시 대시보드와, 반복 경보를 기간·집계·억제·수신자/오너·runbook 기준으로 page/ticket에 분류하는 장면을 추가한다.','validation':'현재값과 그림의 단위/기간/배포 시각, 선택 후 행동/담당자/권한 경계를 검토하고 의미 단위 검사를 등록한다. 실제 page를 보내지 않는다.'},
{'id':'D09-S03','severity':'minor','category':'source_coverage','path':absolute(data),'line':1410,'problem':'전체 운영 피드백 루프·모니터링 대비·버짓 의사결정은 구성 요소 설명에 머문다.','evidence':[{'sourceLines':[7,27],'observed':'목표·신호·대응은 있으나 postmortem→목표/설계 환류를 한 흐름으로 읽는 단계 없음.'},{'sourceLines':[72,72],'observed':'budget 숫자는 정확하지만 배포 보류/안정화 선택에 연결하지 않음.'},{'sourceLines':[259,261],'observed':'각 신호 질문은 있지만 monitoring vs observability 정의 직접 비교가 없음.'}],'fix':'기존 stage를 재사용하며 하나의 사용자 영향 사례를 목표→관측→대응→후속 변경으로 잇고, 예산 초과 시 변경 위험/안정화를 선택하는 설명을 추가한다.','validation':'원문7~27/72/259~261와 전체 학습 경로의 상태 전이를 대조. 단순 용어 매칭 통과를 전체 의미 완료로 취급하지 않는다.'},
{'id':'D09-S04','severity':'important','category':'source_coverage','path':absolute(data),'line':490,'problem':'복원 toy 이후 사본 정책·가용성 전환/다른 위치 DR·목표 시간 대조가 남아 있다.','evidence':[{'sourceLines':[160,162],'observed':'복원 파일과 서비스 목표 구분은 정확하지만 backup 주기/보존/사본 위치를 정책으로 비교하지 않고, HA중복/빠른 전환과 다른 위치 전체 workload 재가동의 대비가 없음.'},{'sourceLines':[249,249],'observed':'복구 가능 시점과 서비스 재개를 명시 시간축의 목표에 대조하는 장면 없음.'}],'fix':'사본 시점/보존/키/위치와 마지막 복구 지점→복원→앱/의존성→서비스 재개를 명시 시각 예제로 비교하고 HA와 DR의 범위를 나눈다. 계산 예시와 실측 목표 달성을 분리한다.','validation':'RPO/RTO 분자·기준시점/종료기준과 source2/snapshot1/restored1의 사실을 재대조; 운영 DR 실행 없이 달성 표기를 하지 않는다.'}]
readfiles=[src,data,'tools/site/d09-learning.js','tools/site/d09-learning.mjs','tools/site/d09-learning.css','tools/site/d09-learning.bundle.js','tools/site/d09-supplement.mjs','tools/site/test-d09-learning.mjs','tools/site/test-d09-generated.mjs','tools/site/package.json','docs/knowledge/D09-operations-observability.html',design+'VERIFICATION.md',design+'image-records.json',design+'html-baseline.json',proof+'README.md',proof+'source.json',proof+'execution.json',proof+'models.json',proof+'runtime-last.json',proof+'main-fresh-verification.json',proof+'fixture-manifest.json',proof+'run-proof.py']+[proof+'fixture/'+x for x in ['exporter.py','sqlite_restore.py','sample_calculations.py','prometheus-extra.yml.in']]+[x['file'] for x in cross['mirroredRawFiles']]+[x['path'] for x in cross['images']]+['docs/design/concept-cycle-2026-10-22/AUDIT-CONTRACT.md','docs/design/concept-cycle-2026-10-22/tasks/task23/TASK.md','docs/design/concept-cycle-2026-10-22/tasks/task23/browser-desktop.json','docs/design/concept-cycle-2026-10-22/tasks/task23/browser-mobile.json','docs/design/concept-cycle-2026-10-22/tasks/task23/browser-special.json']
remaining=['수집 파이프라인·trace 순서·buffer/retry/drop·민감정보/보존 정책 장면(D09-S01)','대시보드 단위/창/배포·반복 경보·당직 준비(D09-S02)','전체 환류·monitoring 대비·예산 의사결정(D09-S03)','사본 정책·HA/DR·복구 목표 시간축(D09-S04)','원문 Java25/Actuator/Compose/Grafana 실행은 별도 미실행 범위; 감사에서는 재실행 금지','메인 현재 browser 증거 종합 및 전체 pixel/학습자 이해와 분리한 최종 판정']
limitations=['fresh 검사는 정적/DOM 계약·기존 raw·해시 대조이며 native Prometheus/DB/HTTP/Java를 새로 실행하지 않았다.','선정14장 중3장·과거 캡처28장 중3장을 직접 열람했다. 나머지 전수 pixel 검수/모든39상태의 실제 캡처 검수는 하지 않았다.','browser-desktop/mobile/special.json은 메인이 기록한 현재 브라우저 증거를 읽은 것이며 reviewer 자신의 브라우저 실행이 아니다. desktop1672×819/mobile360×800, 각각39상태·errors[]·copy일치가 기록됨. 확대/pan 등 전체 상호작용에 대한 최종 판단은 메인이 담당한다.','새 웹/문헌 최신성 조사·LLM/외부 CLI/추가 에이전트 호출 없음. 공식 기술 주장에 대한 판단은 원문과 기존 공식 검증 기록 및 실행 코드의 경계 대조에 한정.','원문 보존 및 자체 실험의 정확성을 문서 전체 완료·학습자 이해·운영 목표 달성으로 승격하지 않는다.']
review={'taskId':'task23','documentId':'D09','reviewer':{'model':'gpt-6.1-sol','reasoning':'high'},'reviewedHEAD':full['reviewedHEAD'],'reviewedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'기존 D09 부분 보강 독립 감사. spec 전체 원문309줄 의미 단위→14질문39stage→quality 진단. application/원문/기존 증거/장부/Git 무수정.','filesRead':[absolute(x) for x in dict.fromkeys(readfiles)],'readingNotes':['원문 전문과 모든 stage의 title/lead/values/code/active/checks/runKeys 및 관련 models를 대조했다.','현재 generated HTML은 JSDOM으로 원문 전문/코드/도표/ID/기존 지도 및 supplement fullraw 보존을 대조했고, 번들에서39상태를 구동했다. 전체 generated HTML의 중복 raw문자열을 줄마다 수작업 검수했다는 뜻은 아니다.'],'commandsRun':[{'command':cmd['command'],'cwd':str(root),'startedAtUTC':cmd['startedAtUTC'],'finishedAtUTC':cmd['finishedAtUTC'],'exitCode':cmd['exitCode'],'record':str(run/'result.json'),'stdout':str(run/'stdout.log'),'stderr':str(run/'stderr.log')},{'command':'read-only source/JSON/code/DOM/sha and mirrored raw comparison','exitCode':0,'record':str(out/'evidence-crosscheck.json')}],'specReview':{'verdict':'needs_completion','coverage':coverage,'summary':full['summary'],'findings':gaps,'boundary':'모델19개는 개념 설명으로 covered일 수 있으나 executed=false/PASS없음을 유지. 원문 실습6단위는 unrun. scope gap4개는 정확성 버그와 분리.'},'qualityReview':{'verdict':'diagnostic_only_spec_not_approved','findings':[],'diagnosticObservations':['4businessHTTP200/500/200/400·outcome1/2/1·valid3/businessSuccess1/validHTTP2002가 응답/JSONevents/실제Promvector와 일치. HTTP총108/query99는 업무4건과 다른 분모.','up1→0→1·같은 own port/새PID·선택counter6개0, 같은 Prometheus/TSDB 유지가 코드/argv/raw와 일치. 과거 시계열 삭제나 rate 검증으로 확대하지 않음.','SQLite seedcommit→snapshot→latercommit→restore 순서, source2/snapshot1/restored1·integrity3ok/close3가 raw와 일치. 기존 DB손실/운영RPO/RTO 측정 아님.','Decimal10000/9980/20/99.9%=allowed10/remaining-10/burn2 및 time-only43.2분, nearest-rank[10,20,30,40,50] p50=30/p95=50은 명시입력 산술이다.','sourceJavaPresent=false/원문Java25·S16Actuator·Docker·Grafana미실행, extraPython/metrics/nativeProm 구분·model6 executed=false·모델/원문PASS숨김은 코드/현재HTML계약과 일치.','controller는 scope root/별도history key, 끝개행 복사, 모델 상태 PASS숨김, 단계 선택/키보드/focus/zoom/manual resize 계약을 JSDOM에서 검증. 공유 clipboard race는 중복 finding으로 등록하지 않음.','선정 business-v2/backup-v2/original-v4 직접 열람에서 본문 값/흐름과 충돌을 발견하지 못했다. 과거 desktop-business/mobile-counters/mobile-original은 값/코드와 내부pan 안내가 보인다.'],'approvalGranted':False,'reason':'spec의 범위 공백이 해소되지 않았으므로 quality 통과 승인으로 건너뛰지 않는다. 진단에서 확정한 기술/접근성 결함0개는 전체 품질 보증이 아니다.'},'visualReview':{'imagesViewed':[absolute(x['path']) for x in cross['images'] if '/images/' in x['path']],'capturesViewed':[absolute(x['path']) for x in cross['images'] if '/captures/' in x['path']],'limitations':limitations[1:3],'headerEvidence':str(out/'evidence-crosscheck.json')},'runtimeReview':{'freshCommands':[{'command':cmd['command'],'exitCode':0,'record':str(run/'result.json')}],'historicalEvidence':[absolute(proof+'runtime-last.json'),absolute(proof+'main-fresh-verification.json'),str(out/'evidence-crosscheck.json')],'unexecuted':['원문Java25/SpringBoot4.1/Actuator/Micrometer','DockerCompose/Grafana/원문ports8080/9090/3000','새 nativePrometheus/PythonHTTP/SQLite replay','OTelSDK/Collector/tracebackend','실제rate/histogram/latency/월간SLO/SLA','실제page/oncall/incident/K8sHPA/cacheCDN/운영DR','reviewer browser 실행/새 webCLI/agentLLM']},'boundedVerdict':'needs_completion','fullDocumentComplete':False,'remainingWork':remaining,'limitations':limitations,'issueCounts':{'correctnessCritical':0,'correctnessImportant':0,'correctnessMinor':0,'sourceCoverageImportant':3,'sourceCoverageMinor':1,'sourceCoverageGroups':4},'automatedExitCode':0}
(out/'review.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
md=['# task23 D09 독립 감사',f"기준 HEAD `{full['reviewedHEAD']}` / 원문 SHA256 `{full['sourceSHA256']}`.",'','판정은 **needs_completion**, `fullDocumentComplete=false`다. 14질문39상태의 현재 사실·코드·기존 raw 불일치는 확인되지 않았지만 원문 전체의 학습 의미가 다 보강된 상태는 아니다. spec 미승인으로 quality는 진단만 수행했다.','',f"원문309줄을 주요 의미 단위{len(coverage)}개로 나눠 covered {counts['covered']} / partial {counts['partial']} / missing {counts['missing']} / unrun {counts['unrun']}으로 연결했다. 용어·본문·Q&A 반복 의미가 있으므로 이 숫자를 문서 줄/고유 개념의 완료율로 해석하지 않는다.",'','## 확정한 범위 공백','']
for g in gaps:md += [f"- {g['id']} ({g['severity']}): {g['problem']} 원문 근거와 수정/검증 조건은 review.json에 기록했다."]
md+=['','## 검증과 경계','','`npm --prefix tools/site run test:d09`는 새 실행 exit0. UTC/HEAD/소스SHA/stdout/stderr는 `runs/sol-20261022T001957Z/`에 보존했다. native/DB/HTTP/Java는 재실행하지 않았다.','','기존 rawHTTP108/query99 가운데 업무4건과 실제 사건4개가 일치한다. outcome1/2/1, 유효3·업무성공1·유효HTTP2002, up1→0→1·선택counter6개0, 같은 Prom/TSDB 유지, SQLite source2/snapshot1/restored1과 integrity/close, 지정 산술 allowed10/remaining-10/burn2를 대조했다. raw runtime과 저장본8파일은 byte 동일하다. 지정10000건/벡터는 측정 traffic/latency가 아니고 원문 Java25·Actuator·Grafana 미실행 경계도 유지한다.','','선정 business-v2/backup-v2/original-v4 3장과 과거 desktop-business/mobile-counters/mobile-original 3장을 view_image로 직접 열람했다. JPEG 실제 크기·SHA는 evidence-crosscheck.json에 기록했다. 14선정/28캡처 전체 pixel 검수 주장은 하지 않는다. 메인의 현재 browser-desktop/mobile/special 기록도 읽었으며 reviewer 자신의 브라우저 실행과 구분한다.','','## 의미 단위 전수표','','| 원문 의미 단위 | 원문 줄 | stageIds | 판정 | 남은 부분 |','|---|---|---|---|---|']
for c in coverage:md.append('| '+c['sourceSection'].replace('|','/')+' | '+str(c['sourceLines'][0])+'–'+str(c['sourceLines'][1])+' | '+(', '.join(c['stageIds']) or '없음')+' | '+c['verdict']+' | '+(c['gap'] or '선언한 설명 범위에서 연결됨').replace('|','/')+' |')
md+=['','## 남은 묶음','']+[f'- {x}' for x in remaining]+['','판정: needs_completion (spec 범위 공백, quality 진단만)','fullDocumentComplete: false',f"커버리지: {len(coverage)}단위 = covered{counts['covered']}/partial{counts['partial']}/missing{counts['missing']}/unrun{counts['unrun']}",'이슈 수: 기술 결함0 / 범위 공백4묶음(important3, minor1)','exit: test:d09 0']
(out/'review.md').write_text('\n'.join(md)+'\n')
print(json.dumps({'coverage':full['summary'],'verdict':review['boundedVerdict'],'issues':review['issueCounts'],'files':['review.json','review.md','source-coverage.json','evidence-crosscheck.json']},ensure_ascii=False,indent=2))
