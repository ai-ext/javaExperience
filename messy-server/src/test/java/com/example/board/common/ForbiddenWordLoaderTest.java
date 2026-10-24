package com.example.board.common;

import java.lang.reflect.Method;
import java.util.Optional;

import jakarta.annotation.PostConstruct;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.annotation.Import;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.annotation.DirtiesContext;

import com.example.board.TestcontainersConfig;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(OutputCaptureExtension.class)
@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class ForbiddenWordLoaderTest {

    @Autowired
    ForbiddenWordLoader loader;
    @Autowired
    ForbiddenWordChecker checker;
    @Autowired
    CommonCodeRegistry registry;
    @Autowired
    JdbcClient jdbc;

    @Test
    void 적재는_ApplicationReadyEvent_리스너에서_일어난다() throws Exception {
        Method m = loader.getClass().getDeclaredMethod("onReady");

        assertThat(m.getAnnotation(EventListener.class).value()).containsExactly(ApplicationReadyEvent.class);
        assertThat(m.isAnnotationPresent(PostConstruct.class)).isFalse();
    }

    @Test
    void 기동_로그는_Started_다음에_적재_건수가_나온다(CapturedOutput output) {
        String log = output.getAll();
        int started = log.indexOf("Started ");
        int loaded = log.indexOf("금칙어 ");

        assertThat(started).isNotNegative();
        assertThat(loaded).isGreaterThan(started);
        assertThat(log).containsPattern("금칙어 \\d+건, 공통코드 \\d+건 적재");
    }

    @Test
    void banned_word에_넣은_단어를_재적재하면_감지한다() {
        jdbc.sql("INSERT INTO banned_word (word) VALUES (:w)").param("w", "테스트금칙어").update();
        assertThat(checker.contains("테스트금칙어 포함")).isFalse();

        loader.load();

        assertThat(checker.contains("테스트금칙어 포함")).isTrue();
    }

    @Test
    void common_code를_이름으로_조회한다() {
        jdbc.sql("INSERT INTO common_code (group_code, code, name) VALUES ('REPORT_STATUS', 'OPEN', '접수')").update();

        loader.load();

        assertThat(registry.name("REPORT_STATUS", "OPEN")).isEqualTo(Optional.of("접수"));
        assertThat(registry.name("REPORT_STATUS", "NOPE")).isEmpty();
    }
}
