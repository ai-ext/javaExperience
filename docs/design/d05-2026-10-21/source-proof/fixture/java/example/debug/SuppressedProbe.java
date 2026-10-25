package example.debug;

public class SuppressedProbe {
    static class Resource implements AutoCloseable {
        @Override public void close() { throw new IllegalStateException("close failed"); }
    }
    public static void main(String[] args) {
        try (Resource resource = new Resource()) {
            throw new IllegalArgumentException("body failed");
        } catch (Exception failure) {
            System.out.println("PRIMARY=" + failure.getClass().getName() + ":" + failure.getMessage());
            System.out.println("CAUSE_NULL=" + (failure.getCause() == null));
            System.out.println("SUPPRESSED_COUNT=" + failure.getSuppressed().length);
            System.out.println("SUPPRESSED=" + failure.getSuppressed()[0].getClass().getName() + ":" + failure.getSuppressed()[0].getMessage());
            failure.printStackTrace(System.out);
        }
    }
}
