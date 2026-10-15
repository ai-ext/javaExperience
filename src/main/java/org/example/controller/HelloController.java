package org.example.controller;

import org.example.service.DashboardService;
import org.springframework.web.bind.annotation.*;

// @Controller + @ResponseBody: 반환값을 뷰가 아니라 HTTP 응답 본문으로 내려준다
@CrossOrigin("*")
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

    //TODO



}
