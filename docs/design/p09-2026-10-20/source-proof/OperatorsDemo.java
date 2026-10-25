public class OperatorsDemo {
    public static void main(String[] args) {
        int quantity = 3;
        int unitPrice = 1200;
        int subtotal = quantity * unitPrice;
        int discounted = subtotal - subtotal / 10;
        int precedence = 2 + 3 * 4;
        int leftToRight = 10 + 6 / 2 * 3;
        boolean eligible = quantity >= 3 && discounted >= 3000;
        int divisor = 0;
        boolean safe = divisor != 0 && 24 / divisor > 3;
        int calls = 0;
        boolean skippedAnd = false && (++calls > 0);
        boolean skippedOr = true || (++calls > 0);
        boolean evaluatedBitwise = false & (++calls > 0);

        System.out.println("subtotal=" + subtotal + ", discounted=" + discounted);
        System.out.println("precedence=" + precedence + ", leftToRight=" + leftToRight);
        System.out.println("eligible=" + eligible + ", safe=" + safe);
        System.out.println("shortCircuit=" + skippedAnd + ", " + skippedOr
                + ", bitwise=" + evaluatedBitwise + ", calls=" + calls);
    }
}
