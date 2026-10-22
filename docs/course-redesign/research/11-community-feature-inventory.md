# 11. 실서비스 커뮤니티 기능 인벤토리와 강제되는 백엔드 역량

> 작성일 2026-10-22. 목적: 온보딩 실습을 "기능 목록"이 아니라 "기능이 강제하는 역량" 기준으로 설계하기 위한 근거 자료.
> 원칙: **이번 조사에서 직접 열어본 페이지·소스만** 근거로 삼았다. 열지 못한 출처는 맨 아래 "확인 불가"에 분리했다.
> 표기: [소스] = GitHub 소스 파일 직접 확인, [블로그] = 공식 블로그/문서 확인. "난이도"와 "강제 역량" 열은 근거를 읽고 내린 **내 평가**이며 출처가 말한 것이 아니다.

## 0. 직접 확인한 출처 목록

| 약칭 | URL | 종류 |
|---|---|---|
| D-TL | https://blog.discourse.org/2018/06/understanding-discourse-trust-levels/ | [블로그] |
| D-RL | https://raw.githubusercontent.com/discourse/discourse/main/lib/rate_limiter.rb | [소스] |
| D-SI | https://raw.githubusercontent.com/discourse/discourse/main/app/services/search_indexer.rb | [소스] |
| D-TT | https://raw.githubusercontent.com/discourse/discourse/main/app/models/top_topic.rb | [소스] |
| D-DG | https://raw.githubusercontent.com/discourse/discourse/main/app/jobs/scheduled/enqueue_digest_emails.rb | [소스] |
| D-AS | https://raw.githubusercontent.com/discourse/discourse/main/app/services/spam_rule/auto_silence.rb | [소스] |
| D-NP | https://raw.githubusercontent.com/discourse/discourse/main/lib/new_post_manager.rb | [소스] |
| D-PA | https://raw.githubusercontent.com/discourse/discourse/main/app/services/post_alerter.rb | [소스] |
| D-UD | https://raw.githubusercontent.com/discourse/discourse/main/app/services/user_destroyer.rb | [소스] |
| D-EX | https://raw.githubusercontent.com/discourse/discourse/main/app/jobs/regular/export_csv_file.rb | [소스] |
| D-WH | https://raw.githubusercontent.com/discourse/discourse/main/app/models/web_hook.rb , .../app/jobs/regular/emit_web_hook_event.rb | [소스] |
| D-UP | https://raw.githubusercontent.com/discourse/discourse/main/app/models/upload.rb | [소스] |
| D-ET | https://raw.githubusercontent.com/discourse/discourse/main/app/models/email_token.rb | [소스] |
| D-SSO | https://raw.githubusercontent.com/discourse/discourse/main/lib/discourse_connect_base.rb | [소스] |
| D-2FA | https://raw.githubusercontent.com/discourse/discourse/main/app/models/user_second_factor.rb | [소스] |
| D-UH | https://raw.githubusercontent.com/discourse/discourse/main/app/models/user_history.rb | [소스] |
| D-PU | https://raw.githubusercontent.com/discourse/discourse/main/app/jobs/scheduled/periodical_updates.rb | [소스] |
| F-GEM | https://raw.githubusercontent.com/forem/forem/main/Gemfile , https://github.com/forem/forem (README) | [소스] |
| F-RA | https://raw.githubusercontent.com/forem/forem/main/config/initializers/rack_attack.rb | [소스] |
| F-FEED | https://raw.githubusercontent.com/forem/forem/main/app/services/articles/feeds/variant_query.rb | [소스] |
| L-RANK | https://join-lemmy.org/docs/contributors/07-ranking-algo.html | [문서] |
| L-FED | https://join-lemmy.org/docs/contributors/05-federation.html | [문서] |
| R-SORT | https://github.com/reddit-archive/reddit/blob/master/r2/r2/lib/db/_sorts.pyx (2017-11-09 archived) | [소스] |
| R-API | https://github.com/reddit-archive/reddit/wiki/API | [문서] |
| SO-2016 | https://stackoverflow.blog/2016/02/17/stack-overflow-the-architecture-2016-edition/ | [블로그] |
| SO-SRCH | https://stackoverflow.blog/2011/01/28/stack-overflow-search-now-81-less-crappy/ | [블로그] |
| DG-FEED | https://careers.daangn.com/blog/post/동네-소식-연결하는-슈퍼-피드를-향하여/ | [블로그] |
| D-META | https://meta.discourse.org/t/what-are-discourse-digests/36627 | 웹 검색 결과 요약만 확인(본문 직접 fetch 안 함) |

---

## 1. 기능별 인벤토리 표

### 1-1. 회원·인증

