public class PassByValueDemo {
    private static class Profile { private String nickname; Profile(String n) { nickname = n; } }
    private static void changeObject(Profile p) { p.nickname = "Grace"; }
    private static void replaceLocalReference(Profile p) { p = new Profile("Local only"); }
    private static void changePrimitive(int n) { n = 99; }
    public static void main(String[] args) {
        Profile p = new Profile("Ada"); changeObject(p);
        System.out.println("after field mutation=" + p.nickname);
        replaceLocalReference(p);
        System.out.println("after parameter reassignment=" + p.nickname);
        int n = 1; changePrimitive(n);
        System.out.println("after primitive parameter assignment=" + n);
    }
}
