package example.tasks;

import java.net.URI;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestController
@RequestMapping("/api/v1/tasks")
class TaskController {
    private final ConcurrentMap<UUID, Task> tasks = new ConcurrentHashMap<>();

    @PostMapping
    ResponseEntity<Task> create(@Valid @RequestBody CreateTask input) {
        Task task = new Task(UUID.randomUUID(), input.title());
        tasks.put(task.id(), task);
        return ResponseEntity.created(URI.create("/api/v1/tasks/" + task.id())).body(task);
    }

    @GetMapping("/{taskId}")
    Task find(@PathVariable UUID taskId) {
        Task task = tasks.get(taskId);
        if (task == null) throw new TaskNotFound(taskId);
        return task;
    }

    record CreateTask(@NotBlank String title) {}
    record Task(UUID id, String title) {}
}

class TaskNotFound extends RuntimeException {
    TaskNotFound(UUID id) { super("Task not found: " + id); }
}

@RestControllerAdvice
class ApiErrors {
    @ExceptionHandler(TaskNotFound.class)
    ProblemDetail notFound(TaskNotFound exception) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, exception.getMessage());
        problem.setType(URI.create("https://api.example.test/problems/task-not-found"));
        problem.setTitle("Task not found");
        return problem;
    }
}
