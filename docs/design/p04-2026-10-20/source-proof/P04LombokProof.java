import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

public class P04LombokProof {
    static class Gateway {}
    @RequiredArgsConstructor @AllArgsConstructor
    static class Fields {
        final Gateway gateway;
        @NonNull String name;
        int retries;
        final int fixed = 20;
        static int shared;
    }
    @Builder static class PlainConfig { int limit = 20; }
    @Builder static class DefaultConfig { @Builder.Default int limit = 20; }
    @NoArgsConstructor(force = true)
    static class Forced { @NonNull final String name; final int retries; }
    static class Targeted {
        final String name;
        @Builder Targeted(String name) {
            if (name == null) throw new IllegalArgumentException("name is required");
            this.name = name;
        }
    }
    static int checks;
    static void check(boolean ok, String label) {
        if (!ok) throw new AssertionError(label);
        checks++;
        System.out.println(label);
    }
    public static void main(String[] args) throws Exception {
        check(Fields.class.getDeclaredConstructor(Gateway.class, String.class) != null, "Required: 미초기화 final과 NonNull 두 인자");
        check(Fields.class.getDeclaredConstructor(Gateway.class, String.class, int.class) != null, "AllArgs: retries도 포함, 초기화 final과 static은 제외");
        Fields nullable = new Fields(null, "Mina");
        check(nullable.gateway == null, "final만으로 null 인자를 거부하지 않음");
        boolean rejected = false;
        try { new Fields(new Gateway(), null); } catch (NullPointerException expected) { rejected = true; }
        check(rejected, "NonNull 이름은 생성자에서 null 거부");
        Fields all = new Fields(new Gateway(), "Mina", 3);
        check(all.retries == 3 && all.fixed == 20, "AllArgs 입력과 선언된 final 기본값 유지");
        check(PlainConfig.builder().build().limit == 0, "Builder: Default 없는 선언 초기값20은 builder 기본값이 아님");
        check(DefaultConfig.builder().build().limit == 20, "Builder.Default: 생략 입력은20");
        check(DefaultConfig.builder().limit(7).build().limit == 7, "Builder.Default: 명시 입력7 우선");
        Forced forced = new Forced();
        check(forced.name == null, "NoArgs force: NonNull final도 null 가능");
        check(forced.retries == 0, "NoArgs force: final int는0");
        check(Targeted.builder().name("Mina").build().name.equals("Mina"), "생성자 대상 Builder가 실제 검증 경로 사용");
        rejected = false;
        try { Targeted.builder().build(); } catch (IllegalArgumentException expected) { rejected = true; }
        check(rejected, "생성자 대상 Builder: 빠진 필수 이름 거부");
        System.out.println("checks=" + checks);
    }
}
