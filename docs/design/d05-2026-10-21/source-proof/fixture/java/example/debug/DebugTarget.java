package example.debug;

import java.io.BufferedReader;
import java.io.InputStreamReader;

public class DebugTarget {
    static int counter = 0;
    static int bump() { return ++counter; }
    static int compute(int id) { return id * 2; }
    static int inspect(int id) {
        int doubled = compute(id);
        int result = doubled + counter;
        return result;
    }
    public static void main(String[] args) throws Exception {
        System.out.println("DEBUG_READY");
        new BufferedReader(new InputStreamReader(System.in)).readLine();
        System.out.println("DEBUG_RESULT=" + inspect(13));
    }
}
