#!/usr/bin/env python3
"""학습용(practice DB) 데이터 생성기 — docker/mysql/sql/practice-seed.sql 을 만든다.

시드가 고정이라 몇 번을 돌려도 같은 데이터가 나온다. 기준 시각(BASE)은 2026-10-05 00:00.
데이터를 바꾸면 DB를 새로 만들어야 반영된다: docker compose down -v && docker compose up -d --build

일부러 넣어 둔 함정(practice/MISSIONS.md '데이터에 숨겨 둔 함정'과 같다)
- post.like_count / comment_count 가 실제 행 수와 어긋난 글
- 삭제·숨김 처리되거나, 나중에 팔로워 공개로 바뀐 글에 남아 있는 좋아요·북마크
- 차단 관계, 탈퇴·정지 회원, 같은 제목의 글, 아주 긴 본문, 이모지
- 삭제된 댓글 밑에 살아 있는 답글, 폴더가 10개 꽉 찬 회원
사용: python3 docker/mysql/gen_practice_seed.py [--oracle]   (--oracle: 함정 위치 출력)
"""
import datetime as dt
import pathlib
import random
import sys

R = random.Random(20261005)
BASE = dt.datetime(2026, 10, 5)
START = dt.datetime(2026, 7, 1)
OUT = pathlib.Path(__file__).resolve().parent / "sql" / "practice-seed.sql"


def rand_time(a, b):
    """a 이상 b 미만의 임의 시각(초 단위)."""
    if b <= a:
        return a
    return a + dt.timedelta(seconds=R.randrange(int((b - a).total_seconds())))


def early_time(a, b):
    """a~b 사이에서 앞쪽(글이 올라온 직후)에 몰리는 시각 — 좋아요·댓글은 초반에 많이 달린다."""
    if b <= a:
        return a
    span = (b - a).total_seconds()
    return a + dt.timedelta(seconds=int(min(span - 1, R.expovariate(1 / (span / 6)))))


# ---------------------------------------------------------------- 회원
NICKS = ["운영자", "코딩하는고양이", "자바초보탈출", "스프링요정", "쿼리장인", "밤샘개발자", "리액트에서왔어요", "디버깅중",
         "테스트러버", "도커고래", "커피와코드", "백엔드입문", "알고리즘산책", "리팩토링중독", "성능튜너", "보안지킴이",
         "주니어개발자", "회고쓰는사람", "취준생화이팅", "오늘도배포", "깃충돌해결사", "야근없는팀", "로그분석가",
         "인덱스탐험가", "트랜잭션맨", "조용한독자", "눈팅전문", "말많은회원", "떠난개발자", "새로온회원"]
members = []
for i, nick in enumerate(NICKS, 1):
    created = dt.datetime(2026, 5, 1) + dt.timedelta(days=(i - 1) * 2, hours=R.randrange(24))
    m = dict(id=i, email=f"user{i:02d}@example.invalid", nickname=nick, role="ADMIN" if i == 1 else "USER",
             status="ACTIVE", created_at=created, updated_at=created, deleted_at=None, active_until=BASE)
    members.append(m)
M = {m["id"]: m for m in members}
M[28].update(status="SUSPENDED", updated_at=dt.datetime(2026, 9, 10), active_until=dt.datetime(2026, 9, 10))
M[29].update(status="WITHDRAWN", email="withdrawn-29@example.invalid", updated_at=dt.datetime(2026, 9, 1),
             deleted_at=dt.datetime(2026, 9, 1), active_until=dt.datetime(2026, 9, 1))
M[30].update(created_at=dt.datetime(2026, 10, 3, 14), updated_at=dt.datetime(2026, 10, 3, 14))
WRITERS = list(range(2, 26)) + [28, 29]          # 26·27은 읽기만, 30은 아무 활동 없음
ACTORS = list(range(2, 30))                      # 좋아요·댓글·북마크를 하는 회원(1 운영자, 30 신규 제외)

# ---------------------------------------------------------------- 게시판·태그
BOARDS = [(1, "notice", "공지사항", "ADMIN", 1), (2, "dev", "개발", "USER", 2), (3, "qna", "질문", "USER", 3), (4, "free", "자유", "USER", 4)]
TAGS = ["java", "spring", "jpa", "mysql", "docker", "react", "typescript", "회고", "취업", "알고리즘", "테스트", "리팩토링", "성능", "보안", "일상"]
TAG_ID = {t: i for i, t in enumerate(TAGS, 1)}

