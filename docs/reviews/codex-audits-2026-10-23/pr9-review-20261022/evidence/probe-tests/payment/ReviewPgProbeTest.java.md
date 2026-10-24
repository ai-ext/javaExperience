# 이전 PR 검토 실행 근거

대상 HEAD: `c9786af3b97c48ec118cade5777bc015fe282a88`. 현재 HEAD 재검증 결과가 아니다.

원본: `$USER_HOME/research/javaexperience-pr9-review-20261022/_data/probe-tests/payment/ReviewPgProbeTest.java`

````java
package com.example.board.payment;

import com.example.board.member.Member;
import com.example.board.member.Role;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import java.util.concurrent.atomic.AtomicInteger;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/** 외부 PG만 대역으로 바꾸고 실제 재시도·충전·콜백·DB를 관찰한다. */
class ReviewPgProbeTest extends PgApiTestSupport {
    @MockitoBean PgClient pgClient;
    @Test void ambiguousFirstAttemptIsLostAndLaterDoneCannotRecover() throws Exception {
        AtomicInteger attempts=new AtomicInteger();
        when(pgClient.approve(anyString(),anyInt(),anyString())).thenAnswer(inv->new PgRetryPolicy().execute(()->{
            var kind=attempts.incrementAndGet()==1?PgException.Kind.SERVER_ERROR:PgException.Kind.UNREACHABLE;
            throw new PgException(kind,"감사 실패 주입",null);
        }));
        Member m=newMember(Role.USER);String key=newKey();
        var response=charge(m,key,1000).andReturn();
        String id=orderId(key);String before=paymentStatus(key);
        var cb=signedCallback(callbackBody(id,"DONE",1000)).andReturn();
        System.out.println("AUDIT ambiguousRetry attempts="+attempts+" chargeStatus="+response.getResponse().getStatus()+" before="+before+" callbackStatus="+cb.getResponse().getStatus()+" after="+paymentStatus(key)+" balance="+balance(m)+" ledger="+chargeLedgers(m));
        assertThat(attempts.get()).isEqualTo(3);assertThat(before).isEqualTo("FAILED");
        assertThat(cb.getResponse().getStatus()).isEqualTo(200);assertThat(paymentStatus(key)).isEqualTo("FAILED");
        assertThat(balance(m)).isZero();assertThat(chargeLedgers(m)).isZero();
    }
}

````
