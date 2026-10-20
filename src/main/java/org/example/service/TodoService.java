package org.example.service;

import org.example.domain.repository.TodoRepository;
import org.example.domain.entity.TodoListEntity;
import org.example.dto.TodoListDto;
import org.example.dto.TodoRequestDto;
import org.example.global.StatusEnum;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.example.global.StatusEnum.*;

@Service
public class TodoService {
    private final TodoRepository todoRepository;

    public TodoService (TodoRepository todoRepository){
        this.todoRepository= todoRepository;
    }

    public List<TodoListDto> getTodoList(){
        List<TodoListDto> list = new ArrayList<TodoListDto>();

        List<TodoListEntity> todoList = todoRepository.findAllByIsDeleteFalse();
        for(int i = 0; i<todoList.size(); i++){
            list.add(new TodoListDto(todoList.get(i)));
        }
        return list;
    }

    public void postTodo(TodoRequestDto todoRequestDto){
        todoRepository.save(new TodoListEntity(todoRequestDto));
    }

    public void updateTodo(int id, TodoRequestDto todoRequestDto) {
        Optional<TodoListEntity> todoDetail = todoRepository.findById(id);
        if(todoDetail.isEmpty()){
            throw new IllegalArgumentException(PARAMETER_MESSAGE.getMessage());
        }
        TodoListEntity todoListEntity = todoDetail.get();

        todoListEntity.updateEntity(todoRequestDto);
        todoRepository.save(todoListEntity);

    }


    public void deleteTodo(int id) {
        Optional<TodoListEntity> todoDetail = todoRepository.findById(id);
        if(todoDetail.isEmpty()){
            throw new IllegalArgumentException(PARAMETER_MESSAGE.getMessage());
        }

        TodoListEntity todoListEntity = todoDetail.get();
        todoListEntity.setIsDelete(true);

        todoRepository.save(todoListEntity);

    }
}
