package example.proof;

import java.time.Instant;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.json.JsonMapper;

/** 원문 §3.2 타입·반환식을 사용한 독립 MockMvc 실험. 실제 포트/Boot/DB는 없다. */
public class P16MvcProof {
    record CreateOrderRequest(String product,int quantity) {}
    record OrderResponse(long id,String product,int quantity,Instant createdAt) {}
    @RestController @RequestMapping("/orders")
    static class OrderController {
        int calls;
        @PostMapping OrderResponse create(@RequestBody CreateOrderRequest request) {
            calls++;
            return new OrderResponse(1L,request.product(),request.quantity(),Instant.parse("2026-09-29T00:00:00Z"));
        }
    }
    static void check(String name,boolean ok) { if(!ok)throw new AssertionError(name);System.out.println("PASS "+name); }
    public static void main(String[] args)throws Exception {
        OrderController controller=new OrderController();
        JsonMapper mapper=JsonMapper.builder().build();
        MockMvc mvc=MockMvcBuilders.standaloneSetup(controller).setMessageConverters(new JacksonJsonHttpMessageConverter(mapper)).build();
        String valid="{\"product\":\"keyboard\",\"quantity\":2}";
        MvcResult good=mvc.perform(MockMvcRequestBuilders.post("/orders").contentType(MediaType.APPLICATION_JSON).accept(MediaType.APPLICATION_JSON).content(valid)).andReturn();
        check("normal-200",good.getResponse().getStatus()==200);
        check("normal-body",mapper.readTree(good.getResponse().getContentAsString()).equals(mapper.readTree("{\"id\":1,\"product\":\"keyboard\",\"quantity\":2,\"createdAt\":\"2026-09-29T00:00:00Z\"}")));
        check("normal-controller-called",controller.calls==1);
        MvcResult invalid=mvc.perform(MockMvcRequestBuilders.post("/orders").contentType(MediaType.APPLICATION_JSON).content("{\"product\":\"keyboard\",\"quantity\":\"two\"}")).andReturn();
        check("bad-number-400",invalid.getResponse().getStatus()==400 && invalid.getResolvedException() instanceof org.springframework.http.converter.HttpMessageNotReadableException);
        check("bad-number-no-controller",controller.calls==1);
        MvcResult text=mvc.perform(MockMvcRequestBuilders.post("/orders").contentType(MediaType.TEXT_PLAIN).content(valid)).andReturn();
        check("text-415",text.getResponse().getStatus()==415);
        check("text-no-controller",controller.calls==1);
        MvcResult missing=mvc.perform(MockMvcRequestBuilders.post("/orders").content(valid)).andReturn();
        check("no-content-type-415",missing.getResponse().getStatus()==415);
        check("no-content-type-no-controller",controller.calls==1);
        MvcResult accept=mvc.perform(MockMvcRequestBuilders.post("/orders").contentType(MediaType.APPLICATION_JSON).accept(MediaType.APPLICATION_XML).content(valid)).andReturn();
        check("accept-xml-406",accept.getResponse().getStatus()==406);
        check("accept-xml-controller-already-called",controller.calls==2);
        System.out.println("NORMAL_BODY "+good.getResponse().getContentAsString());
    }
}
