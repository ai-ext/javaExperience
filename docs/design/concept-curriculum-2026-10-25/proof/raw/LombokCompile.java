import lombok.Getter;
import lombok.RequiredArgsConstructor;
public class LombokCompile {
    @Getter @RequiredArgsConstructor
    static class Value { private final String name; }
    public static void main(String[] args) {
        System.out.println(new Value("Min").getName());
    }
}