| 기능 | 확인 위치 | 실서비스에서 까다로운 점 (공개 자료 근거) | 강제되는 백엔드 역량 | 난이도 |
|---|---|---|---|---|
| 이메일 인증 토큰 | Discourse [D-ET] | 토큰 원문은 저장하지 않고 SHA-256 해시만 unique index로 저장, 조회는 해시로 한다. 용도별 scope(signup/password_reset/email_login/email_update)를 나누고, 같은 scope의 새 토큰 발급 시 이전 토큰을 만료 처리한다. 확인 처리는 트랜잭션 하나에서 토큰 확정 + 이메일 설정 + 계정 활성화 + 초대 소진까지 묶는다. 이메일이 이미 쓰이면 실패(nil)로 처리. 확인 파일 안에는 rate limit 로직이 없었다. | 보안(토큰 해시 저장), 트랜잭션 경계, 만료·무효화 정책, 유니크 제약과 경합 | 중 |
| 소셜 로그인 / OAuth 제공자 | Forem [F-GEM] | Gemfile에 omniauth-apple/facebook/github/google-oauth2/twitter가 있고, devise + devise_invitable로 계정·초대를 관리한다. | 외부 연동 장애 내성(제공자 장애·이메일 미제공 케이스), 계정 연결(동일인 병합), CSRF/state 검증 | 중상 |
| 외부 SSO(DiscourseConnect) | Discourse [D-SSO] | 페이로드를 Base64 후 HMAC-SHA256 서명, 검증은 상수 시간 비교(`secure_compare`) 후에만 필드를 해석. nonce 기본 수명 30분, 사용된 nonce 보관 24시간이 상수로 정의돼 있다(실제 검사는 해당 파일 밖). | 보안(서명 검증·타이밍 공격·재사용 방지), 입력 검증 | 중상 |
| 2FA(TOTP) | Discourse [D-2FA] | `user_second_factors` 테이블에 TOTP 시크릿(`data`)·`last_used`·backup_codes 방식을 구분하는 enum이 있고 사용자당 최대 50개 제한. 확인한 파일에는 검증/암호화/시도 제한 로직이 없었다(다른 모듈에 있을 수 있음, 확인 불가). | 보안, 시간 기반 코드 재사용 방지(`last_used`), 복구 코드 설계 | 중 |
| 계정 삭제(탈퇴) | Discourse [D-UD] | `User.transaction` 안에서 보안키·북마크·드래프트·알림·열람기록 등을 삭제하고 사용자 레코드를 파기. 글이 있으면 기본적으로 삭제 거부(`PostsExistError`), 허용 시 글은 `user_id = nil`로 익명화하고 카테고리는 시스템 사용자로 이관. 스태프 로그에는 삭제된 사용자 ID·이름을 남긴다. 이메일·IP 차단(`ScreenedEmail`, `ScreenedIpAddress`) 옵션. 이 코드는 **동기 실행**이라 백그라운드 처리가 없다. | 트랜잭션 경계, 참조 무결성(FK 정책), 개인정보 파기 vs 콘텐츠 보존 트레이드오프, 감사 로그 | 상 |
| 데이터 내보내기 | Discourse [D-EX] | 별도 Sidekiq job(`retry: false`)이 `find_each`로 배치 조회하며 CSV를 스트리밍하고 zip으로 압축, 업로드로 첨부한 뒤 시스템 메시지로 완료/실패를 통지한다. 권한은 Guardian으로 검사, 임시 디렉터리는 `ensure`에서 정리. 행 수/크기 상한은 파일 안에 없다. | 비동기 job, 대용량 스트리밍/배치 조회, 권한 검사, 실패 통지, 임시 자원 정리 | 중 |

### 1-2. 권한·역할·신뢰 레벨

| 기능 | 확인 위치 | 까다로운 점 | 강제 역량 | 난이도 |
|---|---|---|---|---|
| 신뢰 레벨(TL0~TL4) | Discourse [D-TL] | TL0는 링크 2개·멘션 2개·이미지 1개·토픽 3개·답글 10개 제한, TL1은 토픽 5개 진입·글 30개 읽기·10분 읽기, TL2는 15일 방문·좋아요 1회 주고받기 등, TL3는 **최근 100일** 롤링 윈도우로 방문 50%·좋아요 20/30·확정된 스팸 플래그 5개 이하·6개월 내 정지 이력 없음이며 2주 유예 후 **강등**된다. TL4는 스태프 수동 승급. 레벨이 오를수록 일일 한도가 1.5배/2배/3배로 늘어난다. 글의 설명은 "주기적 재평가를 암시"할 뿐 실제 계산 메커니즘은 다루지 않는다. | 집계 쿼리·롤링 윈도우, 배치/스케줄러, 상태 전이(승급·강등·유예), 권한 매트릭스, 데이터 모델링(통계 테이블) | 상 |
| 역할/권한 라이브러리 | Forem [F-GEM] | `pundit`(정책 객체) + `rolify`(역할), 기능 플래그 `flipper`. | 인가 설계(역할 vs 정책 분리), 기능 플래그 | 중 |
| 감사 로그(스태프 액션) | Discourse [D-UH] | `user_histories`에 action(정수 enum), `acting_user_id`, `target_user_id`, `previous_value`/`new_value`, `ip_address`, `details` 컬럼. 관리자는 전체, 모더레이터는 일부 action만 조회 가능. 삭제 코드 [D-UD]도 삭제 시 이 로그를 남긴다. | 변경 이력 모델링, 횡단 관심사(AOP/이벤트), 권한별 조회 필터, 개인정보 포함 이력 처리 | 중 |

