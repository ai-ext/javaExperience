package com.example.board.common;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Component
public class ForbiddenWordLoader {

    private static final Logger log = LoggerFactory.getLogger(ForbiddenWordLoader.class);

    private final JdbcClient jdbc;
    private final ForbiddenWordChecker checker;
    private final CommonCodeRegistry registry;

    public ForbiddenWordLoader(JdbcClient jdbc, ForbiddenWordChecker checker, CommonCodeRegistry registry) {
        this.jdbc = jdbc;
        this.checker = checker;
        this.registry = registry;
    }

    // @PostConstruct는 빈 하나의 초기화 시점이라 다른 빈·프록시가 덜 준비됐을 수 있다. 준비가 끝난 뒤 적재한다.
    @EventListener(ApplicationReadyEvent.class)
    void onReady() {
        load();
    }

    public void load() {
        List<String> words = jdbc.sql("SELECT word FROM banned_word").query(String.class).list();
        Map<String, String> codes = new HashMap<>();
        jdbc.sql("SELECT group_code, code, name FROM common_code")
                .query((rs, i) -> {
                    codes.put(CommonCodeRegistry.key(rs.getString("group_code"), rs.getString("code")),
                            rs.getString("name"));
                    return null;
                }).list();

        checker.replaceWords(words);
        registry.replace(codes);
        log.info("금칙어 {}건, 공통코드 {}건 적재", checker.size(), registry.size());
    }
}
