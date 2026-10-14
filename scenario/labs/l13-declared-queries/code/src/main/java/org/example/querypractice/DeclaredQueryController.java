package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class DeclaredQueryController {
    private final DeclaredQueryService service;
    public DeclaredQueryController(DeclaredQueryService service) { this.service = service; }
    @GetMapping("/search")
    public QueryPage search(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.search(engine, params);
    }
    @GetMapping("/board-counts")
    public List<BoardCountRow> boardCounts(@PathVariable String engine) { return service.boardCounts(engine); }
}