### 1-3. 글·댓글·스레드 / 피드·랭킹

| 기능 | 확인 위치 | 까다로운 점 | 강제 역량 | 난이도 |
|---|---|---|---|---|
| Hot 랭킹(Reddit) | Reddit [R-SORT] | `hot = sign*log10(max(|score|,1)) + (epoch_seconds-1134028003)/45000`. 주석에 "postgres의 동일 함수와 일치해야 한다"고 적혀 있어 **앱 코드와 DB 함수에 같은 공식을 이중 구현**한다. 점수의 로그 스케일 때문에 초기 표가 후기 표보다 무겁다. | 정렬 키 설계, 쓰기 시점 계산 vs 읽기 시점 계산, 인덱스(계산 컬럼), 동일 로직 이중 구현의 정합성 | 중 |
| Confidence(댓글 정렬) | Reddit [R-SORT] | Wilson 신뢰구간 하한(80% 신뢰, z=1.2815…). 득표 0이면 0. 표 수가 적을 때 "순위 요동"을 막는 통계적 정렬. | 통계 기반 정렬, 정렬 안정성, 부동소수 정밀도 | 중 |
| Hot / Scaled / Active(Lemmy) | Lemmy [L-RANK] | `Rank = 10000*log(max(1,3+score))/(hours+2)^1.8`, Scaled는 `log(2+월간 활성 사용자)`로 나눠 작은 커뮤니티를 띄운다. Active는 마지막 댓글 시각(2일 제한). 활성 사용자 수(일/주/월/반기)는 시작 시와 **매시간 캐시**한다. 순위 값의 저장·재계산 방식은 해당 문서에 없다. | 시간 감쇠 파라미터화, 집계 캐시와 갱신 주기, 정렬 종류별 인덱스 | 중 |
| Top 토픽 점수(Discourse) | Discourse [D-TT] | daily/weekly/monthly/quarterly/yearly/all 6개 기간별로 posts·views·likes·OP likes를 집계해 점수화. 조회수 로그(배수 기본 2) + OP 좋아요(0.5) + 글당 좋아요(상한 3) + 10개 미만 글 페널티 + 글 수 로그. 갱신은 **`DistributedMutex("update_top_topics")`**(유효 5분)로 중복 실행을 막고, daily 갱신은 트랜잭션 안에서 수행한다. 정수 나눗셈(`(10 - posts)/20`)이 SQL에서 절삭되는 점이 코드 리뷰 포인트로 보인다(내 관찰). | 배치 집계, 분산 락, 기간별 윈도우 집계 쿼리, 가중치 설정화, 멱등성 | 상 |
| 개인화 피드(dev.to) | Forem [F-FEED] | 점수 요소(levers)를 CASE 식으로 만들어 **곱해서** 관련도 점수를 낸다. 정렬은 relevancy_score → published_at. 사용자 차단·점수 음수·메인 이미지 등을 SQL에서 필터, LIMIT/OFFSET 페이징. 랜덤 시드는 사용자별 **10분 캐시**(`race_condition_ttl: 10s`)로 새로고침 시 순서가 흔들리지 않게 한다. | 복잡한 SQL 조합, 캐시 키 설계(사용자별), 캐시 스탬피드 방어, 페이징(OFFSET의 한계) | 상 |
| 이종 콘텐츠 피드(당근) | 당근 [DG-FEED] | 중고·알바·중고차 등 콘텐츠 종류가 제각각이라 서비스별 분산 서빙에서 **중앙집중형 피드**로 전환했다고 설명. 앱 업데이트 없이 새 형태를 노출하기 위해 뷰타입/뷰템플릿을 서버가 내려준다. A/B 테스트용 실험 인프라 구축 중. 캐시 구조·지연시간 목표·저장소 선택은 글에 없다. | API 계약 설계(서버 주도 UI), 실험(A/B) 인프라, 서비스 간 데이터 통합 | 상 |

