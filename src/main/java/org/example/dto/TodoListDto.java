package org.example.dto;

import org.example.domain.entity.TodoListEntity;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

public class TodoListDto {
    public int id;
    public String title;
    public Boolean isFinish;
    public String name;
    public LocalDate createAt;
    public LocalDate updateAt;
    public boolean isDelete;

    public TodoListDto (TodoListEntity todoListEntity){
        this.id = todoListEntity.getId();
        this.title = todoListEntity.getTitle();
        this.isFinish = todoListEntity.getIsFinish();
        this.name = todoListEntity.getName();
        this.createAt = todoListEntity.getCreateAt();
        this.updateAt = todoListEntity.getUpdateAt();
        this.isDelete = todoListEntity.getIsDelete();
    }

}
