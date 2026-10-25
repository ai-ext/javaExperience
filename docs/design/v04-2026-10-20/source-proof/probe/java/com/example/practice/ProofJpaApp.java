package com.example.practice;
import com.example.practice.product.Product;
import com.example.practice.product.ProductRepository;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/** 추가 slice용 구성. 외부 study entity/repository만 scan하며 실제 학습자 앱은 사용하지 않는다. */
@SpringBootConfiguration
@EnableAutoConfiguration
@EntityScan(basePackageClasses=Product.class)
@EnableJpaRepositories(basePackageClasses=ProductRepository.class)
public class ProofJpaApp {}
