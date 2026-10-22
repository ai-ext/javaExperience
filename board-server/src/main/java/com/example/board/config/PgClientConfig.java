package com.example.board.config;

import org.apache.hc.client5.http.config.ConnectionConfig;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.core5.util.Timeout;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import com.example.board.payment.PgClient;

@Configuration(proxyBeanMethods = false)
public class PgClientConfig {

    @Bean
    PgClient pgClient(BoardProperties properties) {
        return new PgClient(pgRestClient(properties.pg()));
    }

    /** 연결·응답·풀 대기 타임아웃을 따로 건다. 테스트가 풀 크기를 바꿔 만들 수 있게 정적 메서드로 둔다. */
    public static RestClient pgRestClient(BoardProperties.Pg pg) {
        PoolingHttpClientConnectionManager pool = PoolingHttpClientConnectionManagerBuilder.create()
                .setDefaultConnectionConfig(ConnectionConfig.custom()
                        .setConnectTimeout(Timeout.of(pg.connectTimeout()))
                        .setSocketTimeout(Timeout.of(pg.responseTimeout()))
                        .build())
                .setMaxConnTotal(pg.maxConnections())
                .setMaxConnPerRoute(pg.maxConnections())
                .build();
        CloseableHttpClient httpClient = HttpClients.custom()
                .setConnectionManager(pool)
                .setDefaultRequestConfig(RequestConfig.custom()
                        .setConnectionRequestTimeout(Timeout.of(pg.connectionRequestTimeout()))
                        .setResponseTimeout(Timeout.of(pg.responseTimeout()))
                        .build())
                // 재시도는 우리 정책 한 곳에서만 한다. 클라이언트 기본 재시도가 겹치면 횟수를 셀 수 없다.
                .disableAutomaticRetries()
                .build();
        return RestClient.builder()
                .baseUrl(pg.baseUrl())
                .requestFactory(new HttpComponentsClientHttpRequestFactory(httpClient))
                .build();
    }
}
