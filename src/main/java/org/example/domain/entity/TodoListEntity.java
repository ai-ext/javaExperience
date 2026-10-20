package org.example.domain.entity;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;
import org.example.dto.TodoRequestDto;

import java.time.LocalDate;

@NoArgsConstructor
@Entity
public class TodoListEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "title", length = 30, nullable = false)
    private String title;

    @Column(name = "is_finish")
    private boolean isFinish;

    @Column(name = "name")
    private String name;

    @Column(name = "create_at", nullable = false)
    private LocalDate createAt;

    @Column(name = "update_at")
    private LocalDate updateAt;

    @Column(name = "is_delete", nullable = false, columnDefinition =  "BOOLEAN DEFAULT FALSE")
    private boolean isDelete = false;

    public Integer getId(){
        return this.id;
    }

    public String getTitle(){
        return this.title;
    }

    public Boolean getIsFinish(){
        return this.isFinish;
    }

    public String getName(){
        return this.name;
    }

    public LocalDate getCreateAt(){
        return this.createAt;
    }

    public LocalDate getUpdateAt(){
        return this.updateAt;
    }

    public Boolean getIsDelete(){
        return this.isDelete;
    }

    public void setIsDelete(Boolean deleteValue){
        this.isDelete = deleteValue;
    }


    public TodoListEntity(TodoRequestDto todoRequestDto){
       this.title = todoRequestDto.getTitle();
       this.isFinish = todoRequestDto.getIsFinish();
       this.name = todoRequestDto.getName();
       this.createAt = LocalDate.now();
    }

    public void updateEntity(TodoRequestDto todoRequestDto){
       this.title = todoRequestDto.getTitle();
       this.name = todoRequestDto.getName();
       this.isFinish = todoRequestDto.getIsFinish();
       this.updateAt = LocalDate.now();
    }


}
