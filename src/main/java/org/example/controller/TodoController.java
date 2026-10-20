package org.example.controller;

import org.example.dto.CommonResponseDto;
import org.example.dto.TodoListDto;
import org.example.dto.TodoRequestDto;
import org.example.service.TodoService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class TodoController {
    private final TodoService todoService;

    public TodoController (TodoService todoService){
        this.todoService= todoService;
    }


    @GetMapping("/todo/lists")
    public CommonResponseDto<List<TodoListDto>> getTodoList(){
        List<TodoListDto> todoListDto = todoService.getTodoList();
        return new CommonResponseDto<>(200, "성공", todoListDto);
    }

    @PostMapping("/todo/create")
    public CommonResponseDto<?> createTodo(@RequestBody TodoRequestDto todoRequestDto){
        todoService.postTodo(todoRequestDto);

        return new CommonResponseDto<>(200, "성공", null);
    }

    @PutMapping("/todo/update/{id}")
    public CommonResponseDto<?> updateTodo(@PathVariable(name = "id") int id, @RequestBody TodoRequestDto todoRequestDto){
        todoService.updateTodo(id,todoRequestDto);

        return new CommonResponseDto<>(200, "성공", null);
    }

//    @DeleteMapping("/todo/delete/{id}")
//    public CommonResponseDto<?> deleteTodo(@PathVariable(name = "id") int id){
//        todoService.deleteTodo(id);
//
//        return new CommonResponseDto<>(200, "성공", null);
//    }

    @DeleteMapping("/todo/delete/{id}")
    public CommonResponseDto<?> deleteTodo(@PathVariable(name = "id") int id){
        todoService.deleteTodo(id);

        return new CommonResponseDto<>(200, "성공", null);
    }
}
