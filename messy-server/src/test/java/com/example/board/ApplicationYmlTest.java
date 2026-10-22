package com.example.board;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.Yaml;

import static org.assertj.core.api.Assertions.assertThat;

class ApplicationYmlTest {

    @Test
    @SuppressWarnings("unchecked")
    void test_프로파일_문서가_있다() throws Exception {
        List<Map<String, Object>> docs = new ArrayList<>();
        try (InputStream in = getClass().getResourceAsStream("/application.yml")) {
            new Yaml().loadAll(in).forEach(d -> docs.add((Map<String, Object>) d));
        }

        assertThat(docs).hasSizeGreaterThanOrEqualTo(2);
        assertThat(docs).anySatisfy(doc -> assertThat(onProfile(doc)).isEqualTo("test"));
    }

    @SuppressWarnings("unchecked")
    private static Object onProfile(Map<String, Object> doc) {
        Map<String, Object> spring = (Map<String, Object>) doc.get("spring");
        Map<String, Object> config = (Map<String, Object>) spring.get("config");
        if (config == null) {
            return null;
        }
        Map<String, Object> activate = (Map<String, Object>) config.get("activate");
        return activate.get("on-profile");
    }
}
