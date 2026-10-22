package com.example.javatrack.j12;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** 주어진 코드: 고치지 않는다. 상품 재고·회원 포인트·주문을 메모리에 담는 저장소(DB 대신). */
public class ShopStore {

    private final Map<String, ShopItem> items = new HashMap<>();
    private final Map<Long, Integer> points = new HashMap<>();
    private final List<PurchaseOrder> orders = new ArrayList<>();

    public void addItem(String code, long price, int stock) {
        items.put(code, new ShopItem(code, price, stock));
    }

    public void setPoints(long memberId, int balance) {
        points.put(memberId, balance);
    }

    /** 없는 상품이면 null을 돌려준다(레거시 저장소의 관례). */
    public ShopItem findItem(String code) {
        return items.get(code);
    }

    public int pointsOf(long memberId) {
        return points.getOrDefault(memberId, 0);
    }

    public void decreaseStock(String code, int quantity) {
        ShopItem item = items.get(code);
        items.put(code, new ShopItem(code, item.price(), item.stock() - quantity));
    }

    public void usePoints(long memberId, int amount) {
        points.put(memberId, pointsOf(memberId) - amount);
    }

    public void addPoints(long memberId, int amount) {
        points.put(memberId, pointsOf(memberId) + amount);
    }

    /** 주문을 저장하고 1부터 차례로 매긴 주문 번호를 돌려준다. */
    public long saveOrder(PurchaseOrder order) {
        orders.add(order);
        return orders.size();
    }

    public List<PurchaseOrder> orders() {
        return List.copyOf(orders);
    }
}
