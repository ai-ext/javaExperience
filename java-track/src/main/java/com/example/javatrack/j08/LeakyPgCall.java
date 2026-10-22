package com.example.javatrack.j08;

import java.io.IOException;
import java.util.function.Supplier;

/**
 * 주어진 함정 코드: 고치지 않는다. {@link PgCall}과 비교하려고 둔다.
 * 두 메서드 모두 컴파일은 되지만, 장애가 났을 때 무엇이 왜 실패했는지를 숨긴다.
 */
public final class LeakyPgCall {

    private LeakyPgCall() {
    }

    /** 빈 catch: 실패를 삼키고 null을 돌려준다. 호출한 쪽은 실패했는지조차 모른다. */
    public static String sendSwallowing(Supplier<PgChannel> opener, String body) {
        try (PgChannel channel = opener.get()) {
            return channel.send(body);
        } catch (IOException e) {
            // 아무것도 하지 않는다
        }
        return null;
    }

    /** 원인 없이 새 예외: 실패는 알리지만 원래 IOException(어디서, 왜)이 사라진다. */
    public static String sendWithoutCause(Supplier<PgChannel> opener, String body) {
        try (PgChannel channel = opener.get()) {
            return channel.send(body);
        } catch (IOException e) {
            throw new PgUnreachableException("PG 호출 실패");
        }
    }
}
