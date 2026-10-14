package org.example.querypractice;

import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class QuerydslQueryService {
    private final QuerydslPostRepository repository;

    public QuerydslQueryService(QuerydslPostRepository repository) {
        this.repository = repository;
    }

    public QueryPage search(Map<String, String> params) {
        return repository.search(SearchFilter.parse(params));
    }
}
