// P09 원문 사이의 상태를 관찰하기 위한 추가 예시. 학습자 서버 코드가 아니다.
public class P09StateProof {
    private static class Profile {
        private String nickname;
        Profile(String nickname) { this.nickname = nickname; }
    }
    private static void mutate(Profile p, Profile caller) {
        check(p == caller, "mutation: copied reference denotes A");
        check(p.nickname.equals("Ada"), "mutation: before Ada");
        p.nickname = "Grace";
        check(caller.nickname.equals("Grace"), "mutation: caller observes Grace during call");
    }
    private static void reassign(Profile p, Profile caller) {
        check(p == caller && p.nickname.equals("Grace"), "reassignment: starts with A Grace");
        p = new Profile("Local only");
        check(p != caller, "reassignment: parameter denotes B");
        check(p.nickname.equals("Local only") && caller.nickname.equals("Grace"), "reassignment: B Local only / A Grace");
    }
    private static void primitive(int n) {
        check(n == 1, "primitive: copied 1");
        n = 99;
        check(n == 99, "primitive: local 99");
    }
    private static class Quantity {
        private int quantity;
        void setQuantity(int quantity) {
            if (quantity < 0) throw new IllegalArgumentException();
            this.quantity = quantity;
        }
        int getQuantity() { return quantity; }
    }
    private static Profile normalize(Profile original) { return new Profile("Local only"); }
    private static void check(boolean valid, String label) {
        if (!valid) throw new AssertionError(label);
        System.out.println(label);
    }
    public static void main(String[] args) {
        Profile caller = new Profile("Ada");
        mutate(caller, caller);
        check(caller.nickname.equals("Grace"), "mutation: returned A Grace");
        reassign(caller, caller);
        check(caller.nickname.equals("Grace"), "reassignment: returned caller still A Grace");
        int n = 1; primitive(n);
        check(n == 1, "primitive: returned caller still 1");
        Profile returned = normalize(caller);
        check(caller != returned && caller.nickname.equals("Grace"), "return: returning B has not reassigned caller");
        caller = returned;
        check(caller == returned && caller.nickname.equals("Local only"), "return: caller assignment now denotes B");
        // 아래 값은 원문에 없는 독립 설명용 예시다.
        final Quantity q = new Quantity();
        q.setQuantity(3);
        try { q.setQuantity(-1); throw new AssertionError("negative accepted"); }
        catch (IllegalArgumentException expected) { check(q.getQuantity() == 3, "setter: rejection preserves field 3"); }
        q.setQuantity(2);
        check(q.getQuantity() == 2, "final reference: object field remains mutable");
        String a = new String("Ada"), b = new String("Ada");
        check(a != b && a.equals(b), "String: distinct identity / equal content");
        int post = 1, pre = 1; int postValue = post++; int preValue = ++pre;
        check(postValue == 1 && post == 2 && preValue == 2 && pre == 2, "increment: postfix 1/2; prefix 2/2");
        check(Integer.MAX_VALUE + 1 == Integer.MIN_VALUE, "int overflow: -2147483648");
        int zero = 0;
        try { int invalid = 7 / zero; throw new AssertionError(invalid); }
        catch (ArithmeticException expected) { System.out.println("division by zero: ArithmeticException"); }
        check(new java.math.BigDecimal("0.1").add(new java.math.BigDecimal("0.2")).toPlainString().equals("0.3"), "BigDecimal strings: exact 0.3");
        check(0.1 + 0.2 != 0.3, "double: 0.1 + 0.2 differs from 0.3");
        int calls = 0;
        boolean skippedAnd = false && (++calls > 0);
        check(!skippedAnd && calls == 0, "short circuit AND: false, calls 0");
        boolean skippedOr = true || (++calls > 0);
        check(skippedOr && calls == 0, "short circuit OR: true, calls still 0");
        boolean evaluatedBitwise = false & (++calls > 0);
        check(!evaluatedBitwise && calls == 1, "boolean AND: false, calls 1");
        int x = 1; int postDecrement = x--;
        check(postDecrement == 1 && x == 0, "decrement: postfix result 1, stored 0");
        x = 1; int preDecrement = --x;
        check(preDecrement == 0 && x == 0, "decrement: prefix result 0, stored 0");
        x = 1;
        check(+x == 1 && x == 1, "unary plus: result 1, stored 1");
        check(-x == -1 && x == 1, "unary minus: result -1, stored 1");
        boolean closed = false;
        check(!closed && !Boolean.valueOf(closed), "NOT: false becomes true, variable unchanged");
        closed = true;
        check(!(!closed) && closed, "NOT: true becomes false, variable unchanged");
        check((6 & 3) == 2 && (6 | 3) == 7 && (6 ^ 3) == 5, "bitwise: 6 AND 3=2, OR=7, XOR=5");
        check(Double.toString(0.1 + 0.2).equals("0.30000000000000004"), "double representation: 0.30000000000000004");
        int[] ints = new int[2]; boolean[] flags = new boolean[2]; String[] strings = new String[2];
        check(ints[0] == 0 && ints[1] == 0 && !flags[0] && !flags[1] && strings[0] == null && strings[1] == null,
                "array defaults: int 0/0, boolean false/false, String null/null");
        checkBooleanPrecedence();
    }
    private static void checkBooleanPrecedence() {
        boolean a = true, b = false, c = false;
        check((a || b && c) && !((a || b) && c), "boolean precedence: true versus explicit grouping false");
    }
}
