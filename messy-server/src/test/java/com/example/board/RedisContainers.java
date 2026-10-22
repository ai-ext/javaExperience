package com.example.board;

import java.io.IOException;

import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.toxiproxy.ToxiproxyContainer;

import eu.rekawek.toxiproxy.Proxy;
import eu.rekawek.toxiproxy.ToxiproxyClient;

/**
 * Redis와 그 앞단 Toxiproxy. JVM 안에서 한 번만 띄워 모든 컨텍스트가 같이 쓴다.
 * 보통 컨텍스트는 Redis에 바로 붙고, 장애 주입 테스트만 Toxiproxy 주소로 붙는다.
 * 그래야 지연·끊김을 넣어도 캐시된 다른 컨텍스트의 연결이 흔들리지 않는다.
 * 컨테이너를 멈추지 않는다. 멈추면 같은 JVM의 뒤 테스트 클래스가 모두 깨진다.
 */
public final class RedisContainers {

    private static final int PROXY_PORT = 8666;
    private static final Network NETWORK = Network.newNetwork();
    private static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7.4")
            .withNetwork(NETWORK)
            .withNetworkAliases("redis")
            .withExposedPorts(6379);
    private static final ToxiproxyContainer TOXIPROXY = new ToxiproxyContainer("ghcr.io/shopify/toxiproxy:2.12.0")
            .withNetwork(NETWORK);

    private static ToxiproxyClient toxiproxyClient;
    private static Proxy proxy;

    private RedisContainers() {
    }

    public static synchronized void start() {
        if (proxy != null) {
            return;
        }
        REDIS.start();
        TOXIPROXY.start();
        toxiproxyClient = new ToxiproxyClient(TOXIPROXY.getHost(), TOXIPROXY.getControlPort());
        createProxy();
    }

    private static void createProxy() {
        try {
            proxy = toxiproxyClient.createProxy("redis", "0.0.0.0:" + PROXY_PORT, "redis:6379");
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    public static String host() {
        start();
        return REDIS.getHost();
    }

    public static int port() {
        start();
        return REDIS.getMappedPort(6379);
    }

    public static String proxyHost() {
        start();
        return TOXIPROXY.getHost();
    }

    public static int proxyPort() {
        start();
        return TOXIPROXY.getMappedPort(PROXY_PORT);
    }

    public static Proxy proxy() {
        start();
        return proxy;
    }

    /** 독성을 걷는다. 지연 중인 연결이 남아 있으면 toxic 삭제가 막히므로 프록시째 지우고 다시 만든다. */
    public static synchronized void healProxy() {
        start();
        try {
            proxy.delete();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
        createProxy();
    }
}