### 1-4. 검색

| 기능 | 확인 위치 | 까다로운 점 | 강제 역량 | 난이도 |
|---|---|---|---|---|
| PostgreSQL 전문 검색 인덱싱 | Discourse [D-SI] | `post_search_data` 등 `*_search_data` 테이블에 `raw_data`, `locale`, `version`, tsvector(`search_data`)를 저장. 가중치는 post 기준 A=제목, B=카테고리, C=태그, D=본문. 입력은 **60만 자로 절단**(tsvector 최대 1,048,576바이트의 약 50%), 단어 길이 상한, 도메인 분해 루프 10회 상한(무한 루프 방지 주석), 제목 중복어가 인덱스를 지배하지 않게 중복 위치 제한. `version`을 0으로 갱신해 **백그라운드 재색인** 큐로 쓴다. 이 파일은 CJK 분절을 다루지 않는다. | 인덱스 설계(GIN/tsvector), 색인 시점(동기 vs 비동기), 재색인 전략, 입력 상한·방어 코드 | 상 |
| 검색 엔진 이전 | Stack Overflow [SO-SRCH], [SO-2016] | 2011년 SQL Server Full-Text에서 Lucene.NET으로 이전. 이유로 DB 부하 경쟁, SQL과의 어색한 결합·예측 불가 결과, 튜닝 한계를 든다. 평균 검색 시간 3초(편차 큼) → 약 600ms. 각 웹 서버가 로컬 인덱스를 가졌다. 2016년 글은 하루 17,158,874회 Elasticsearch 검색을 기록. | 검색 엔진 도입 판단, 인덱스 동기화, 성능 측정 | 상 |
| 검색 엔드포인트 보호 | Forem [F-RA] | `/search/`는 IP당 5회/초로 throttle. | 레이트 리밋 | 하 |

### 1-5. 알림·다이제스트

| 기능 | 확인 위치 | 까다로운 점 | 강제 역량 | 난이도 |
|---|---|---|---|---|
| 이벤트별 알림 생성 | Discourse [D-PA] | 글 생성/수정 시 멘션·답글·인용·링크·워칭 순으로 알림을 만들되 `notified` 목록으로 **한 사용자에게 한 번만** 보낸다. 그룹 멘션은 `max_users_notified_per_group_mention` 이상이면 확장 생략, `@here`는 상한 있음. 수정 시에는 새로 추가된 멘션만. 차단/뮤트/중복/이미 reply 알림이 있으면 억제. reply·posted 등은 **병합(consolidate)**: 기존 행을 지우고 안 읽은 첫 글 기준으로 `consolidated_count`와 함께 재생성. 100명 단위 배치. | 이벤트 설계, 중복 제거, 팬아웃, 알림 병합(읽음 상태), N+1 방지 | 상 |
| 실시간·푸시 | Discourse [D-PA] | 라이브 알림은 MessageBus의 `/notification-alert/{user_id}` 채널로 발행. 푸시는 방해금지 모드 제외, 구독 필요, 최근 접속 중이면 `push_notification_time_window_mins`만큼 **지연 발송**, 이후 별도 job으로 전달. | 비동기 메시징, 전달 지연·억제 정책, 채널 분리(웹/푸시/메일) | 상 |
| 활동 요약(다이제스트) 이메일 | Discourse [D-DG], [D-META] | 30분마다 도는 스케줄러가 대상 사용자 ID를 뽑아 사용자별 job(`user_email`)을 enqueue. 조건: 다이제스트 설정 켜짐, 사용자별 간격(없으면 사이트 기본), **bounce_score < 임계치**, 마지막 시도가 간격보다 오래됨, 마지막 접속이 간격보다 오래됨(온라인 사용자 제외), `suppress_digest_email_after_days` 초과 비활동자 제외, 정지·스테이지드 제외. `digest_attempted_at ASC NULLS FIRST` 정렬과 `max_digests_enqueued_per_30_mins_per_site` 상한으로 **한 번에 enqueue하는 양을 제한**하고 나머지는 다음 실행에서 소화. | 배치/스케줄러, 대상 선정 쿼리(인덱스), 공정한 순서, 메일 발송 처리량 제어, 반송(bounce) 관리, 멱등성 | 상 |

### 1-6. 모더레이션·스팸·레이트 리밋

