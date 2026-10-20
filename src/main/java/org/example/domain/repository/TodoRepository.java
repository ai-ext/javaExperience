package org.example.domain.repository;

import org.example.domain.entity.TodoListEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TodoRepository extends JpaRepository<TodoListEntity, Integer> {
    List<TodoListEntity> findAllByIsDeleteFalse();
}