# ---------------------------------------------------------------- 팔로우·차단
follows = {}                                     # (follower, followee) -> created_at
popular = [2, 3, 4, 5]                           # 팔로워가 많은 회원
for f in ACTORS:
    targets = set(R.sample([x for x in popular if x != f], k=R.randint(1, 3)))
    targets |= set(R.sample([x for x in WRITERS if x != f], k=R.randint(0, 4)))
    for t in targets:
        a = max(M[f]["created_at"], M[t]["created_at"])
        follows[(f, t)] = rand_time(a, min(M[f]["active_until"], BASE))
for f, t in [(2, 3), (3, 2), (4, 5), (5, 4), (7, 6), (6, 7)]:  # 맞팔
    follows.setdefault((f, t), rand_time(dt.datetime(2026, 6, 1), dt.datetime(2026, 7, 1)))
BLOCKS = {(5, 6): dt.datetime(2026, 8, 3), (7, 2): dt.datetime(2026, 8, 20), (10, 11): dt.datetime(2026, 9, 2),
          (11, 10): dt.datetime(2026, 9, 2, 1), (14, 3): dt.datetime(2026, 9, 15)}
for (a, b) in BLOCKS:                            # 차단하면 팔로우는 끊긴다
    follows.pop((a, b), None)
    follows.pop((b, a), None)


def blocked(a, b):
    return (a, b) in BLOCKS or (b, a) in BLOCKS


def follows_at(f, t, when):
    c = follows.get((f, t))
    return c is not None and c <= when


# ---------------------------------------------------------------- 게시글
TOPICS = ["JPA N+1 문제", "스프링 트랜잭션 전파", "MySQL 인덱스 설계", "Docker Compose 로컬 환경", "테스트 코드 작성법",
          "Redis 캐시 적용", "QueryDSL 동적 쿼리", "커넥션 풀 튜닝", "REST API 설계", "예외 처리 전략", "Stream API 활용",
          "멀티스레드 동시성", "JWT 인증 흐름", "로그 남기는 법", "페이징 구현"]
TOPIC_TAGS = {"JPA": ["jpa", "spring"], "스프링": ["spring", "java"], "MySQL": ["mysql", "성능"], "Docker": ["docker"],
              "테스트": ["테스트", "java"], "Redis": ["성능", "spring"], "QueryDSL": ["jpa"], "커넥션": ["mysql", "성능"],
              "REST": ["spring"], "예외": ["java", "spring"], "Stream": ["java"], "멀티스레드": ["java", "성능"],
              "JWT": ["보안", "spring"], "로그": ["spring"], "페이징": ["jpa", "mysql"]}
DEV_SUFFIX = ["정리", "삽질기", "실전 적용 후기", "한 번에 이해하기", "초보 가이드", "비교해보기"]
QNA_FORM = ["{} 질문드립니다", "{} 에러가 나요", "{} 이렇게 하는 게 맞나요?"]
FREE_TITLES = ["오늘 회고", "이직 준비 근황", "스터디원 구합니다", "주말에 만든 사이드 프로젝트", "개발 책 추천해주세요",
               "재택 vs 출근", "첫 코드리뷰 받은 날", "번아웃 극복기", "좋은 키보드 추천", "컨퍼런스 다녀왔어요"]
FREE_TAGS = ["일상", "회고", "취업"]
NOTICES = ["[공지] 커뮤니티 이용 규칙 안내", "[공지] 10월 서버 점검 일정", "[공지] 신고 기능이 추가되었습니다",
           "[공지] 개인정보 처리방침 변경 안내", "[공지] 이달의 좋은 글 선정 기준"]
SENT = ["처음에는 원인을 몰라서 한참 헤맸습니다.", "공식 문서를 다시 읽어 보니 설정 하나가 빠져 있었어요.",
        "로그를 찍어 보니 쿼리가 생각보다 많이 나가고 있었습니다.", "같은 문제를 겪는 분께 도움이 되면 좋겠습니다.",
        "예제 코드는 최대한 단순하게 줄였습니다.", "운영 환경에서는 조금 다르게 동작할 수 있으니 주의하세요.",
        "댓글로 더 좋은 방법을 알려주시면 감사하겠습니다.", "테스트를 먼저 작성하고 나니 리팩토링이 쉬워졌어요.",
        "결론부터 말하면 설계를 바꾸는 게 맞았습니다.", "팀원들과 리뷰하면서 정리한 내용입니다."]

