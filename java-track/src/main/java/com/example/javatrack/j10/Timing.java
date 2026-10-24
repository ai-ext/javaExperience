package com.example.javatrack.j10;

import java.time.Duration;

/** 주어진 record: 고치지 않는다. 기록 한 줄: 어떤 메서드가 얼마나 걸렸나. */
public record Timing(String methodName, Duration elapsed) {
}
