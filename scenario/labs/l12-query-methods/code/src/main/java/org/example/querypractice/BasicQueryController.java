package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

// practice에서만 제공하는 익명 공개 목록 비교 API. 개인화된 조회는 기존 /api/posts가 담당한다.
@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class BasicQueryController {
    private final BasicQueryService service;
    public BasicQueryController(BasicQueryService service) { this.service = service; }

    @GetMapping("/posts/{id}")
    public QueryPostRow detail(@PathVariable String engine, @PathVariable String id) {
        return service.detail(engine, id);
    }
    @GetMapping("/posts")
    public QueryPage list(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.list(engine, params);
    }
    @GetMapping("/posts/{id}/exists")
    public Map<String, Boolean> exists(@PathVariable String engine, @PathVariable String id) {
        return Map.of("exists", service.exists(engine, id));
    }
    @GetMapping("/count")
    public Map<String, Long> count(@PathVariable String engine, @RequestParam String boardSlug) {
        return Map.of("count", service.count(engine, boardSlug));
    }
}
