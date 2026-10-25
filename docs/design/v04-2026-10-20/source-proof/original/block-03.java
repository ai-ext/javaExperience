package com.example.practice.product;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;
import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@DataJpaTest(properties = {"spring.sql.init.mode=always",
        "spring.sql.init.schema-locations=file:../schema/schema.sql,file:../schema/seed.sql"})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ProductRepositoryTest {
    @Container @ServiceConnection
    static final MySQLContainer mysql = new MySQLContainer("mysql:8.4")
            .withDatabaseName("ds_practice").withUsername("practice").withPassword("practice");
    @Autowired ProductRepository productRepository;

    @Test
    void excludesSoftDeletedProduct() {
        assertThat(productRepository.findByIdAndDeletedAtIsNull(1L)).isPresent();
        assertThat(productRepository.findByIdAndDeletedAtIsNull(80L)).isEmpty();
    }

    @Test
    void countsActiveProductsWithMysql() {
        Page<Product> page = productRepository.findAllByDeletedAtIsNull(PageRequest.of(0, 10));
        assertThat(page.getContent()).hasSize(10);
        assertThat(page.getTotalElements()).isEqualTo(79);
        assertThat(page.getTotalPages()).isEqualTo(8);
    }
}