| 기능 | 확인 위치 | 까다로운 점 | 강제 역량 | 난이도 |
|---|---|---|---|---|
| 슬라이딩 로그 레이트 리미터 | Discourse [D-RL] | Redis 리스트에 타임스탬프를 쌓고 max로 trim, 만료는 `secs*2`. 검사+기록을 **Lua 스크립트로 원자화**. 실패 시도도 기록해 잠금을 연장하는 "aggressive" 변형. `can_perform?`과 `performed!`는 원자적이지 않아 경합 가능(내가 코드에서 읽은 한계). Redis 읽기 전용 오류는 조용히 삼켜 **한도가 적용되지 않는다**. 스태프는 면제 또는 별도 한도. | 동시성(원자성), Redis, 알고리즘 선택(고정/슬라이딩), 장애 시 fail-open vs fail-close 판단, 예외 설계 | 중상 |
| IP/키 기반 throttle | Forem [F-RA] | rack-attack로 `/api` GET IP당 3/초·30/분, 쓰기 1/초, API 키별 동일 한도, 비밀번호 찾기 3/초 등. 관리자 API 키는 면제(24시간 캐시), 검증된 Googlebot은 sitemap 한도 면제. | 필터/인터셉터, 키 선택(IP vs API키), 면제 정책, 캐시 | 중 |
| 신규 사용자 글 승인 큐 | Discourse [D-NP] | 스태프는 건너뛰고, 신뢰도 낮은 사용자는 글+토픽 수가 `approve_post_count` 미만이면 큐잉. 워치 단어(승인 필요 / 즉시 차단 구분), **첫 글을 지나치게 빨리 쓰면 `fast_typer`**로 큐잉하고 사용자 무음 처리 가능, 자동 무음 정규식, 스테이지드, 카테고리별 규칙, 미디어 포함 시 큐잉. DM은 큐잉하지 않는다. | 규칙 엔진(전략 패턴), 상태 머신(대기·승인·거부), 정책 설정화 | 상 |
| 플래그 기반 자동 무음 | Discourse [D-AS], [D-TL] | TL1 미만 사용자에게 스팸 점수 합계가 임계 이상이고 **서로 다른 신고자 수**가 `num_users_to_silence_new_user` 이상이면 자동 silence. 점수는 pending/agreed 스팸 신고의 합을 SQL로 집계(메모이즈). TL3 사용자의 신고가 TL0 글을 즉시 숨기는 규칙도 있다([D-TL]). | 어뷰징 대응 설계(자기 신고·조작 방지), 신고자 다양성 집계, 오탐 복구 | 상 |
| 폼 보호 | Forem [F-GEM] | `recaptcha`, `carrierwave-bombshelter`(업로드 이미지 폭탄 방어) gem. | 외부 검증 연동, 업로드 방어 | 중 |
| 게시글 필터링(ML) | 당근(검색 요약만 확인, 아래 확인 불가 참조) | — | — | — |

### 1-7. 파일·이미지·CDN

| 기능 | 확인 위치 | 까다로운 점 | 강제 역량 | 난이도 |
|---|---|---|---|---|
| 업로드 관리 | Discourse [D-UP] | sha1 **unique index**로 중복 업로드를 재사용, secure uploads(접근 제어), 썸네일/optimized image를 크기별로 조회·생성, 외부 스토어(S3)와 S3 Inventory로 ETag 불일치 레코드 표시, `upload_references`로 참조 추적, 삭제는 트랜잭션 안에서 스토어에서도 제거. 확인한 파일에는 CDN 전용 로직이 없다. | 파일 스토리지 추상화, 해시 기반 중복 제거, 비동기 변환, 참조 정리, 접근 제어 | 상 |
| 이미지 프록시·CDN | Forem [F-GEM] | `imgproxy`, `cloudinary`, `carrierwave`, `fastly`(CDN 캐시 무효화) gem. | CDN 캐시 무효화, 이미지 변환 외부 연동 | 중 |

### 1-8. 외부 연동·웹훅·API

