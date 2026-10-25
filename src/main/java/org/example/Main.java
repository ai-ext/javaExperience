package org.example;

import com.company.totaladmin.TotalAdminApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// @SpringBootConfiguration + @EnableAutoConfiguration + @ComponentScan 을 합친 어노테이션
// 이 클래스가 있는 org.example 패키지와 하위 패키지가 컴포넌트 스캔 대상이 된다
@SpringBootApplication
public class Main {
    public static void main(String[] args) {
        TotalAdminApplication.main(args);
    }
}
