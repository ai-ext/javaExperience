package org.example.controller;

import ch.qos.logback.core.util.StringUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.example.service.DashboardService;
import org.example.service.ProductService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// @Controller + @ResponseBody: 반환값을 뷰가 아니라 HTTP 응답 본문으로 내려준다
@RestController
public class HelloController {

    private final DashboardService dashboardService;

    public HelloController(DashboardService dashboardService){
        this.dashboardService=dashboardService;
    }

    @GetMapping("/hello")
    public String hello() {
        return "hello";
    }

    // 1페이지 2페이지 게시글 ?  1페이지면 1페이지입니다, 2페이지면 2페이집니다.
    @GetMapping("/dashboard/{page}")
    public String dashboard(@PathVariable int page){
        return String.format("%d 페이지입니다.", page);
    }

    class ResponseDto {

        public int status;
        public String message;

        public ResponseDto(int status, String message){
            this.status = status;
            this.message = message;
        }
    }


    public static class PostRequestDto {
        public String title;
        public String contents;
        public List<String> tags;
        public boolean openStatus;

        public PostRequestDto(){}

        public PostRequestDto(String title,
                              String contents,
                              List<String> tags,
                              boolean openStatus){
            this.title=title;
            this.contents=contents;
            this.tags=tags;
            this.openStatus=openStatus;
        }
    }
    //TODO
    @PostMapping("/api/v1/posts")
    public ResponseDto response(HttpServletRequest request, @RequestHeader(name="hi") @RequestBody PostRequestDto params){


        if(params.title.length() <5){
            return new ResponseDto(401, "제목은 5글자 이상입니다.");
        }
        int status = 200;

        return new ResponseDto(200, "success");
    }

}
