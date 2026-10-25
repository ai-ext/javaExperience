// 원문 MethodsDemo를 그대로 컴파일해 추가 호출 형태를 확인한다.
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;

public class P09MethodsProbe {
    private static void check(boolean result, String label) {
        if (!result) throw new AssertionError(label);
        System.out.println(label);
    }
    private static String output(Runnable action) {
        PrintStream original = System.out;
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (PrintStream capture = new PrintStream(bytes, true, StandardCharsets.UTF_8)) {
            System.setOut(capture);
            action.run();
        } finally { System.setOut(original); }
        return bytes.toString(StandardCharsets.UTF_8);
    }
    public static void main(String[] args) {
        MethodsDemo demo = new MethodsDemo("Hello, ");
        check(demo.format("Ada").equals("Hello, Ada"), "format(String): Hello, Ada");
        check(demo.format("Hi! ", 2).equals("Hello, Hi! Hello, Hi! "), "format(String,int): both prefixes and trailing space");
        String expected = "one" + System.lineSeparator() + "two" + System.lineSeparator();
        check(output(() -> demo.printAll("one", "two")).equals(expected), "varargs individual arguments: one/two");
        check(output(() -> demo.printAll(new String[]{"one", "two"})).equals(expected), "varargs array argument: one/two");
        check(output(demo::printAll).isEmpty(), "varargs empty call: no output");
        check(MethodsDemo.createdCount() == 1, "format and printAll do not increment created");
    }
}
