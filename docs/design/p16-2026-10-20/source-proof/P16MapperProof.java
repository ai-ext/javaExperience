package example.proof;

import java.time.*;
import java.util.*;
import com.fasterxml.jackson.annotation.*;
import tools.jackson.databind.*;
import tools.jackson.databind.json.JsonMapper;

/** 원문 P16 규칙을 추가 입력으로 확인한다. Boot/MVC/DB 실행이 아니다. */
public class P16MapperProof {
    record UserResponse(@JsonProperty("user_id") Long id,
                        @JsonProperty("display_name") String name) {}
    record AccountResponse(Long id, String name,
        @JsonInclude(JsonInclude.Include.NON_NULL) String nickname,
        @JsonIgnore String passwordHash) {}
    record EventResponse(Instant occurredAt, LocalDate dueDate) {}
    record LocalEvent(LocalDateTime at) {}
    enum OrderStatus { READY, PAID, CANCELLED }
    record OrderResponse(OrderStatus status) {}
    enum PaymentStatus {
        @JsonProperty("paid") PAID,
        @JsonProperty("refunded") REFUNDED
    }
    record PaymentResponse(PaymentStatus status) {}
    record EmailCommand(String email) {}
    @JsonIgnoreProperties(ignoreUnknown=true)
    record ExternalWebhook(String eventId, String type) {}
    record Quantity(int quantity) {}
    record NullableQuantity(Integer quantity) {}
    static final class ImmutableName {
        private final String name;
        @JsonCreator ImmutableName(@JsonProperty("name") String name) { this.name=name; }
        public String getName() { return name; }
    }
    static void check(String name, boolean condition) {
        if(!condition) throw new AssertionError(name);
        System.out.println("PASS " + name);
    }
    static boolean rejected(Runnable action) {
        try { action.run(); return false; } catch (tools.jackson.core.JacksonException expected) { return true; }
    }
    public static void main(String[] args) {
        JsonMapper mapper=JsonMapper.builder().build();
        String renamed=mapper.writeValueAsString(new UserResponse(7L,"Mina"));
        check("property-out",mapper.readTree(renamed).get("user_id").asLong()==7 && mapper.readTree(renamed).get("display_name").asString().equals("Mina") && !mapper.readTree(renamed).has("id"));
        UserResponse read=mapper.readValue("{\"user_id\":7,\"display_name\":\"Mina\"}",UserResponse.class);
        check("property-in",read.equals(new UserResponse(7L,"Mina")));
        String accountNull=mapper.writeValueAsString(new AccountResponse(7L,"Mina",null,"hash-demo"));
        check("non-null-omits-null",!mapper.readTree(accountNull).has("nickname"));
        String accountEmpty=mapper.writeValueAsString(new AccountResponse(7L,"Mina","","hash-demo"));
        check("non-null-keeps-empty",mapper.readTree(accountEmpty).has("nickname") && mapper.readTree(accountEmpty).get("nickname").asString().isEmpty());
        check("ignore-output",!mapper.readTree(accountEmpty).has("passwordHash"));
        AccountResponse ignored=mapper.readValue("{\"id\":7,\"name\":\"Mina\",\"nickname\":null,\"passwordHash\":\"supplied\"}",AccountResponse.class);
        check("ignore-input",ignored.passwordHash()==null);
        String event=mapper.writeValueAsString(new EventResponse(Instant.parse("2026-09-29T00:00:00Z"),LocalDate.parse("2026-09-29")));
        check("instant-iso",mapper.readTree(event).get("occurredAt").asString().equals("2026-09-29T00:00:00Z"));
        check("local-date",mapper.readTree(event).get("dueDate").asString().equals("2026-09-29"));
        String local=mapper.writeValueAsString(new LocalEvent(LocalDateTime.parse("2026-09-29T09:00:00")));
        check("local-no-offset",mapper.readTree(local).get("at").asString().equals("2026-09-29T09:00:00"));
        check("offset-same-instant",OffsetDateTime.parse("2026-09-29T09:00:00+09:00").toInstant().equals(Instant.parse("2026-09-29T00:00:00Z")));
        check("enum-default-out",mapper.readTree(mapper.writeValueAsString(new OrderResponse(OrderStatus.PAID))).get("status").asString().equals("PAID"));
        check("enum-contract-out",mapper.readTree(mapper.writeValueAsString(new PaymentResponse(PaymentStatus.PAID))).get("status").asString().equals("paid"));
        check("enum-contract-in",mapper.readValue("{\"status\":\"paid\"}",PaymentResponse.class).status()==PaymentStatus.PAID);
        check("enum-unknown-reject",rejected(()->mapper.readValue("{\"status\":\"PENDING\"}",OrderResponse.class)));
        check("unknown-default-false",!mapper.isEnabled(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES));
        EmailCommand typo=mapper.readValue("{\"emial\":\"m@example.com\"}",EmailCommand.class);
        check("unknown-default-typo",typo.email()==null);
        JsonMapper strict=JsonMapper.builder().enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build();
        check("unknown-strict-reject",rejected(()->strict.readValue("{\"emial\":\"m@example.com\"}",EmailCommand.class)));
        ExternalWebhook webhook=strict.readValue("{\"eventId\":\"evt-1\",\"type\":\"paid\",\"extra\":true}",ExternalWebhook.class);
        check("unknown-dto-exception",webhook.eventId().equals("evt-1") && webhook.type().equals("paid"));
        check("null-primitive-reject",rejected(()->mapper.readValue("{\"quantity\":null}",Quantity.class)));
        check("null-wrapper-allowed",mapper.readValue("{\"quantity\":null}",NullableQuantity.class).quantity()==null);
        check("immutable-creator",mapper.readValue("{\"name\":\"Mina\"}",ImmutableName.class).getName().equals("Mina"));
        check("immutable-getter-output",mapper.readTree(mapper.writeValueAsString(new ImmutableName("Mina"))).get("name").asString().equals("Mina"));
        check("object-key-order",mapper.readTree("{\"id\":1,\"name\":\"Mina\"}").equals(mapper.readTree("{\"name\":\"Mina\",\"id\":1}")));
        check("array-order",!mapper.readTree("[1,2]").equals(mapper.readTree("[2,1]")));
        System.out.println("RENAMED " + renamed);
        System.out.println("ACCOUNT_NULL " + accountNull);
        System.out.println("ACCOUNT_EMPTY " + accountEmpty);
        System.out.println("EVENT " + event);
        System.out.println("LOCAL " + local);
    }
}
