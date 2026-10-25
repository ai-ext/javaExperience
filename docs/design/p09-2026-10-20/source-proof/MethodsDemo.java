public class MethodsDemo {
    private final String prefix;
    private static int created;
    public MethodsDemo(String prefix) { this.prefix = prefix; created++; }
    public String format(String name) { return prefix + name; }
    public String format(String name, int count) { return format(name).repeat(count); }
    public void printAll(String... messages) {
        for (String message : messages) System.out.println(message);
    }
    public static int createdCount() { return created; }
    public static void main(String[] args) {
        MethodsDemo demo = new MethodsDemo("Hello, ");
        System.out.println(demo.format("Ada"));
        System.out.println(demo.format("Hi! ", 2));
        demo.printAll("one", "two");
        System.out.println("created=" + MethodsDemo.createdCount());
    }
}
