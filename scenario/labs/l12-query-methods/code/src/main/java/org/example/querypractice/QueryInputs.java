package org.example.querypractice;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

public final class QueryInputs {
    private QueryInputs() {}

    public static ResponseStatusException bad(String field) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " 값을 확인해 주세요.");
    }

    public static void engine(String engine) {
        if (!"jpa".equals(engine) && !"mybatis".equals(engine)) throw bad("engine");
    }

    public static long positive(String raw, String field) {
        if (raw == null || !raw.matches("[0-9]+")) throw bad(field);
        try {
            long value = Long.parseLong(raw);
            if (value > 0) return value;
        } catch (NumberFormatException ignored) { }
        throw bad(field);
    }

    public static int number(Map<String, String> params, String field, int fallback, int min, int max) {
        String raw = params.get(field);
        if (raw == null) return fallback;
        if (raw.matches("[0-9]+")) {
            try {
                int value = Integer.parseInt(raw);
                if (value >= min && value <= max) return value;
            } catch (NumberFormatException ignored) { }
        }
        throw bad(field);
    }

    public static String text(Map<String, String> params, String field, int max) {
        String value = params.get(field);
        if (value != null && (value.isBlank() || value.length() > max)) throw bad(field);
        return value;
    }

    // %, _도 사용자가 입력한 문자로 찾는다. SQL 와일드카드로 확장하지 않는다.
    public static String pattern(String keyword) {
        return keyword == null ? null : "%" + keyword.replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
    }
}
