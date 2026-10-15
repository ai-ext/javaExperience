package org.example.querypractice;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class DeclaredQueryService {
    private final DeclaredPostRepository repository;
    private final DeclaredPostMapper mapper;
    public DeclaredQueryService(DeclaredPostRepository repository, DeclaredPostMapper mapper) {
        this.repository = repository; this.mapper = mapper;
    }
    public QueryPage search(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        SearchFilter filter = SearchFilter.parse(params);
        if (engine.equals("mybatis")) return new QueryPage(mapper.search(filter), filter.page(), filter.size(), mapper.count(filter));
        var page = repository.search(filter, filter.pageable());
        return new QueryPage(page.getContent(), filter.page(), filter.size(), page.getTotalElements());
    }
    public List<BoardCountRow> boardCounts(String engine) {
        QueryInputs.engine(engine);
        return engine.equals("jpa") ? repository.boardCounts() : mapper.boardCounts();
    }
}
