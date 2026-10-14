package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/querydsl")
public class QuerydslQueryController {
    private final QuerydslQueryService service;
    public QuerydslQueryController(QuerydslQueryService service) { this.service = service; }
    @GetMapping("/search")
    public QueryPage search(@RequestParam Map<String, String> params) {
        return service.search(params);
    }
}
