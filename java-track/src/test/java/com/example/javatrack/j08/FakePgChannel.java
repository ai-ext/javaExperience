package com.example.javatrack.j08;

import java.io.IOException;

/** 테스트용 가짜 채널. 보내기·닫기가 어떻게 끝날지 정해 두고, 닫혔는지 기록한다. */
class FakePgChannel implements PgChannel {

    private final String response;
    private final IOException sendFailure;
    private final RuntimeException closeFailure;
    private boolean closed;

    private FakePgChannel(String response, IOException sendFailure, RuntimeException closeFailure) {
        this.response = response;
        this.sendFailure = sendFailure;
        this.closeFailure = closeFailure;
    }

    static FakePgChannel responding(String response) {
        return new FakePgChannel(response, null, null);
    }

    static FakePgChannel failing(IOException sendFailure) {
        return new FakePgChannel(null, sendFailure, null);
    }

    static FakePgChannel failingTwice(IOException sendFailure, RuntimeException closeFailure) {
        return new FakePgChannel(null, sendFailure, closeFailure);
    }

    @Override
    public String send(String body) throws IOException {
        if (sendFailure != null) {
            throw sendFailure;
        }
        return response;
    }

    @Override
    public void close() {
        closed = true;
        if (closeFailure != null) {
            throw closeFailure;
        }
    }

    boolean isClosed() {
        return closed;
    }
}