posts = []


def add_post(board, author, title, tags, created, **kw):
    p = dict(id=None, board=board, author=author, title=title, tags=tags, created_at=created,
             published_at=created + dt.timedelta(minutes=R.randrange(1, 90)), status="PUBLISHED", visibility="PUBLIC",
             deleted_at=None, hidden_at=None, followers_from=None, content=" ".join(R.sample(SENT, R.randint(2, 5))))
    p.update(kw)
    posts.append(p)
    return p


for i, t in enumerate(NOTICES):
    add_post(1, 1, t, [], START + dt.timedelta(days=i * 18, hours=10),
             content="안녕하세요, 운영자입니다. " + " ".join(R.sample(SENT, 2)))
for _ in range(140):
    author = R.choice(WRITERS + [2, 3, 4, 5] * 3)  # 2~5번은 글을 많이 쓴다
    end = M[author]["active_until"] - dt.timedelta(days=1)
    created = rand_time(max(START, M[author]["created_at"]), end)
    board = R.choices([2, 3, 4], weights=[5, 3, 2])[0]
    if board == 4:
        add_post(4, author, R.choice(FREE_TITLES), R.sample(FREE_TAGS, R.randint(0, 2)), created)
    else:
        topic = R.choice(TOPICS)
        key = next(k for k in TOPIC_TAGS if k in topic)
        title = f"{topic} {R.choice(DEV_SUFFIX)}" if board == 2 else R.choice(QNA_FORM).format(topic)
        add_post(board, author, title, R.sample(TOPIC_TAGS[key], R.randint(1, len(TOPIC_TAGS[key]))), created)

posts.sort(key=lambda p: p["created_at"])
for i, p in enumerate(posts, 1):
    p["id"] = i
PS = {p["id"]: p for p in posts}
normal = [p for p in posts if p["board"] != 1 and p["author"] not in (28, 29)]
# 상태 함정 — 개수와 대상을 고정해 두고 practice/MISSIONS.md에 적는다
for p in R.sample(normal[:-10], 7):              # 임시저장: 작성자만 보인다
    p.update(status="DRAFT", published_at=None)
pub = [p for p in normal if p["status"] == "PUBLISHED"]
for p in R.sample(pub[:-15], 4):                 # 운영자 숨김: 좋아요가 달린 뒤 숨겨짐
    p["hidden_at"] = rand_time(p["published_at"] + dt.timedelta(days=3), BASE - dt.timedelta(days=1))
for p in R.sample([x for x in pub[:-15] if not x["hidden_at"]], 6):   # 작성자 삭제(soft delete)
    p["deleted_at"] = rand_time(p["published_at"] + dt.timedelta(days=2), BASE - dt.timedelta(days=1))
plain = [x for x in pub if not x["hidden_at"] and not x["deleted_at"]]
for p in R.sample(plain, 15):                    # 처음부터 팔로워 공개
    p["visibility"] = "FOLLOWERS"
    p["followers_from"] = p["published_at"]
for p in R.sample([x for x in plain[:-20] if x["visibility"] == "PUBLIC"], 2):  # 나중에 팔로워 공개로 바뀜
    p["visibility"] = "FOLLOWERS"
    p["followers_from"] = rand_time(p["published_at"] + dt.timedelta(days=5), BASE - dt.timedelta(days=2))
for p in posts:
    if p["hidden_at"]:
        p["status"] = "HIDDEN"
# 본문 함정: 아주 긴 글, 이모지
long_post = R.choice([x for x in plain if x["board"] == 2])
long_post["content"] = ("긴 글 테스트 — 목록 API에 본문 전체를 실으면 응답이 무거워진다. " + " ".join(SENT)) * 25
emoji_post = R.choice([x for x in plain if x["board"] == 4 and x is not long_post])
emoji_post["content"] = "드디어 첫 배포 성공했어요 🎉🔥 다들 고마워요 🙏 " + emoji_post["content"]


def end_of_life(p):
    """이 글에 새 반응(좋아요·댓글·북마크)이 달릴 수 있는 마지막 시각."""
    return min(x for x in [p["deleted_at"], p["hidden_at"], BASE] if x)


