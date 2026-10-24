**1) 판정: FAIL**

지정 커밋과 현재 HEAD `5d314ab9cc87a4500e664e77a01dbf2ff40cef54`를 대조했습니다. **major 4건, minor 5건**입니다. 결함 주입과 정답 패치는 대체로 설계에 맞지만, 재현 환경과 장애 훈련 도구에 수정이 필요한 문제가 있습니다.

파일은 수정하지 않았습니다. Gradle·Docker·실제 HTTP 재현은 실행하지 않았으므로, **현재 소스의 RED→GREEN과 전체 테스트 통과는 확정하지 않습니다.** 아래에서는 정적 근거와 파일·네트워크 변경 없는 모사 결과를 구분했습니다.

**2) 문제 목록**

1. **major — Redis 호스트 포트가 정답 서버와 충돌합니다.**

   - 위치: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/compose.yaml:21](../../../../messy-server/compose.yaml)
   - 대조: [$WORKTREE_ROOT/p1-spec-roadmap/board-server/compose.yaml:20](../../../../board-server/compose.yaml)
   - 양쪽 모두 다음 포트를 공개합니다.

     ```yaml
     - "16379:6379"
     ```

   - **영향:** 정답 서버가 실행 중이면 messy Redis의 포트 바인딩이 실패합니다. 프록시 `16380`을 추가해도 직접 포트 `16379`의 충돌은 없어지지 않습니다. 원장의 동시 실행 방침에도 어긋납니다.
   - **수정:** messy Redis 직접 공개 포트를 별도 번호로 바꾸거나 제거하고, 장애 훈련 문서의 `redis-cli` 포트도 맞춥니다.

2. **major — 장애 관찰 스크립트가 curl 실패 시 종료됩니다.**

   - 위치: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/drills/probe.sh:24](../../../../messy-server/drills/probe.sh)

     ```bash
     out=$(curl ... -w '%{http_code} %{time_total}' "$@" || echo "000 $MAX")
     code=${out% *}; t=${out#* }
     printf '%s %5.2fs%s' "$code" "$t" "$flag"
     ```

   - curl은 실패해도 `-w` 출력을 남깁니다. 여기에 fallback 출력이 붙어 시간이 `10.001234000 10`처럼 됩니다.
   - **확인 결과:** curl 출력·종료 코드만 모사했을 때 `printf: … invalid number`, 종료 코드 **1**이 나왔습니다. 장애를 기록해야 할 순간에 관찰 루프가 끝납니다.
   - **수정:** 성공·실패 분기를 나눠 상태 코드와 시간을 한 번만 설정합니다. B16 재현 스크립트에서 이미 적용한 방식처럼 처리하면 됩니다.

3. **major — 장애 예약을 중복 실행하면 복구 후 다시 장애가 주입될 수 있습니다.**

   - 위치: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/drills/start.sh:22](../../../../messy-server/drills/start.sh)
   - 복구 측: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/drills/recover.sh:13](../../../../messy-server/drills/recover.sh)

     ```bash
     (...) >/dev/null 2>&1 &
     echo $! >"$OUT/scheduled.pid"
     ```

     ```bash
     kill "$(cat "$OUT/scheduled.pid")" 2>/dev/null || true
     ```

   - **정적 근거:** 두 번 시작하면 두 예약 프로세스가 생기지만 PID 파일에는 마지막 것만 남습니다. 복구는 마지막 예약만 취소하므로 첫 예약이 나중에 장애를 주입할 수 있습니다. 먼저 끝난 예약이 다른 예약의 PID 파일을 지우는 경합도 있습니다.
   - **수정:** 활성 예약이 있으면 중복 시작을 거부하거나, 훈련별 식별자와 PID를 관리해 해당 훈련의 모든 예약을 취소하고 종료를 확인합니다.

4. **major — 장애 삭제가 실패해도 복구 성공으로 기록합니다.**

   - 위치: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/drills/recover.sh:19](../../../../messy-server/drills/recover.sh)

     ```bash
     toxics=$(curl -sf "$TOXI/proxies/$PROXY/toxics" || echo '[]')
     ...
     curl -sf -X DELETE "$TOXI/proxies/$PROXY/toxics/$name" >/dev/null || true
     ...
     echo "... 복구: $PROXY 장애 제거, 프록시 열림"
     ```

   - 조회 실패를 빈 목록으로, 삭제 실패를 성공처럼 취급합니다. 프록시 활성화만 성공하면 지연 toxic이 남아도 복구 완료를 기록합니다.
   - **확인 결과:** 삭제 요청 실패를 모사했는데도 성공 문구와 종료 코드 **0**이 나왔습니다.
   - **수정:** 조회·삭제 실패를 반환하고, 마지막에 toxic 제거와 `enabled=true`를 다시 조회해 확인한 뒤 성공을 기록합니다. 제어 요청에도 대기 상한을 둡니다.

