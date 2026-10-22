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
#   1) 기획 요청대로 NotificationChannel에 KAKAO(카카오 알림톡)를 하나 더하고, 일회용 테스트로 글 작성·댓글 작성·
#      (댓글 달린) 글 삭제 API를 차례로 부른다.
#   2) PostServiceImpl의 @Lazy 한 줄을 지우고 기동 테스트(BoardApplicationTests)를 돌린다.
# 기대 증상(결함 상태)
#   1) "응답 코드: 글 작성=500 댓글 작성=500 글 삭제=500". 로그의 원인: IllegalStateException: 알 수 없는 알림 채널: KAKAO (3회)
#      → 채널 분기가 글 작성·글 삭제·댓글 알림 세 군데에 복사돼 있다.
#   2) 컨텍스트가 뜨지 않는다: "The dependencies of some of the beans in the application context form a cycle"
#      (postServiceImpl ↔ commentService). @Lazy가 순환을 가리고 있었다.
# 수정 뒤: 1) 채널 하나를 더해도 고칠 곳이 한 곳(새 채널 구현 + 종류별 채널 표)이고, 2) @Lazy 없이 기동된다.
set -euo pipefail

src=$(cd "$(dirname "$0")/../.." && pwd -P)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
rsync -a --exclude build --exclude .gradle --exclude tickets "$src/" "$work/"
cd "$work"

xml_failures() {
  python3 - "$1" <<'PY'
import sys, glob, xml.etree.ElementTree as ET
for p in sorted(glob.glob("build/test-results/test/*.xml")):
    r = ET.parse(p).getroot()
    for c in r.findall("testcase"):
        bad = c.find("failure") if c.find("failure") is not None else c.find("error")
        if bad is None:
            continue
        text = (bad.get("message") or "") + (bad.text or "")
        i = text.find(sys.argv[1])
        hit = text[max(0, i - 80):i + 80].replace("\n", " ") if i >= 0 else ""
        print(f"  실패: {c.get('classname').split('.')[-1]}.{c.get('name')}  ...{hit}...")
PY
}

echo "== 1) 알림 채널 KAKAO 추가 후 글 작성·댓글 작성·글 삭제"
sed -i.bak 's/IN_APP, PUSH, EMAIL/IN_APP, PUSH, EMAIL, KAKAO/' src/main/java/com/example/board/notification/NotificationChannel.java
grep -n "KAKAO" src/main/java/com/example/board/notification/NotificationChannel.java
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
./gradlew --console=plain -q test --tests '*B04ReproTest*' >/dev/null 2>&1 || true
xml_failures "응답 코드"
grep -ho "알 수 없는 알림 채널: KAKAO" build/test-results/test/*B04ReproTest*.xml | sort | uniq -c || true
rm src/test/java/com/example/board/B04ReproTest.java
mv src/main/java/com/example/board/notification/NotificationChannel.java.bak \
  src/main/java/com/example/board/notification/NotificationChannel.java

echo "== 2) PostServiceImpl의 @Lazy 지우기"
sed -i.bak '/^    @Lazy$/d' src/main/java/com/example/board/post/PostServiceImpl.java
rm -rf build/test-results
./gradlew --console=plain -q test --tests '*BoardApplicationTests*' >/dev/null 2>&1 || true
xml_failures "circular reference"
