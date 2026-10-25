public class P04StateProof {
    private static int checks;
    private static void check(boolean condition, String label) {
        if (!condition) throw new AssertionError(label);
        checks++;
        System.out.println(label);
    }
    private static void rejected(Runnable action, String message) {
        try { action.run(); throw new AssertionError("예외가 필요함: " + message); }
        catch (IllegalArgumentException e) { check(message.equals(e.getMessage()), "거부: " + message); }
    }
    public static void main(String[] args) {
        check(Order.of("ORD-1", 2).toString().equals("ORD-1 x 2 tags=[]"), "factory: ORD-1, 2, 빈 tags");
        Order.Builder builder = Order.builder();
        check(builder.id("ORD-2") == builder, "id 설정은 같은 Builder 반환");
        check(builder.quantity(3) == builder, "quantity 설정은 같은 Builder 반환");
        check(builder.tag("gift") == builder, "tag 추가는 같은 Builder 반환");
        Order first = builder.build();
        check(first.toString().equals("ORD-2 x 3 tags=[gift]"), "build: 검증된 Order 반환");
        builder.tag("late");
        check(first.toString().equals("ORD-2 x 3 tags=[gift]"), "추가 예시: Builder 목록 변경 뒤 기존 Order tags 유지");
        Order next = builder.build();
        check(next.toString().equals("ORD-2 x 3 tags=[gift, late]"), "추가 예시: 다시 build한 Order는 현재 Builder 목록 사용");
        rejected(() -> Order.builder().build(), "id is required");
        rejected(() -> Order.builder().id("ORD-X").build(), "quantity must be positive");
        rejected(() -> Order.of(" ", 2), "id is required");
        rejected(() -> Order.of("ORD-X", 0), "quantity must be positive");
        SignupRequest request = new SignupRequest(" user@example.com ", " Mina ");
        check(request.email().equals("user@example.com"), "record: trim한 email이 필드에 저장됨");
        check(request.displayName().equals("Mina"), "추가 예시: trim한 displayName이 필드에 저장됨");
        rejected(() -> new SignupRequest("bad", "Mina"), "email is invalid");
        rejected(() -> new SignupRequest("user@example.com", " "), "displayName is required");
        check(checks == 15, "총 상태 확인 15개");
    }
}
