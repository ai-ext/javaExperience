# 이전 PR 검토 실행 근거

대상 HEAD: `c9786af3b97c48ec118cade5777bc015fe282a88`. 현재 HEAD 재검증 결과가 아니다.

원본: `$USER_HOME/research/javaexperience-pr9-review-20261022/_data/original-failures.json`

````json
[
  {
    "class": "com.example.board.payment.PgClientRetryTest",
    "case": "연결_실패가_계속되면_백오프_후_3번째에_포기한다()",
    "message": "org.opentest4j.AssertionFailedError: \nexpected: UNREACHABLE\n but was: TIMEOUT",
    "detail": "org.opentest4j.AssertionFailedError: \nexpected: UNREACHABLE\n but was: TIMEOUT\n\tat com.example.board.payment.PgClientRetryTest.연결_실패가_계속되면_백오프_후_3번째에_포기한다(PgClientRetryTest.java:139)\n"
  },
  {
    "class": "com.example.board.payment.PgClientRetryTest",
    "case": "연결_실패는_재시도하고_복구되면_성공한다()",
    "message": "java.util.concurrent.ExecutionException: com.example.board.payment.PgException: PG 응답 없음",
    "detail": "java.util.concurrent.ExecutionException: com.example.board.payment.PgException: PG 응답 없음\n\tat java.base/java.util.concurrent.CompletableFuture.reportGet(CompletableFuture.java:396)\n\tat java.base/java.util.concurrent.CompletableFuture.get(CompletableFuture.java:2096)\n\tat com.example.board.payment.PgClientRetryTest.연결_실패는_재시도하고_복구되면_성공한다(PgClientRetryTest.java:123)\nCaused by: com.example.board.payment.PgException: PG 응답 없음\n\tat com.example.board.payment.PgClient.translate(PgClient.java:79)\n\tat com.example.board.payment.PgClient.call(PgClient.java:55)\n\tat com.example.board.payment.PgClient.lambda$approve$1(PgClient.java:29)\n\tat com.example.board.payment.PgRetryPolicy.execute(PgRetryPolicy.java:33)\n\tat com.example.board.payment.PgClient.approve(PgClient.java:29)\n\tat com.example.board.payment.PgClientRetryTest.lambda$연결_실패는_재시도하고_복구되면_성공한다$3(PgClientRetryTest.java:119)\nCaused by: org.springframework.web.client.ResourceAccessException: I/O error on POST request for \"http://localhost:53769/pg/v1/payments\": The target server failed to respond\n\tat org.springframework.web.client.DefaultRestClient$DefaultRequestBodyUriSpec.createResourceAccessException(DefaultRestClient.java:779)\n\tat org.springframework.web.client.DefaultRestClient$DefaultRequestBodyUriSpec.exchangeInternal(DefaultRestClient.java:624)\n\tat org.springframework.web.client.DefaultRestClient$DefaultRequestBodyUriSpec.exchange(DefaultRestClient.java:572)\n\tat org.springframework.web.client.RestClient$RequestHeadersSpec.exchange(RestClient.java:747)\n\tat org.springframework.web.client.DefaultRestClient$DefaultResponseSpec.executeAndExtract(DefaultRestClient.java:924)\n\tat org.springframework.web.client.DefaultRestClient$DefaultResponseSpec.body(DefaultRestClient.java:833)\n\tat com.example.board.payment.PgClient.lambda$approve$0(PgClient.java:34)\n\tat com.example.board.payment.PgClient.call(PgClient.java:53)\n\t... 4 more\nCaused by: org.apache.hc.core5.http.NoHttpResponseException: The target server failed to respond\n\tat org.apache.hc.core5.http.impl.io.DefaultBHttpClientConnection.receiveResponseHeader(DefaultBHttpClientConnection.java:333)\n\tat org.apache.hc.core5.http.impl.io.HttpRequestExecutor.execute(HttpRequestExecutor.java:197)\n\tat org.apache.hc.client5.http.impl.classic.InternalExecRuntime.lambda$execute$0(InternalExecRuntime.java:236)\n\tat org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager$In"
  }
]
````