def can_react(v, p, when):
    """그 시각에 회원 v가 글 p를 보고 반응할 수 있었나 — 반응 데이터 생성 규칙."""
    if p["status"] == "DRAFT" or v == p["author"] or blocked(v, p["author"]):
        return False
    if not (M[v]["created_at"] <= when < M[v]["active_until"]):
        return False
    if p["followers_from"] and when >= p["followers_from"]:
        return follows_at(v, p["author"], when)
    return True


# ---------------------------------------------------------------- 좋아요
likes = []
for p in posts:
    if p["status"] == "DRAFT":
        continue
    target = min(22, int(R.paretovariate(1.2) * 1.5))
    if p["board"] == 1:
        target = R.randint(3, 8)
    tries = 0
    taken = set()
    while len(taken) < target and tries < 200:
        tries += 1
        v = R.choice(ACTORS)
        when = early_time(p["published_at"], end_of_life(p))
        if v in taken or not can_react(v, p, when):
            continue
        taken.add(v)
        likes.append(dict(post=p["id"], member=v, created_at=when))
# 인기글 함정: 최근 7일에 좋아요가 몰린 글 2개 vs 예전에 좋아요가 많았던 글 1개
recent = [p for p in plain if p["visibility"] == "PUBLIC" and p["published_at"] >= BASE - dt.timedelta(days=6)]
for p in R.sample(recent, 2) + [next(x for x in plain if x["visibility"] == "PUBLIC" and x["board"] == 2)]:
    have = {lk["member"] for lk in likes if lk["post"] == p["id"]}
    for v in ACTORS:
        if len(have) >= 20:
            break
        when = early_time(p["published_at"], end_of_life(p))
        if v not in have and can_react(v, p, when):
            have.add(v)
            likes.append(dict(post=p["id"], member=v, created_at=when))
likes.sort(key=lambda x: x["created_at"])
for i, lk in enumerate(likes, 1):
    lk["id"] = i

# ---------------------------------------------------------------- 댓글
CMTS = ["좋은 글 감사합니다!", "저도 같은 문제 겪었어요", "혹시 버전이 어떻게 되나요?", "이 부분은 조금 다르게 생각해요",
        "정리 깔끔하네요 👍", "북마크해두고 다시 볼게요", "답변 감사합니다. 해결됐어요!", "예제 코드도 볼 수 있을까요?",
        "공식 문서 링크 공유합니다", "오타가 있는 것 같아요", "저는 설정을 바꿔서 해결했어요", "다음 편도 기대할게요"]
comments = []
for p in posts:
    if p["status"] == "DRAFT":
        continue
    n = R.choices(range(0, 9), weights=[14, 12, 10, 9, 7, 5, 4, 3, 2])[0]
    tops = []
    for _ in range(n):
        reply_to = R.choice(tops) if tops and R.random() < 0.3 else None
        lo = reply_to["created_at"] if reply_to else p["published_at"]
        when = early_time(lo, end_of_life(p))
        # 작성자 본인도 댓글·답글을 단다
        v = p["author"] if R.random() < 0.15 and M[p["author"]]["created_at"] <= when < M[p["author"]]["active_until"] else R.choice(ACTORS)
        if v != p["author"] and not can_react(v, p, when):
            continue
        c = dict(post=p["id"], member=v, parent=reply_to, content=R.choice(CMTS), created_at=when, deleted_at=None)
        if R.random() < 0.06:
            c["deleted_at"] = rand_time(when + dt.timedelta(hours=1), BASE)
        comments.append(c)
        if reply_to is None:
            tops.append(c)
# 함정: 삭제된 댓글 밑에 살아 있는 답글
parent_with_replies = next(c for c in comments if c["parent"] is None and any(x["parent"] is c for x in comments))
parent_with_replies["deleted_at"] = rand_time(parent_with_replies["created_at"] + dt.timedelta(hours=2), BASE)
for x in comments:                               # 답글은 부모보다 늦게 지워졌거나 살아 있다
    if x["parent"] is parent_with_replies:
        x["deleted_at"] = None
comments.sort(key=lambda c: c["created_at"])
for i, c in enumerate(comments, 1):
    c["id"] = i

