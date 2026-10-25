public class P04ConstructorProof {
    static boolean invoked;
    static int calls;
    static String seenDuringParent;
    static class Parent {
        Parent() { inspect(); }
        void inspect() {}
    }
    static class Child extends Parent {
        String label = "ready";
        @Override void inspect() {
            invoked = true;
            calls++;
            seenDuringParent = label;
        }
    }
    public static void main(String[] args) {
        Child child = new Child();
        if (!invoked || calls != 1) throw new AssertionError("override 호출 확인");
        if (seenDuringParent != null) throw new AssertionError("자식 초기화 전에는 null");
        if (!child.label.equals("ready")) throw new AssertionError("자식 초기화 뒤 ready");
        System.out.println("parent constructor called child override: true");
        System.out.println("child label during parent constructor: null");
        System.out.println("child label after construction: ready");
    }
}
