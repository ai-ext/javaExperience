#!/usr/bin/env bash
# B04 재현: 알림 채널 하나 추가하는데 세 군데가 깨진다.
#
# 전제
#   1) Docker 실행 중(테스트가 Testcontainers로 MySQL·Redis를 띄운다). compose·bootRun은 필요 없다.
#   2) JDK 21 (JAVA_HOME). 처음 실행이면 Gradle 의존성 내려받기로 몇 분 걸린다.
#
# 실행: bash tickets/B04/repro.sh
#
# 하는 일: messy-server를 임시 디렉터리에 복사해 두 가지를 해 본다(원본은 건드리지 않는다).
#   1) 기획 요청대로 NotificationChannel에 KAKAO(카카오 알림톡)를 하나 더하고, 일회용 테스트(B04ReproTest)로
#      글 작성·댓글 작성·(댓글 달린) 글 삭제 API를 차례로 부른다.
#   2) PostServiceImpl에서 기동을 살리려고 붙여 둔 어노테이션 한 줄을 지우고 기동 테스트(BoardApplicationTests)를 돌린다.
# 기대 증상(고치기 전)
#   1) "응답 코드: 글 작성=500 댓글 작성=500 글 삭제=500"과 로그의 예외 메시지(같은 예외가 세 번)
#   2) 기동 테스트가 컨텍스트를 만들지 못해 실패한다. 출력되는 오류 메시지를 읽어 본다.
# 종료 코드: 0 = 두 증상 모두 재현, 1 = 하나 이상 재현되지 않음(이미 고쳤다면 정상),
#            2 = 환경·컴파일 오류(JDK·Docker·Gradle). 오류 때는 Gradle 로그 끝부분을 보여 준다.
set -euo pipefail

src=$(cd "$(dirname "$0")/../.." && pwd -P)
work=$(mktemp -d)
logs=$(mktemp -d)
trap 'rm -rf "$work" "$logs"' EXIT
rsync -a --exclude build --exclude .gradle --exclude tickets "$src/" "$work/"
cd "$work"

# 테스트 결과 XML을 읽어 한 줄로 판정한다.
#   check <테스트 클래스> <재현으로 볼 메시지 조각...>
#   출력: REPRODUCED <줄> | PASSED | ERROR <줄>
check() {
  python3 - "$@" <<'PY'
import sys, glob, xml.etree.ElementTree as ET
cls, needles = sys.argv[1], sys.argv[2:]
files = sorted(glob.glob(f"build/test-results/test/TEST-*{cls}.xml"))
if not files:
    print("ERROR 테스트 결과가 없다(컴파일·Gradle 오류)"); sys.exit()
tests, hits, others = 0, [], []
for p in files:
    r = ET.parse(p).getroot()
    tests += int(r.get("tests", 0))
    out = (r.findtext("system-out") or "") + (r.findtext("system-err") or "")
    for c in r.findall("testcase"):
        bad = c.find("failure") if c.find("failure") is not None else c.find("error")
        if bad is None:
            continue
        text = (bad.get("message") or "") + (bad.text or "") + out
        found = [n for n in needles if n in text]
        if found:
            i = text.find(found[0])
            hits.append(text[max(0, i - 60):i + 120].replace("\n", " "))
        else:
            others.append(f"{c.get('name')}: {(bad.get('message') or '')[:200]}")
if tests == 0:
    print("ERROR 테스트가 하나도 돌지 않았다")
elif others:
    print("ERROR 예상과 다른 실패 — " + " / ".join(others))
elif hits:
    print("REPRODUCED ..." + hits[0] + "...")
else:
    print("PASSED")
PY
}

# 테스트 실패는 기대한 결과일 수 있어 Gradle 종료 코드로 판정하지 않는다. 로그를 남기고 XML로 판정한다
# (XML이 없거나 예상과 다른 실패면 check가 ERROR를 낸다).
run_gradle() {
  local log=$1; shift
  rm -rf build/test-results
  ./gradlew --console=plain test "$@" >"$log" 2>&1 || true
}

