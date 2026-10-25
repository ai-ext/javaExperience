import java.util.Arrays;

// P09 원문의 필드·varargs·단락 규칙을 확인하는 추가 순수 Java 실험이다.
// HTTP·Spring·DB·동시 요청 실행 결과가 아니다.
public class P09BoundariesProof {
    static class RequestState {
        int quantity;
        static String latestName;
        void record(String name, int value) { quantity = value; latestName = name; }
    }
    static int sum(int... values) {
        int total = 0;
        for (int value : values) total += value;
        return total;
    }
    static String choose(int first, int second) { return "fixed(int,int)"; }
    static String choose(int... values) { return "varargs(int[])"; }
    static void out(String key, Object value) { System.out.println(key + "=" + value); }
    public static void main(String[] args) {
        RequestState a = new RequestState(), b = new RequestState();
        out("initial", a.quantity + "/" + b.quantity + "/" + RequestState.latestName);
        a.record("Ada", 2);
        out("afterA", a.quantity + "/" + b.quantity + "/" + RequestState.latestName);
        b.record("Grace", 5);
        out("afterB", a.quantity + "/" + b.quantity + "/" + RequestState.latestName);
        out("sameStatic", a.latestName.equals(b.latestName));
        out("sumEmpty", sum()); out("sumItems", sum(2, 3));
        out("sumArray", sum(new int[]{4, 6}));
        out("chooseTwo", choose(2, 3)); out("chooseArray", choose(new int[]{2, 3}));
        out("chooseEmpty", choose());
        int running = 0; int[] input = {2, 3};
        for (int value : input) { running += value; out("sumStep" + value, running); }
        out("sumInput", Arrays.toString(input));
    }
}