| 기능 | 확인 위치 | 까다로운 점 | 강제 역량 | 난이도 |
|---|---|---|---|---|
| 웹훅 발송 | Discourse [D-WH] | 이벤트 타입 구독 또는 와일드카드, 이벤트마다 job enqueue. 시크릿이 있으면 `X-Discourse-Event-Signature: sha256=HMAC(body)`. `MAX_RETRY_COUNT=4`, 지연 `5^(n-1)`분(1·5·25·125분), 2xx와 404/410 외의 응답만 재시도, **404/410이면 훅을 비활성화**하고 스태프 로그에 남긴다. 매 시도를 `WebHookEvent`로 기록하고 스태프에게 MessageBus로 알린다. 모델 주석에 "IP는 요청 시점에 다시 검사" 문구가 있어 SSRF 방어를 하는 것으로 보인다(구현 코드는 확인 못 함). | 외부 연동 장애 내성(재시도·백오프·비활성화), 서명, SSRF, 이벤트 로그 | 상 |
| 공개 API 한도 | Reddit [R-API] | OAuth2 필수, 분당 60 요청, `X-Ratelimit-Used/Remaining/Reset` 헤더, User-Agent 규칙(버전 포함해 구버전 차단 가능). | API 설계, 레이트 리밋 헤더, 클라이언트 식별 | 중 |
| 연합(ActivityPub) | Lemmy [L-FED] | Community=Group, User=Person, Post=Page, Comment=Note. Follow/Create/Like/Flag/Announce 등의 활동을 인스턴스 간 교환, 액터 공개키로 서명 검증, 커뮤니티가 followers에게 Announce 재전파. 해당 문서에는 큐·재시도·장애 인스턴스 처리가 없다. | 분산 프로토콜 이해, 서명, 멱등 수신 | 최상(온보딩 범위 밖) |

### 1-9. 운영·관측성·다국어

| 기능 | 확인 위치 | 까다로운 점 | 강제 역량 | 난이도 |
|---|---|---|---|---|
| 주기 작업 | Discourse [D-PU] | 15분마다: 카테고리 추천 토픽, 최근 1일 글 점수 재계산(긴 토픽은 6시간에 한 번), 오래된 글 rebake(우선순위 `ultra_low`), 프로필·태그 250건씩 rebake, 새 토픽 시간 임계 갱신, 카테고리 자동 bump. | 배치 크기·우선순위 제어, 호출 횟수 기반 분산(`@call_count % 24`), 재처리(rebake) | 중상 |
| 관측성 도구 | Forem [F-GEM] | honeycomb-beeline, ddtrace, dogstatsd-ruby, honeybadger, sentry. 백그라운드: sidekiq + sidekiq-cron + sidekiq-throttled + sidekiq-unique-jobs. | 트레이싱·메트릭·에러 추적, job 중복 방지·스로틀 | 중 |
| 성능 지표 공개 | Stack Overflow [SO-2016] | 2016-02-09 하루: HTTP 209,420,973건, 페이지 로드 66,294,789건, SQL 504,816,843건, Redis 5,831,683,114회, Elasticsearch 17,158,874회, Tag Engine 3,661,134건. 질문 페이지 평균 22.71ms. "performance is still a feature" 문구. | 성능 예산, 캐시 효과 측정(SQL 168시간 vs Redis 2.8시간/일 누적) | 중 |
| 다국어·시간대 | Forem [F-GEM] | Gemfile에 `i18n-js`, `i18n-tasks`는 있으나 `rails-i18n`은 없다. Discourse 검색 인덱서는 `locale`을 저장하지만 실제 저장값은 사이트 기본 로케일이다([D-SI]). 시간대 처리는 이번에 직접 확인하지 못함. | (확인 가능한 범위가 얕다, 아래 확인 불가 참조) | — |

---

## 2. 공개 자료에서 얻은 교차 관찰 (설계에 쓸 만한 것)

1. **"즉시 처리"를 의도적으로 늦추는 패턴이 반복된다.** 푸시 지연 발송([D-PA]), 다이제스트 enqueue 상한([D-DG]), 웹훅 지수 백오프([D-WH]), 검색 재색인 큐([D-SI]). 모두 "한 번에 몰리면 죽는다"에서 나온 장치다.
2. **같은 계산을 두 곳에서 해야 하는 경우가 있다.** Reddit hot은 Postgres 함수와 일치를 요구하는 주석이 있다([R-SORT]). 정합성 테스트를 강제하기 좋은 소재다.
3. **방어 코드의 상한값들**(60만 자 절단, 반복 10회, 단어 길이)은 "운영 중 실제로 터져서" 생긴 것으로 보이나, 사고 경위는 출처에 없다. 추측이므로 교육 자료에서는 "상한이 있다"까지만 말한다.
4. **Fail-open 판단이 코드에 숨어 있다.** Discourse 레이트 리미터는 Redis 읽기 전용 오류를 삼켜 한도를 풀어 버린다([D-RL]). 가용성 vs 보호 트레이드오프를 토론하기에 좋다.
5. **신뢰 레벨은 스팸 방지·권한·한도 배수가 한 모델에 묶인 것**이다([D-TL], [D-NP], [D-AS]). 기능 하나가 여러 역량을 동시에 요구하는 대표 사례.

---

## 3. 역량을 강제하는 기능 Top 15

선정 기준: (a) 한 기능이 서로 다른 역량 여러 개를 동시에 쓰게 하는가, (b) 위 표의 공개 근거가 있는가. 단계 구분은 **A = 빈 프로젝트에서 직접 만들기**, **B = 어수선한 서버에서 고도화하기**. 단계 판단은 내 제안이다.

