package org.example.dto;

import org.example.domain.entity.TodoListEntity;

import java.time.LocalDate;


public class TodoRequestDto {
    private String title;
    private boolean isFinish;
    private String name;

    public TodoRequestDto() {

    }

    public String getTitle(){return this.title;}

    public boolean getIsFinish(){return this.isFinish;}

    public String getName(){return this.name;}

}
