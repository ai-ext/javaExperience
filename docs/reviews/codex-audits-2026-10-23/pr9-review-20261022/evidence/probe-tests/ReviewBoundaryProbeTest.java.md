# 이전 PR 검토 실행 근거

대상 HEAD: `c9786af3b97c48ec118cade5777bc015fe282a88`. 현재 HEAD 재검증 결과가 아니다.

원본: `$USER_HOME/research/javaexperience-pr9-review-20261022/_data/probe-tests/ReviewBoundaryProbeTest.java`

````java
package com.example.board;

import com.example.board.member.Member;
import com.example.board.member.Role;
import com.example.board.post.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.UUID;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/** 버그 관찰용이다. 이 테스트의 통과는 제품의 정상 동작을 뜻하지 않는다. */
class ReviewBoundaryProbeTest extends ApiTestSupport {
    @Autowired PostRepository posts;
    @Autowired PostService postService;
    @Autowired PostLikeService likes;
    @Autowired TransactionTemplate tx;

    @Test void caseVariantsOfSameTagCauseServerError() throws Exception {
        Member m=newMember(Role.USER);
        String name="t"+UUID.randomUUID().toString().substring(0,8);
        var result=mockMvc.perform(post("/api/posts").header("Authorization",bearer(m))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"태그 비교\",\"content\":\"내용\",\"tags\":[\""+name+"\",\""+name.toUpperCase()+"\"]}")).andReturn();
        System.out.println("AUDIT tagCase status="+result.getResponse().getStatus()+" body="+result.getResponse().getContentAsString());
        assertThat(result.getResponse().getStatus()).isEqualTo(500);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM post WHERE member_id=?",Integer.class,m.getId())).isZero();
    }

    @Test void allowedCharacterLengthExceedsBcryptByteLimit() throws Exception {
        String password="a1"+"가".repeat(24);
        String email=UUID.randomUUID()+"@t.com";
        var result=mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\""+email+"\",\"password\":\""+password+"\",\"nickname\":\"길이테스트\"}")).andReturn();
        System.out.println("AUDIT password chars="+password.length()+" bytes="+password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length+" status="+result.getResponse().getStatus()+" body="+result.getResponse().getContentAsString());
        assertThat(result.getResponse().getStatus()).isEqualTo(500);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM member WHERE email=?",Integer.class,email)).isZero();
    }

    // 실제 서비스의 findOwned 이후 patch/flush 구간을 같은 Entity/Repository로 멈춰 DB SQL을 확인한다.
    void interleave(boolean delete) throws Exception {
        Member owner=newMember(Role.USER), reader=newMember(Role.USER);Long id=newPost(owner);
        CountDownLatch read=new CountDownLatch(1), resume=new CountDownLatch(1);
        ExecutorService executor=Executors.newSingleThreadExecutor();
        try {
            Future<?> first=executor.submit(()->tx.executeWithoutResult(s->{
                Post p=posts.findActiveDetail(id).orElseThrow();read.countDown();
                try {if(!resume.await(10,TimeUnit.SECONDS))throw new AssertionError("barrier timeout");}
                catch(InterruptedException e){throw new RuntimeException(e);}
                p.patch("동시 수정",null);posts.flush();
            }));
            assertThat(read.await(10,TimeUnit.SECONDS)).isTrue();
            if(delete)postService.delete(id,owner.getId());else likes.like(id,reader.getId());
            resume.countDown();first.get(20,TimeUnit.SECONDS);
            var row=jdbc.queryForMap("SELECT status,like_count FROM post WHERE id=?",id);
            int relations=jdbc.queryForObject("SELECT COUNT(*) FROM post_like WHERE post_id=?",Integer.class,id);
            System.out.println("AUDIT staleWrite delete="+delete+" row="+row+" relations="+relations);
            if(delete)assertThat(row.get("status")).isEqualTo("ACTIVE");
            else {assertThat(((Number)row.get("like_count")).intValue()).isZero();assertThat(relations).isEqualTo(1);}
        } finally {resume.countDown();executor.shutdownNow();}
    }
    @Test void stalePostUpdateLosesCommittedLikeCount() throws Exception {interleave(false);}
    @Test void stalePostUpdateResurrectsDeletedPost() throws Exception {interleave(true);}
}

````
