package com.example.javatrack.j10;

import java.util.ArrayList;
import java.util.List;

/** 주어진 기록 저장소: 고치지 않는다. 프록시가 {@link #add}로 남기고, 테스트가 읽는다. */
public class TimingLog {

    private final List<Timing> entries = new ArrayList<>();

    public void add(Timing timing) {
        entries.add(timing);
    }

    public List<Timing> entries() {
        return List.copyOf(entries);
    }

    /** 기록된 메서드 이름을 기록된 순서대로. */
    public List<String> methodNames() {
        return entries.stream().map(Timing::methodName).toList();
    }
}
