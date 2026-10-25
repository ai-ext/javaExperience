import java.util.List;
public class CreationDemo {
    public static void main(String[] args) {
        new Child();
        System.out.println(Order.of("ORD-1", 2));
        System.out.println(Order.builder().id("ORD-2").quantity(3).tag("gift").build());
    }
}
class Parent {
    private String marker = mark("Parent field");
    { System.out.println("Parent initializer block"); }
    Parent() { System.out.println("Parent constructor"); }
    static String mark(String s) { System.out.println(s); return s; }
}
class Child extends Parent {
    private String marker = Parent.mark("Child field");
    { System.out.println("Child initializer block"); }
    Child() { this("delegated"); System.out.println("Child no-arg constructor body"); }
    Child(String value) { System.out.println("Child constructor body: " + value); }
}
final class Order {
    private final String id; private final int quantity; private final List<String> tags;
    private Order(String id, int quantity, List<String> tags) {
        if (id == null || id.isBlank()) throw new IllegalArgumentException("id is required");
        if (quantity < 1) throw new IllegalArgumentException("quantity must be positive");
        this.id = id; this.quantity = quantity; this.tags = List.copyOf(tags);
    }
    static Order of(String id, int quantity) { return new Order(id, quantity, List.of()); }
    static Builder builder() { return new Builder(); }
    public String toString() { return id + " x " + quantity + " tags=" + tags; }
    static final class Builder {
        private String id; private int quantity; private List<String> tags = new java.util.ArrayList<>();
        Builder id(String value) { id = value; return this; }
        Builder quantity(int value) { quantity = value; return this; }
        Builder tag(String value) { tags.add(value); return this; }
        Order build() { return new Order(id, quantity, tags); }
    }
}