| 순위 | 기능 | 동시에 강제되는 역량 | 제안 단계 | 이유 |
|---|---|---|---|---|
| 1 | 알림 팬아웃 + 중복 제거/병합 | 비동기 메시징, 트랜잭션 경계(커밋 후 발행), 멱등성, N+1, 읽음 상태 모델링 | **A로 최소형, B에서 병합·배치** | 최소형(댓글 → 작성자 알림)은 처음부터 만들 수 있고, "한 사람에게 한 번만"·병합·팬아웃 상한은 규모가 있어야 의미가 생긴다 [D-PA] |
| 2 | 다이제스트/대량 이메일 발송 | 배치·스케줄러, 대상 선정 쿼리와 인덱스, 처리량 제어, 반송 관리, 멱등성 | **B** | 사용자·로그 데이터가 쌓인 서버에서 쿼리 성능과 상한 제어가 드러난다 [D-DG] |
| 3 | 신뢰 레벨/등급 승급·강등 | 롤링 윈도우 집계, 배치, 상태 전이, 권한 매트릭스, 통계 테이블 설계 | **B** | 집계 원천 데이터(조회·좋아요·플래그)가 먼저 있어야 한다 [D-TL] |
| 4 | 스팸·어뷰징 방지(승인 큐 + 신고 자동 조치) | 규칙 엔진 설계, 상태 머신, 집계 쿼리, 오탐 복구, 동시성 | **A로 승인 큐, B에서 신고 자동 무음** | 승인 큐는 상태 전이 연습으로 작다. 신고자 다양성 집계 등은 후반 [D-NP], [D-AS] |
| 5 | 레이트 리미터 | 동시성(원자성), Redis, 알고리즘 선택, fail-open/close, 예외 설계 | **A** | 독립 모듈로 작게 만들 수 있고, 동시성 테스트로 난이도를 올릴 수 있다 [D-RL], [F-RA] |
| 6 | Hot/Top 랭킹 피드 | 정렬 키·인덱스, 쓰기 vs 읽기 시점 계산, 분산 락, 배치 갱신, 캐시 | **A로 공식 구현, B에서 배치·락·캐시** | 공식은 20줄이지만 대량 데이터 정렬과 갱신 주기가 성능 문제가 된다 [R-SORT], [L-RANK], [D-TT] |
| 7 | 개인화/복합 피드 + 캐시 | 복잡한 SQL, 사용자별 캐시 키, 스탬피드 방어, 페이징 | **B** | OFFSET 페이징 한계와 캐시 무효화는 데이터가 있어야 체감된다 [F-FEED] |
| 8 | 전문 검색 + 재색인 | 인덱스 설계, 색인 시점(동기/비동기), 재색인, 입력 상한, 한글 형태소 | **A로 LIKE→FTS 비교, B에서 재색인·엔진 교체 판단** | "LIKE가 느려지는 순간"을 직접 보는 것이 교육 효과가 크다 [D-SI], [SO-SRCH] |
| 9 | 웹훅/외부 연동 발송 | 재시도·백오프, 서명, SSRF, 이벤트 로그, 장애 시 비활성화 | **B** | 외부 장애를 주입하는 시나리오 중심. 빈 프로젝트에선 수신 대상이 없다 [D-WH] |
| 10 | 소셜 로그인 + 이메일 인증 + 2FA | 보안(토큰 해시·서명), 트랜잭션, 외부 제공자 장애, 계정 병합 | **A(이메일 인증), B(소셜·2FA)** | 토큰 설계는 초반에 올바르게 잡아야 하고, 외부 제공자는 나중에 붙인다 [D-ET], [D-SSO], [F-GEM] |
| 11 | 회원 탈퇴/개인정보 파기 + 데이터 내보내기 | 트랜잭션, FK 정책, 익명화, 대용량 스트리밍, 비동기 job | **B** | 연관 데이터가 많아진 뒤에야 "무엇을 지울까"가 어려운 문제가 된다 [D-UD], [D-EX] |
| 12 | 이미지/파일 업로드 + 변환 + 중복 제거 | 스토리지 추상화, 해시 중복 제거, 비동기 변환, 참조 정리, 접근 제어 | **A로 업로드, B에서 변환·고아 정리** | [D-UP] |
| 13 | 감사 로그 | 횡단 관심사, 변경 전후 기록, 권한별 조회, 개인정보 | **B** | 기존 코드 전반에 일관되게 끼워 넣는 연습으로 적합 [D-UH] |
| 14 | 주기 작업 운영(재계산·rebake·정리) | 배치 크기, 우선순위, 분산 락, 재처리 | **B** | 어수선한 서버의 정리 과제로 자연스럽다 [D-PU], [D-TT] |
| 15 | 관측성(트레이싱·메트릭·에러 추적) + 레이트 리밋 지표 | 지표 설계, 병목 식별, 캐시 효과 측정 | **B** | 지표가 없으면 위 기능들의 성능 문제를 진단할 수 없다. SO의 "SQL 168시간 vs Redis 2.8시간" 같은 비교가 목표 모델 [SO-2016], [F-GEM] |