# ---------------------------------------------------------------- 북마크 폴더·북마크
FOLDER_NAMES = ["스프링 공부", "나중에 읽기", "면접 대비", "DB 정리", "좋은 글 모음", "질문 모음", "회고 참고", "성능 튜닝",
                "보안", "사이드 프로젝트"]
folders = []
for mid in range(2, 13):
    names = FOLDER_NAMES[:] if mid == 6 else R.sample(FOLDER_NAMES, R.randint(1, 3))   # 6번은 폴더 10개 — 한도 꽉 참
    for nm in names:
        at = rand_time(max(START, M[mid]["created_at"]), dt.datetime(2026, 8, 1))
        folders.append(dict(member=mid, name=nm, created_at=at))
folders.sort(key=lambda f: f["created_at"])
for i, f in enumerate(folders, 1):
    f["id"] = i
liked_by = {}
for lk in likes:
    liked_by.setdefault(lk["member"], []).append(lk)
MEMOS = ["다시 읽기", "면접 전에 볼 것", "회사 코드에 적용해 보기", "예제 따라 해 보기", None]
bookmarks = []
for mid in ACTORS:
    want = R.randint(0, 18)
    mine = [f for f in folders if f["member"] == mid]
    picked = set()
    tries = 0
    while len(picked) < want and tries < 300:
        tries += 1
        own_likes = liked_by.get(mid, [])
        if own_likes and R.random() < 0.45:
            lk = R.choice(own_likes)
            p, lo = PS[lk["post"]], lk["created_at"]
        else:
            p = R.choice(posts)
            lo = p["published_at"] or BASE
        if p["id"] in picked or p["status"] == "DRAFT":
            continue
        when = early_time(lo, end_of_life(p))
        if not can_react(mid, p, when):
            continue
        picked.add(p["id"])
        f = R.choice(mine) if mine and R.random() < 0.6 else None
        if f and f["created_at"] > when:
            f = None
        bookmarks.append(dict(member=mid, post=p["id"], folder=f["id"] if f else None,
                              memo=R.choice(MEMOS) if R.random() < 0.25 else None, created_at=when))
bookmarks.sort(key=lambda b: b["created_at"])
for i, b in enumerate(bookmarks, 1):
    b["id"] = i

# ---------------------------------------------------------------- 비정규화 카운트(+ 일부러 어긋난 글)
like_cnt, cmt_cnt = {}, {}
for lk in likes:
    like_cnt[lk["post"]] = like_cnt.get(lk["post"], 0) + 1
for c in comments:
    if not c["deleted_at"]:
        cmt_cnt[c["post"]] = cmt_cnt.get(c["post"], 0) + 1
for p in posts:
    p["like_count"] = like_cnt.get(p["id"], 0)
    p["comment_count"] = cmt_cnt.get(p["id"], 0)
    p["view_count"] = 0 if p["status"] == "DRAFT" else p["like_count"] * R.randint(4, 9) + p["comment_count"] * 3 + R.randint(5, 60)
drift_like = R.sample([p for p in plain if p["like_count"] >= 3], 3)
for p, d in zip(drift_like, [2, -1, 5]):
    p["like_count"] += d
drift_cmt = R.sample([p for p in plain if p["comment_count"] >= 2 and p not in drift_like], 2)
for p, d in zip(drift_cmt, [1, -2]):
    p["comment_count"] += d
for p in posts:
    events = [p["published_at"] or p["created_at"], p["deleted_at"], p["hidden_at"], p["followers_from"] if p["followers_from"] != p["published_at"] else None]
    p["updated_at"] = max(x for x in events if x)


# ---------------------------------------------------------------- SQL 출력
def q(v):
    if v is None:
        return "NULL"
    if isinstance(v, (int,)):
        return str(v)
    if isinstance(v, dt.datetime):
        return f"'{v:%Y-%m-%d %H:%M:%S}'"
    return "'" + str(v).replace("\\", "\\\\").replace("'", "''") + "'"


def insert(table, cols, rows, chunk=200):
    out = []
    for i in range(0, len(rows), chunk):
        vals = ",\n".join("(" + ", ".join(q(v) for v in r) + ")" for r in rows[i:i + chunk])
        out.append(f"INSERT INTO {table} ({', '.join(cols)}) VALUES\n{vals};")
    return "\n".join(out)


