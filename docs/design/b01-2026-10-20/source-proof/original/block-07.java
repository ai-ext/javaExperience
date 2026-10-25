private static final DefaultRedisScript<Long> INCR_WINDOW =
    new DefaultRedisScript<>("""
        local n = redis.call('INCR', KEYS[1])
        if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
        return n
        """, Long.class);

long failed(String opaqueKey, Duration window) {
    Long n = redis.execute(INCR_WINDOW, List.of(opaqueKey),
            Long.toString(window.toSeconds()));
    if (n == null) throw new IllegalStateException("rate counter unavailable");
    return n;
}
