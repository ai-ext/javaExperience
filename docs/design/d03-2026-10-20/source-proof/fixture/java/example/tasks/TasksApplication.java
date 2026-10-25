package example.tasks;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// 원문에서 Initializr가 제공한다고 가정한 bootstrap을 추가 실험에만 둔다.
@SpringBootApplication
public class TasksApplication {
    public static void main(String[] args) {
        SpringApplication.run(TasksApplication.class, args);
    }
}
