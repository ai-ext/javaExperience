package com.example.practice.product;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

class ProductServiceUnitTest {
    private final ProductRepository repository = mock(ProductRepository.class);
    private final ProductService service = new ProductService(repository);

    @Test
    void mapsResponseAndThrowsForMissingProduct() {
        Product found = product(7L, "키보드");
        given(repository.findByIdAndDeletedAtIsNull(7L)).willReturn(Optional.of(found));
        given(repository.findByIdAndDeletedAtIsNull(404L)).willReturn(Optional.empty());

        ProductResponse response = service.getById(7L);
        assertThat(response.id()).isEqualTo(7L);
        assertThat(response.name()).isEqualTo("키보드");
        assertThat(response.price()).isEqualByComparingTo("9700");
        assertThatThrownBy(() -> service.getById(404L))
                .isInstanceOf(ProductNotFoundException.class).hasMessage("Product 404 was not found");
    }

    @Test
    void mapsPageAndDelegatesPageable() {
        var request = PageRequest.of(2, 2);
        // 상품 mock을 먼저 만든다. willReturn(...) 인자 안에서 product()를 부르면 그 안의 given()이
        // 바깥 stubbing이 끝나기 전에 실행돼 UnfinishedStubbingException이 난다(검증 중 실제로 겪음).
        var first = product(21L, "첫 상품");
        var second = product(22L, "둘째 상품");
        given(repository.findAllByDeletedAtIsNull(request))
                .willReturn(new PageImpl<>(List.of(first, second), request, 5));

        ProductPageResponse response = service.getPage(2, 2);
        assertThat(response.items()).extracting(ProductResponse::id).containsExactly(21L, 22L);
        assertThat(response.page()).isEqualTo(2);
        assertThat(response.totalPages()).isEqualTo(3);
        verify(repository).findAllByDeletedAtIsNull(request);
    }

    private static Product product(Long id, String name) {
        Product p = mock(Product.class);
        given(p.getId()).willReturn(id);
        given(p.getName()).willReturn(name);
        given(p.getPrice()).willReturn(new BigDecimal("9700"));
        return p;
    }
}
