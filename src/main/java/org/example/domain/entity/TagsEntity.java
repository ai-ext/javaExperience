package org.example.domain.entity;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Table(name="tag")
@Entity
public class TagsEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title")
    private String title;

    public String getTitle (){
        return this.title;
    }

    public TagsEntity(String title){
        this.title = title;
    }
}
