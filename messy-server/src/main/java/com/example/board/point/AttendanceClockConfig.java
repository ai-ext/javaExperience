package com.example.board.point;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** 출석처럼 "지금"이 결과를 바꾸는 코드는 Clock을 주입받는다. 테스트가 시각을 고정할 수 있다. */
@Configuration(proxyBeanMethods = false)
public class AttendanceClockConfig {

    // 서버·DB·로그 시각은 UTC 기준이다(운영 컨테이너 기본 시간대와 같게)
    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
