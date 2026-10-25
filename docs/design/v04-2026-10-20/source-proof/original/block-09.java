@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrderHttpTest {
    @Autowired TestRestTemplate http;
    @Autowired OrderRepository orders;

    @Test
    void serverWriteIsOutsideTestTransaction() {
        http.postForEntity("/api/orders", request, Void.class);
        assertThat(orders.existsById(expectedId)).isTrue();
    }
}
