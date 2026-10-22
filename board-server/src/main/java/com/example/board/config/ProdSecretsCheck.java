package com.example.board.config;

import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

/**
 * 설정 바인딩은 풀리지 않는 ${...}를 문자열 그대로 두므로, 환경 변수가 빠져도 조용히 넘어간다.
 * getRequiredProperty는 중첩 자리표시자까지 엄격하게 풀어서 빠진 환경 변수를 기동 시점에 잡는다.
 */
@Configuration(proxyBeanMethods = false)
@Profile("prod")
public class ProdSecretsCheck {

    private static final String[] REQUIRED_KEYS = {"spring.datasource.password"};

    @Bean
    static BeanFactoryPostProcessor requiredSecretsCheck(Environment env) {
        return beanFactory -> {
            for (String key : REQUIRED_KEYS) {
                env.getRequiredProperty(key);
            }
        };
    }
}
