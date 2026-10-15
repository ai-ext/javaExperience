package org.example.querypractice;

import java.util.List;

public record QueryPage(List<QueryPostRow> items, int page, int size, long total) {}