### 3-1. 사용 제안 (한 줄)

- A(빈 프로젝트): 인증 + 글/댓글 + 레이트 리미터 + 승인 큐 + 최소 알림 + hot 정렬 + LIKE 검색 + 업로드. 전부 "작은 형태"로 만들어 두되, **의도적으로 한계가 보이게** 한다(예: 알림은 동기 호출, 검색은 LIKE).
- B(어수선한 서버): 위 한계를 재료로 비동기화·배치화·인덱스·캐시·분산 락·관측성을 얹는다. 기능을 새로 만드는 게 아니라 **기존 기능의 병목을 증명하고 해결**하는 과제로 구성한다.

---

## 4. 확인 불가

- **Reddit 엔지니어링 블로그**: reddit.com / redditinc.com 도메인은 검색 도구가 접근을 거부해 직접 열지 못했다. 댓글 트리 비정규화·투표 큐·알림 구조에 대한 설명은 2차 요약만 있어 **표에 넣지 않았다**. Reddit 근거는 아카이브된 GitHub 소스([R-SORT])와 API 위키([R-API])뿐이다. 또 `r2` README의 Cassandra/RabbitMQ 등 아키텍처 설명도 확인하지 못했다.
- **네이버 카페**: D2 및 검색에서 카페 게시글/알림 구조에 대한 기술 글을 찾지 못했다. 근거 없이 넣지 않았다.
- **OKKY**: 기능 소개(Q&A·아티클·Jobs, 2000년 OKJSP로 시작해 2015년 개편)만 2차 자료로 확인했고 기술 구현 자료는 찾지 못했다. 표에서 제외.
- **당근**: 슈퍼 피드 글([DG-FEED])은 직접 확인했다. "딥러닝으로 동네생활 게시글 필터링하기"(medium.com/daangn)는 본문이 403이라 **검색 결과 요약만** 봤으며 구현 세부는 확인하지 못했다. 동네생활 신고·알림·검색 구현 글은 찾지 못했다. medium.com/daangn 목록 페이지도 403.
- **Stack Overflow**: 2016 글은 SQL Server·Redis 캐시 계층·HAProxy 이름을 언급하지 않았고(요약 기준) 트래픽 지표만 확인됐다. Tag Engine/SQL Server 관련 설명은 웹 검색 요약에 의존한 부분이 있어 표에는 쓰지 않았다. 검색 이전 글(2011)은 직접 확인.
- **Discourse 2FA 검증 로직, 알림 이메일 전송, 이메일 인증 rate limit, 시간대/다국어, hot 토픽 점수(`topic_hot_scores.rb` 404)**: 파일을 찾지 못했거나 해당 파일에 구현이 없었다. 다른 파일에 있을 수 있으나 확인 못 함. Discourse 다이제스트의 Meta 문서(D-META)는 검색 결과 요약만 확인.
- **Discourse 신뢰 레벨의 실제 계산 메커니즘**: 블로그 글([D-TL])은 승급 조건과 권한만 다루고 계산 방식(일 단위 job 등)은 다루지 않는다. 소스의 승급 로직은 열어보지 않았다.
- **Forem**: 검색(pg_search gem 존재만 확인), 알림, 신뢰 모델의 구현은 열어보지 않았다. README/Gemfile 수준의 사실만 사용. Forem 피드 코드에서 AI 공개 수준 항목의 `ELSE 0.0`이 곱셈에서 0이 되는 문제를 의심했으나 이는 요약기의 추정이라 **버그로 단정하지 않는다**.
- **Lemmy**: 연합 문서에 전송 큐·재시도 설명이 없었고, 레이트 리밋/페이징 코드는 URL이 404라 확인하지 못했다. 랭킹 값의 저장·재계산 방식도 문서에 없다.
- **난이도/강제 역량/Top 15 단계 배정**은 공개 자료를 읽고 내린 **내 판단**이며 외부에서 검증된 값이 아니다.
- 이 문서의 웹 fetch 결과 중 일부는 요약 모델을 거친 것이라 코드 인용은 원문과 미세하게 다를 수 있다. 교육 자료에 인용하기 전 원본 URL을 한 번 더 열어볼 것.
