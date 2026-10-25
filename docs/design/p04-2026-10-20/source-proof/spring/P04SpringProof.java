package com.example.orders;

import java.util.UUID;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;

public class P04SpringProof {
    private static int checks;
    private static void check(boolean ok, String label) {
        if (!ok) throw new AssertionError(label);
        checks++;
        System.out.println(label);
    }
    public static void main(String[] args) throws Exception {
        try (var context = new AnnotationConfigApplicationContext()) {
            context.register(OrderIdGenerator.class, OrderService.class, OrderController.class);
            context.refresh();
            OrderIdGenerator generator = context.getBean(OrderIdGenerator.class);
            OrderService service = context.getBean(OrderService.class);
            OrderController controller = context.getBean(OrderController.class);
            var generatorField = OrderService.class.getDeclaredField("idGenerator");
            generatorField.setAccessible(true);
            check(generatorField.get(service) == generator, "Lombok 단일 생성자: 컨텍스트의 같은 generator 주입");
            var serviceField = OrderController.class.getDeclaredField("service");
            serviceField.setAccessible(true);
            check(serviceField.get(controller) == service, "명시한 단일 생성자: 컨텍스트의 같은 service 주입");
            check(OrderService.class.getDeclaredConstructors().length == 1, "OrderService 생성자 한 개");
            OrderResponse response = controller.create(new OrderRequest(" Mina ", 2));
            check(response.customerName().equals("Mina"), "Java 메서드 직접 호출: 정규화한 Mina 반환");
            check(response.quantity() == 2, "Java 메서드 직접 호출: 수량2 반환");
            check(UUID.fromString(response.id()) != null, "Java 메서드 직접 호출: 생성된 id는 유효 UUID");
            boolean invalid = false;
            try { new OrderRequest("Mina", 0); } catch (IllegalArgumentException expected) { invalid = true; }
            check(invalid, "수량0은 record 생성자에서 거부");
            invalid = false;
            try { new OrderRequest(" ", 2); } catch (IllegalArgumentException expected) { invalid = true; }
            check(invalid, "공백 이름은 record 생성자에서 거부");
        }
        boolean missing = false;
        try (var context = new AnnotationConfigApplicationContext()) {
            context.register(OrderService.class);
            try { context.refresh(); }
            catch (BeansException expected) {
                for (Throwable cause = expected; cause != null; cause = cause.getCause()) {
                    if (cause instanceof NoSuchBeanDefinitionException) missing = true;
                }
            }
        }
        check(missing, "generator Bean 누락은 Service 생성 실패");
        System.out.println("checks=" + checks);
    }
}
