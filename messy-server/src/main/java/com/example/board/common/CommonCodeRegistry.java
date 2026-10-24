package com.example.board.common;

import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Component;

@Component
public class CommonCodeRegistry {

    // "group:code" -> name. 적재 때 통째로 교체한다.
    private volatile Map<String, String> names = Map.of();

    void replace(Map<String, String> newNames) {
        this.names = Map.copyOf(newNames);
    }

    public int size() {
        return names.size();
    }

    public Optional<String> name(String group, String code) {
        return Optional.ofNullable(names.get(key(group, code)));
    }

    static String key(String group, String code) {
        return group + ":" + code;
    }
}
