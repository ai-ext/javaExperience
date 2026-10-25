package com.example.practice.product;

import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ContextConfiguration;
import com.example.practice.ProofJpaApp;
import v04.support.Proof;
import static org.assertj.core.api.Assertions.assertThat;

/** 추가 native 연결 adapter다. 원문 assert body만 그대로 복사했고 TC 원문 class 실행이 아니다. */
@DataJpaTest(properties={"spring.jpa.hibernate.ddl-auto=validate","spring.sql.init.mode=never","spring.jpa.show-sql=false","logging.level.root=ERROR","spring.datasource.hikari.maximum-pool-size=2","spring.datasource.hikari.minimum-idle=0"})
@ContextConfiguration(classes=ProofJpaApp.class)
@AutoConfigureTestDatabase(replace=AutoConfigureTestDatabase.Replace.NONE)
class NativeAdapterTest extends NativeProperties {
 @Autowired ProductRepository productRepository;
 @Autowired DataSource ds;
 @Test void excludesSoftDeletedProduct(){
        assertThat(productRepository.findByIdAndDeletedAtIsNull(1L)).isPresent();
        assertThat(productRepository.findByIdAndDeletedAtIsNull(80L)).isEmpty();
  Proof.guard(ds);Proof.record("adapter-source-finder-assert-body",Proof.map("product1Present",productRepository.findByIdAndDeletedAtIsNull(1L).isPresent(),"product80Present",productRepository.findByIdAndDeletedAtIsNull(80L).isPresent(),"engine",Proof.engine(ds)));
 }
 @Test void countsActiveProductsWithMysql(){
        Page<Product> page = productRepository.findAllByDeletedAtIsNull(PageRequest.of(0, 10));
        assertThat(page.getContent()).hasSize(10);
        assertThat(page.getTotalElements()).isEqualTo(79);
        assertThat(page.getTotalPages()).isEqualTo(8);
  Proof.guard(ds);Proof.record("adapter-source-page-assert-body",Proof.map("content",page.getContent().size(),"total",page.getTotalElements(),"pages",page.getTotalPages(),"idsUnordered",page.getContent().stream().map(Product::getId).sorted().toList()));
 }
}
