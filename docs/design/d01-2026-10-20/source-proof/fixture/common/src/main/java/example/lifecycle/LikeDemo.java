package example.lifecycle;

/** 원문에 구현이 없는 좋아요 정책을 관찰하는 추가 CLI fixture다. HTTP/DB가 아니다. */
public class LikeDemo {
    public static void main(String[] args) {
        if (args.length > 0 && args[0].equals("--self-test")) {
            LikeLedger ledger = new LikeLedger();
            ledger.like(42, 7);
            ledger.like(42, 7);
            System.out.println("observed_likes=" + ledger.count());
            if (ledger.count() != 1) {
                throw new AssertionError("same actor/post must count once");
            }
            System.out.println("PASS duplicate-like-is-one");
            return;
        }
        String profile = System.getenv().getOrDefault("D01_DEMO_ENV", "local");
        String dbAlias = System.getenv().getOrDefault("D01_DEMO_DB_ALIAS", "none");
        boolean enabled = Boolean.parseBoolean(System.getenv().getOrDefault("D01_DEMO_FEATURE", "true"));
        LikeLedger ledger = new LikeLedger();
        if (enabled) {
            ledger.like(42, 7);
            ledger.like(42, 7);
        }
        System.out.println("mode=ADDITIONAL_CLI_FIXTURE");
        System.out.println("java_version=" + System.getProperty("java.version"));
        System.out.println("profile=" + profile);
        System.out.println("db_alias_string_only=" + dbAlias);
        System.out.println("feature_enabled=" + enabled);
        System.out.println("like_count=" + ledger.count());
    }
}