5. **minor — B16의 인기글 검사가 앞선 글쓰기의 guard 상태에 가려집니다.**

   - 위치: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/tickets/B16/answer/B16ConfirmTest.java:51](../../../../messy-server/tickets/B16/answer/B16ConfirmTest.java)

     ```java
     injectFault();
     Timed created = timed(() -> createPost(writer));
     Timed popular = timed(this::popular);
     ```

   - 정답 수정 후 글쓰기에서 Redis 실패를 잡으면 공유 `RedisGuard`가 5초간 Redis를 건너뜁니다. 바로 뒤의 인기글 요청은 이 상태에서 검사됩니다.
   - **범위:** 지연·끊김 컨텍스트를 분리한 것은 적절합니다. 다만 **인기글이 장애 후 첫 요청인 경우**의 타임아웃·폴백은 독립적으로 검증하지 못합니다. 본문이 실제 DB 결과인지도 검사하지 않습니다.
   - **수정:** 인기글 단독 시나리오를 추가하고, 워밍업 후 guard를 초기화한 상태에서 장애를 주입합니다. 응답 시간·상태뿐 아니라 미리 넣은 DB 데이터도 확인합니다.

6. **minor — B14 확인 테스트가 정답 수정의 일부를 놓칩니다.**

   - 위치: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/tickets/B14/answer/B14ConfirmTest.java:47](../../../../messy-server/tickets/B14/answer/B14ConfirmTest.java)

     ```java
     mockMvc.perform(get("/actuator/env")
             .header("Authorization", bearer(admin)))
             .andExpect(status().isOk());
     ```

   - 상태 코드만 보므로 `show-values: always`가 남아 있는 수정도 통과할 수 있습니다. metrics는 무인증만 검사해 일반 회원 접근 허용도 놓칩니다.
   - **수정:** 테스트용 비밀값이 응답에 평문으로 포함되지 않는지, USER metrics 403·ADMIN metrics 200을 추가합니다. 현재 정답 패치 자체는 이 문제를 올바르게 수정합니다.

7. **minor — B11·B14 재현 스크립트가 다른 프로세스를 종료할 수 있습니다.**

   - 위치:
     - [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/tickets/B11/repro.sh:35](../../../../messy-server/tickets/B11/repro.sh)
     - [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/tickets/B14/repro.sh:29](../../../../messy-server/tickets/B14/repro.sh)

     ```bash
     pkill -f "server.port=$PORT"
     ```

   - 자신이 시작한 프로세스인지 확인하지 않고 전체 명령줄을 부분 일치시킵니다. 예를 들어 `PORT=808`로 실행하면 별개 서버의 `server.port=8080`도 일치합니다.
   - **수정:** 시작한 프로세스와 그 자식만 추적해 종료하고, 포트 점유와 기동 프로세스의 조기 종료도 확인합니다.

8. **minor — B12 제출물 문구가 접기 밖에서 원인 구조를 알려 줍니다.**

   - 위치: [$WORKTREE_ROOT/p1-spec-roadmap/course/tickets/B12.md:22](../../../../course/tickets/B12.md)

     > 원인 서술: 새 출처 설정이 어디에 들어갔고, 왜 그 설정까지 요청이 오지 못하는가

   - 등록한 설정에 요청이 도달하지 못한다는 원인을 미리 전제합니다.
   - **수정:** “기존 출처와 새 출처의 결과가 다른 이유와 관찰 근거”처럼 중립화하고, 현재 문장은 접힌 힌트로 옮깁니다.

9. **minor — B11의 정답 서버 설명이 환경 변수 덮어쓰기 가능성을 잘못 제한합니다.**

   - 위치: [$WORKTREE_ROOT/p1-spec-roadmap/course/tickets/B11.md:65](../../../../course/tickets/B11.md)

     > 환경 변수로 들어오는 것은 자리표시자가 가리키는 이름뿐이라 같은 키가 두 출처에 겹치지 않는다.

   - 정답 서버도 동일한 `@ConfigurationProperties("board")` 바인딩을 사용합니다. 자리표시자를 적지 않은 설정도 환경 변수로 덮어쓸 수 있으므로, 자리표시자가 이를 제한한다는 설명은 부정확합니다.
   - **수정:** “이 배포 구성에는 중복 환경 변수가 없다”는 구성상의 사실과 “환경 변수는 여전히 설정을 덮어쓸 수 있다”는 동작을 구분합니다.

**3) 확인한 것 목록**

아래 RED→GREEN은 **코드에서 확인한 실패·통과 근거이며 이번 검토의 실제 JUnit 실행 결과는 아닙니다.**

