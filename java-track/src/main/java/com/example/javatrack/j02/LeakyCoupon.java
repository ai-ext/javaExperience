package com.example.javatrack.j02;

/**
 * 주어진 함정 코드: 고치지 않는다. {@link Coupon}과 비교하려고 둔다.
 * {@code @Getter @Setter @NoArgsConstructor @AllArgsConstructor}를 붙인 엔티티를 delombok한 결과와 같은 코드다.
 * 모든 필드에 public setter가 있고, 모든 필드를 받는 public 생성자가 있다. 어디서든 아무 값이나 넣을 수 있다.
 */
public class LeakyCoupon {

    private Long id;
    private String name;
    private int totalQuantity;
    private int issuedQuantity;

    // @NoArgsConstructor
    public LeakyCoupon() {
    }

    // @AllArgsConstructor: 필드 선언 순서대로 모두 받는다
    public LeakyCoupon(Long id, String name, int totalQuantity, int issuedQuantity) {
        this.id = id;
        this.name = name;
        this.totalQuantity = totalQuantity;
        this.issuedQuantity = issuedQuantity;
    }

    // @Getter
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getTotalQuantity() {
        return totalQuantity;
    }

    public int getIssuedQuantity() {
        return issuedQuantity;
    }

    // @Setter
    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setTotalQuantity(int totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public void setIssuedQuantity(int issuedQuantity) {
        this.issuedQuantity = issuedQuantity;
    }
}
