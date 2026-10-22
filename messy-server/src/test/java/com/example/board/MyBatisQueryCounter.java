package com.example.board;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.plugin.Interceptor;
import org.apache.ibatis.plugin.Intercepts;
import org.apache.ibatis.plugin.Invocation;
import org.apache.ibatis.plugin.Signature;
import org.apache.ibatis.session.ResultHandler;
import org.apache.ibatis.session.RowBounds;
import org.apache.ibatis.session.SqlSessionFactory;

/**
 * MyBatis 조회 횟수를 매퍼 메서드별로 센다. Hibernate 통계에는 MyBatis 쿼리가 잡히지 않아서 따로 둔다.
 * 빈으로 등록하면 컨텍스트 캐시 키가 바뀌어 MySQL이 하나 더 뜨므로, 이미 뜬 SqlSessionFactory에 붙인다.
 */
@Intercepts(@Signature(type = Executor.class, method = "query",
        args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}))
public final class MyBatisQueryCounter implements Interceptor {

    private final Map<String, AtomicInteger> counts = new ConcurrentHashMap<>();

    /** 컨텍스트마다 한 번만 붙인다. 새로 여는 SqlSession부터 적용된다. */
    public static synchronized MyBatisQueryCounter attach(SqlSessionFactory factory) {
        for (Interceptor i : factory.getConfiguration().getInterceptors()) {
            if (i instanceof MyBatisQueryCounter counter) {
                return counter;
            }
        }
        MyBatisQueryCounter counter = new MyBatisQueryCounter();
        factory.getConfiguration().addInterceptor(counter);
        return counter;
    }

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        counts.computeIfAbsent(ms.getId(), k -> new AtomicInteger()).incrementAndGet();
        return invocation.proceed();
    }

    /** 매퍼 메서드 이름(예: findPopular)으로 끝나는 statement의 실행 횟수. */
    public int count(String methodName) {
        return counts.entrySet().stream().filter(e -> e.getKey().endsWith("." + methodName))
                .mapToInt(e -> e.getValue().get()).sum();
    }

    public void clear() {
        counts.clear();
    }
}
