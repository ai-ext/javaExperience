@Sql("/sql/product-fixture.sql")
@Test
void usesOnlyItsFixture() {
    assertThat(productRepository.findByIdAndDeletedAtIsNull(9001L)).isPresent();
}
