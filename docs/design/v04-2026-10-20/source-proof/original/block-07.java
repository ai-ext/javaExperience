// LAZY 연관을 가진 주문 서비스에 적용하는 실패 재현 형태
@Test
void returnedEntityCannotRelyOnTestTransaction() {
    Order order = orderService.getEntity(orderId); // 내부 서비스 tx 종료
    assertThatThrownBy(() -> order.getLines().size())
            .isInstanceOf(org.hibernate.LazyInitializationException.class);
}
