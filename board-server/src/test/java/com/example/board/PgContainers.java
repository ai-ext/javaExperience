package com.example.board;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;

import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.toxiproxy.ToxiproxyContainer;
import org.testcontainers.utility.MountableFile;

import eu.rekawek.toxiproxy.Proxy;
import eu.rekawek.toxiproxy.ToxiproxyClient;
import eu.rekawek.toxiproxy.model.Toxic;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * PG 모의(WireMock)와 그 앞단 Toxiproxy. JVM 안에서 한 번만 띄워 모든 테스트가 같이 쓴다.
 * 서버는 Toxiproxy를 거쳐 WireMock에 닿으므로 지연·연결 끊김을 주입할 수 있다.
 */
public final class PgContainers {

    private static final int PROXY_PORT = 8666;
    private static final Network NETWORK = Network.newNetwork();
    private static final GenericContainer<?> WIREMOCK = new GenericContainer<>("wiremock/wiremock:3.13.1")
            .withNetwork(NETWORK)
            .withNetworkAliases("wiremock")
            .withExposedPorts(8080)
            .withCopyFileToContainer(MountableFile.forClasspathResource("wiremock"), "/home/wiremock")
            .waitingFor(Wait.forHttp("/__admin/mappings").forStatusCode(200));
    private static final ToxiproxyContainer TOXIPROXY = new ToxiproxyContainer("ghcr.io/shopify/toxiproxy:2.12.0")
            .withNetwork(NETWORK);
    private static final HttpClient HTTP = HttpClient.newHttpClient();
    private static final JsonMapper JSON = JsonMapper.builder().build();

    private static Proxy proxy;

    private PgContainers() {
    }

    public static synchronized void start() {
        if (proxy != null) {
            return;
        }
        WIREMOCK.start();
        TOXIPROXY.start();
        try {
            proxy = new ToxiproxyClient(TOXIPROXY.getHost(), TOXIPROXY.getControlPort())
                    .createProxy("pg", "0.0.0.0:" + PROXY_PORT, "wiremock:8080");
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    /** 서버가 쓰는 PG 주소(Toxiproxy 경유). */
    public static String baseUrl() {
        start();
        return "http://" + TOXIPROXY.getHost() + ":" + TOXIPROXY.getMappedPort(PROXY_PORT);
    }

    public static Proxy proxy() {
        start();
        return proxy;
    }

    /** 테스트마다 지연 주입·임시 스텁·요청 기록을 지우고 파일 스텁만 남긴다. */
    public static void reset() {
        start();
        try {
            for (Toxic toxic : proxy.toxics().getAll()) {
                toxic.remove();
            }
            proxy.enable();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
        admin("POST", "/__admin/reset", "");
    }

    /** WireMock 스텁 JSON을 등록한다. 파일 스텁보다 먼저 맞도록 priority를 낮게 준다. */
    public static void stub(String mappingJson) {
        admin("POST", "/__admin/mappings", mappingJson);
    }

    /** 승인을 millis만큼 늦게 DONE으로 돌려준다. paymentKey는 파일 스텁과 같은 규칙(pk-{orderId})이다. */
    public static void stubApproveDelay(int millis) {
        stub("""
                {"priority":1,"request":{"method":"POST","urlPath":"/pg/v1/payments"},
                 "response":{"status":200,"fixedDelayMilliseconds":%d,"headers":{"Content-Type":"application/json"},
                  "body":"{\\"paymentKey\\":\\"pk-{{jsonPath request.body '$.orderId'}}\\",\\"status\\":\\"DONE\\",\\"amount\\":{{jsonPath request.body '$.amount'}},\\"approvedAt\\":\\"{{now}}\\"}",
                  "transformers":["response-template"]}}
                """.formatted(millis));
    }

    /** GET /pg/v1/payments?orderId= 조회가 DONE을 돌려주게 한다. */
    public static void stubLookupDone(String orderId, int amount) {
        stub("""
                {"priority":1,"request":{"method":"GET","urlPath":"/pg/v1/payments",
                  "queryParameters":{"orderId":{"equalTo":"%s"}}},
                 "response":{"status":200,"headers":{"Content-Type":"application/json"},
                  "jsonBody":{"paymentKey":"pk-%s","status":"DONE","amount":%d,"approvedAt":"2026-10-22T09:30:00+09:00"}}}
                """.formatted(orderId, orderId, amount));
    }

    /** POST /pg/v1/payments 로 받은 요청의 Idempotency-Key 목록(받은 순서). */
    public static List<String> approveIdempotencyKeys() {
        JsonNode found = JSON.readTree(admin("POST", "/__admin/requests/find",
                "{\"method\":\"POST\",\"urlPath\":\"/pg/v1/payments\"}"));
        List<String> keys = new ArrayList<>();
        for (JsonNode r : found.get("requests")) {
            keys.add(r.get("headers").get("Idempotency-Key").asString());
        }
        return keys.reversed();
    }

    public static int approveRequestCount() {
        return approveIdempotencyKeys().size();
    }

    private static String admin(String method, String path, String body) {
        start();
        URI uri = URI.create("http://" + WIREMOCK.getHost() + ":" + WIREMOCK.getMappedPort(8080) + path);
        HttpRequest request = HttpRequest.newBuilder(uri)
                .header("Content-Type", "application/json")
                .method(method, HttpRequest.BodyPublishers.ofString(body))
                .build();
        try {
            HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                throw new IllegalStateException(path + " -> " + response.statusCode() + " " + response.body());
            }
            return response.body();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        }
    }
}