sql = ["-- 자동 생성 파일 — 직접 고치지 말고 docker/mysql/gen_practice_seed.py 를 고쳐서 다시 만든다.",
       f"-- 기준 시각 {BASE:%Y-%m-%d %H:%M}. 회원 {len(members)} · 글 {len(posts)} · 댓글 {len(comments)} · 좋아요 {len(likes)} · "
       f"북마크 {len(bookmarks)} · 폴더 {len(folders)} · 팔로우 {len(follows)} · 차단 {len(BLOCKS)}",
       "SET NAMES utf8mb4;", ""]
sql.append(insert("member", ["id", "email", "nickname", "role", "member_status", "created_at", "updated_at", "deleted_at"],
                  [(m["id"], m["email"], m["nickname"], m["role"], m["status"], m["created_at"], m["updated_at"], m["deleted_at"]) for m in members]))
sql.append(insert("board", ["id", "slug", "name", "write_role", "sort_order", "created_at"],
                  [(*b, dt.datetime(2026, 5, 1)) for b in BOARDS]))
sql.append(insert("tag", ["id", "name", "created_at"], [(TAG_ID[t], t, dt.datetime(2026, 5, 1)) for t in TAGS]))
sql.append(insert("post", ["id", "board_id", "author_id", "title", "content", "status", "visibility", "view_count", "like_count",
                           "comment_count", "published_at", "created_at", "updated_at", "deleted_at"],
                  [(p["id"], p["board"], p["author"], p["title"], p["content"], p["status"], p["visibility"], p["view_count"],
                    p["like_count"], p["comment_count"], p["published_at"], p["created_at"], p["updated_at"], p["deleted_at"]) for p in posts]))
sql.append(insert("post_tag", ["post_id", "tag_id"], sorted({(p["id"], TAG_ID[t]) for p in posts for t in p["tags"]})))
sql.append(insert("comment", ["id", "post_id", "member_id", "parent_id", "content", "created_at", "updated_at", "deleted_at"],
                  [(c["id"], c["post"], c["member"], c["parent"]["id"] if c["parent"] else None, c["content"], c["created_at"],
                    c["deleted_at"] or c["created_at"], c["deleted_at"]) for c in comments]))
sql.append(insert("post_like", ["id", "post_id", "member_id", "created_at"], [(lk["id"], lk["post"], lk["member"], lk["created_at"]) for lk in likes]))
sql.append(insert("bookmark_folder", ["id", "member_id", "name", "created_at", "updated_at"],
                  [(f["id"], f["member"], f["name"], f["created_at"], f["created_at"]) for f in folders]))
sql.append(insert("bookmark", ["id", "member_id", "post_id", "folder_id", "memo", "created_at", "updated_at"],
                  [(b["id"], b["member"], b["post"], b["folder"], b["memo"], b["created_at"], b["created_at"]) for b in bookmarks]))
fl = sorted(follows.items(), key=lambda kv: kv[1])
sql.append(insert("follow", ["id", "follower_id", "followee_id", "created_at"], [(i, a, b, t) for i, ((a, b), t) in enumerate(fl, 1)]))
sql.append(insert("member_block", ["id", "blocker_id", "blocked_id", "created_at"],
                  [(i, a, b, t) for i, ((a, b), t) in enumerate(sorted(BLOCKS.items(), key=lambda kv: kv[1]), 1)]))
OUT.write_text("\n\n".join(sql) + "\n")
print(f"wrote {OUT.name}: members={len(members)} posts={len(posts)} comments={len(comments)} likes={len(likes)} "
      f"bookmarks={len(bookmarks)} folders={len(folders)} follows={len(follows)} blocks={len(BLOCKS)}")

if "--oracle" in sys.argv:
    print("drift like_count posts:", [p["id"] for p in drift_like], "drift comment_count posts:", [p["id"] for p in drift_cmt])
    print("draft:", [p["id"] for p in posts if p["status"] == "DRAFT"], "hidden:", [p["id"] for p in posts if p["status"] == "HIDDEN"],
          "deleted:", [p["id"] for p in posts if p["deleted_at"]], "followers->later:",
          [p["id"] for p in posts if p["followers_from"] and p["followers_from"] != p["published_at"]])
    print("long post:", long_post["id"], "emoji post:", emoji_post["id"], "deleted parent comment:", parent_with_replies["id"])
