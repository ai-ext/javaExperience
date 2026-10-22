package com.example.board.shop;

import java.time.Duration;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

/**
 * 구매 알림. 주문이 들어오면 운영 채널(사내 메신저 웹훅)에 "누가 무엇을 샀는지"를 보낸다.
 * board.shop.order-webhook-url이 비어 있으면 보내지 않는다. 알림 실패는 주문 결과에 영향을 주지 않는다.
 */
@Component
public class OrderNotifier {

    private static final Logger log = LoggerFactory.getLogger(OrderNotifier.class);

    private final ShopOrderRepository shopOrderRepository;
    private final String webhookUrl;
    private final RestClient restClient;

    public OrderNotifier(ShopOrderRepository shopOrderRepository,
            @Value("${board.shop.order-webhook-url:}") String webhookUrl) {
        this.shopOrderRepository = shopOrderRepository;
        this.webhookUrl = webhookUrl;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(1));
        // 메신저 서버가 바쁠 때가 있어 넉넉히 기다린다
        factory.setReadTimeout(Duration.ofSeconds(10));
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    /** 알림 본문에 회원 닉네임·아이템 이름이 필요해 주문을 다시 읽는다(지연 로딩이라 트랜잭션 안에서). */
    @Transactional(readOnly = true)
    public void notifyOrdered(Long orderId) {
        if (webhookUrl.isBlank()) {
            return;
        }
        ShopOrder order = shopOrderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return;
        }
        String text = "%s님이 %s %d개를 구매했습니다(%d포인트)".formatted(order.getMember().getNickname(),
                order.getItem().getName(), order.getQuantity(), order.getPaidAmount());
        try {
            restClient.post().uri(webhookUrl).contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("text", text)).retrieve().toBodilessEntity();
        } catch (RuntimeException e) {
            log.warn("구매 알림 실패 orderId={}: {}", orderId, e.toString());
        }
    }
}
