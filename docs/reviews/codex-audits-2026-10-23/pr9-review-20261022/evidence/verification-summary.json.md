# 이전 PR 검토 실행 근거

대상 HEAD: `c9786af3b97c48ec118cade5777bc015fe282a88`. 현재 HEAD 재검증 결과가 아니다.

원본: `/Users/ds/research/javaexperience-pr9-review-20261022/_data/verification-summary.json`

````json
{
  "original": {
    "tests": 252,
    "failures": 2,
    "errors": 0,
    "skipped": 0
  },
  "replay": {
    "tests": 252,
    "failures": 2,
    "errors": 0,
    "skipped": 0
  },
  "probe": {
    "tests": 5,
    "failures": 0,
    "errors": 0,
    "skipped": 0
  },
  "observations": [
    "AUDIT staleWrite delete=false row={status=ACTIVE, like_count=0} relations=1",
    "AUDIT password chars=26 bytes=74 status=500 body={\"detail\":\"요청을 처리하지 못했습니다.\",\"instance\":\"/api/auth/signup\",\"status\":500,\"title\":\"서버 오류\",\"type\":\"/errors/internal\"}",
    "AUDIT staleWrite delete=true row={status=ACTIVE, like_count=0} relations=0",
    "AUDIT tagCase status=500 body={\"detail\":\"요청을 처리하지 못했습니다.\",\"instance\":\"/api/posts\",\"status\":500,\"title\":\"서버 오류\",\"type\":\"/errors/internal\"}",
    "AUDIT ambiguousRetry attempts=3 chargeStatus=502 before=FAILED callbackStatus=200 after=FAILED balance=0 ledger=0"
  ],
  "head": "c9786af3b97c48ec118cade5777bc015fe282a88",
  "base": "1f443faae406324f8c5a3c87b2741ad0b74913a6",
  "checked_at": "2026-10-22T21:14:19.015626+09:00",
  "source_status": "",
  "node_tests": 24,
  "site_build": "342 HTML, 링크 오류 0, 생성 파일 diff 0",
  "probe_limitations": [
    "PG 외부 호출은 Mockito 대역으로 실패 시퀀스를 주입하고 실제 PgRetryPolicy/ChargeService/서명 콜백/일회용MySQL을 사용했다. 실제 결제업체를 호출한 결과가 아니다.",
    "게시글은 실제 Entity/Repository/LikeService/DeleteService로 조회-변경-flush 구간을 barrier로 재현했다. 두 실제 HTTP PATCH 요청의 종단간 재현은 아니다.",
    "추가 관찰 테스트5개의 통과는 잘못된 동작이 재현됐다는 뜻이다. 제품 정상 통과 수에 합산하지 않는다."
  ]
}

````