report() {
  local label=$1 log=$2 verdict=$3
  case "$verdict" in
    REPRODUCED*) echo "  재현됨: ${verdict#REPRODUCED }" ;;
    PASSED) echo "  재현되지 않음: $label 테스트가 통과했다"; status=1 ;;
    *)
      echo "  환경·컴파일 오류: ${verdict#ERROR }" >&2
      local kept="${TMPDIR:-/tmp}/b04-repro-$(basename "$log")"
      cp "$log" "$kept"
      echo "  --- Gradle 로그 끝 (전체: $kept) ---" >&2
      tail -n 30 "$log" >&2
      exit 2 ;;
  esac
}

status=0

echo "== 1) 알림 채널 KAKAO 추가 후 글 작성·댓글 작성·글 삭제"
channel=src/main/java/com/example/board/notification/NotificationChannel.java
sed -i.bak 's/IN_APP, PUSH, EMAIL/IN_APP, PUSH, EMAIL, KAKAO/' "$channel"
if ! grep -q "KAKAO" "$channel"; then
  echo "  NotificationChannel에 KAKAO를 넣지 못했다(enum 모양이 바뀌었다). 직접 더해 보고 세 API를 불러 본다." >&2
  exit 2
fi
# 세 API를 차례로 부르고 응답 코드를 한 줄로 남기는 일회용 테스트(임시 복사본에만 만든다)
cat > src/test/java/com/example/board/B04ReproTest.java <<'JAVA'
package com.example.board;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

class B04ReproTest extends ApiTestSupport {

    @Test
    void 글_작성_댓글_작성_글_삭제() throws Exception {
        Member author = newMember(Role.USER);
        Member other = newMember(Role.USER);
        int create = mockMvc.perform(post("/api/posts").header("Authorization", bearer(author))
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"t\",\"content\":\"c\",\"tags\":[]}"))
                .andReturn().getResponse().getStatus();
        Long postId = newPost(author);
        int comment = mockMvc.perform(post("/api/posts/{id}/comments", postId).header("Authorization", bearer(other))
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"댓글\"}"))
                .andReturn().getResponse().getStatus();
        jdbc.update("INSERT INTO comment (post_id, member_id, content, deleted, created_at, updated_at)"
                + " VALUES (?, ?, '댓글', FALSE, NOW(6), NOW(6))", postId, other.getId());
        int remove = mockMvc.perform(delete("/api/posts/{id}", postId).header("Authorization", bearer(author)))
                .andReturn().getResponse().getStatus();
        String line = "응답 코드: 글 작성=" + create + " 댓글 작성=" + comment + " 글 삭제=" + remove;
        System.out.println(line);
        assertThat(create).as(line).isEqualTo(201);
        assertThat(comment).as(line).isEqualTo(201);
        assertThat(remove).as(line).isEqualTo(204);
    }
}
JAVA
run_gradle "$logs/kakao.log" --tests '*B04ReproTest*'
report "B04ReproTest" "$logs/kakao.log" "$(check B04ReproTest "응답 코드")"
count=$( (grep -o "알 수 없는 알림 채널: KAKAO" build/test-results/test/TEST-*B04ReproTest.xml || true) | wc -l | tr -d ' ')
if [ "$count" -gt 0 ]; then
  echo "  로그의 예외: \"알 수 없는 알림 채널: KAKAO\" ${count}회"
fi
rm src/test/java/com/example/board/B04ReproTest.java
mv "$channel.bak" "$channel"

echo "== 2) PostServiceImpl의 @Lazy 지우기"
sed -i.bak '/^    @Lazy$/d' src/main/java/com/example/board/post/PostServiceImpl.java
run_gradle "$logs/boot.log" --tests '*BoardApplicationTests*'
report "BoardApplicationTests" "$logs/boot.log" \
  "$(check BoardApplicationTests "form a cycle" "circular reference" "Requested bean is currently in creation")"

exit $status