| 대상 | 결함과 확인 테스트 대조 | 정답·과적합 판단 |
|---|---|---|
| **B08** | 엔티티 직접 반환으로 해시와 추가 필드가 노출됩니다. 확인 테스트는 해시 값 부재, 명세의 5개 필드, KST 오프셋을 검사합니다. | DTO 복원은 타당합니다. 특정 DTO 클래스 사용을 강제하지 않아 동일 응답 계약을 만족하는 다른 수정도 허용합니다. |
| **B11** | 배포 환경 변수 `7200`과 prod 설정 `1800`의 충돌입니다. 실제 배포 파일을 읽어 Spring 설정을 합치고 prod 1800·local 3600을 검사합니다. | 환경 변수 제거는 타당합니다. 파일 내용 자체가 아니라 최종 바인딩 값을 판정합니다. 설명 오류는 위 9번입니다. |
| **B12** | 새 출처는 MVC 설정에만 있고 Security용 허용 목록에서 빠져 있습니다. 새·기존·금지 출처 모두 `Origin`, 요청 method·headers를 넣습니다. 새 출처의 허용 응답 헤더와 실제 POST도 검사합니다. | 허용 출처 통합 패치는 타당합니다. 내부 설정 클래스 구조를 강제하지 않습니다. |
| **B13** | 넓은 POST 인증 규칙이 콜백 공개 규칙보다 먼저입니다. 테스트는 JWT 없이 정상 서명 200·충전 확정·잔액 증가, 잘못된/없는 서명의 별도 오류와 상태 보존을 검사합니다. | 규칙 이동과 기존 테스트의 `@WithMockUser` 제거는 타당합니다. 단순 401 비교로 잘못 통과하지 않습니다. |
| **B14** | Actuator 전체 공개 규칙이 env ADMIN 규칙보다 먼저이고, prod에서 env 노출·값 공개가 켜집니다. 무인증·USER·ADMIN·health를 검사합니다. | health만 공개하는 패치는 타당합니다. env를 닫기만 하는 수정은 ADMIN 200 검사에서 탈락합니다. 누락은 위 6번입니다. |
| **B16** | 명령 타임아웃 제거와 예외 처리 범위 축소가 설계 원인에 맞습니다. 3초 지연·연결 끊김을 별도 컨텍스트에서 주입하고 워밍업·종료 후 프록시 복구를 수행합니다. | 500ms 타임아웃과 `DataAccessException` 폴백 복원은 타당합니다. 요청 간 상태에 의한 검사 누락은 위 5번입니다. |

추가 확인 사항은 다음과 같습니다.

- **B13은 B14에 가려지지 않습니다.** B14의 `EndpointRequest.toAnyEndpoint()`는 Actuator 범위이며 PG 콜백을 공개하지 않습니다.
- **결함 표시 주석:** S 담당 결함 코드·설정에서 티켓 번호나 “결함/버그”를 직접 표시한 주석은 발견하지 못했습니다. 잘못된 선택을 정당화하는 실무형 주석입니다.
- **패치 충돌:** S 담당 6개 모두 실제 `git apply --check` 종료 코드 0입니다. 메모리에서 완전한 문맥 일치로 적용한 720개 순서도 모두 성공했습니다. 전체 B01~B16·E01의 번호순 누적 문맥 검사도 성공했습니다. 실제 누적 적용 후 빌드·테스트까지 검증한 것은 아닙니다.
- **파일 중첩:** B12는 CorsConfig, B13·B14는 SecurityConfig의 서로 떨어진 영역을 수정합니다. B11 패치는 배포 환경 변수 파일만 수정하므로 B16의 공통 설정 수정과 겹치지 않습니다.
- **재현 전제:** MySQL `13311`, Redis 프록시 `16380`, PG 프록시 `18667`의 연결은 설정과 일치합니다. 직접 Redis 포트 충돌은 별도 문제입니다.
- **자체 테스트 약화:** B08은 노출 금지 단언 제거, B12는 기존 출처만 검사, B13은 인증 사용자 주입, B16은 지연 테스트 제거로 의도한 결함을 놓치게 했습니다. B14는 기존 test 프로파일에 env가 노출되지 않아 놓치는 구성입니다. 변경 범위는 계획의 담당 예외와 맞습니다.
- **페이지 형식·배정:** 6개 모두 제출물과 접힌 힌트·정답이 있습니다. B08 D11 ②·③, B11·B14 D11 ①·③, B12 D14 ①, B13 D14 ②, B16 D14 ④·⑥ 표기는 roadmap과 일치합니다.
- **장애 훈련 회고:** 타임라인, 인지·원인 지목 시각, 증거, 조치, 재발 방지의 담당·기한·확인 방법이 포함돼 있습니다.
- **셸 문법:** 장애 훈련 및 B 티켓 재현 스크립트의 `bash -n` 검사는 통과했습니다. 문법 통과와 실제 동작 정상은 구분해야 합니다.model=gpt-6-astra
