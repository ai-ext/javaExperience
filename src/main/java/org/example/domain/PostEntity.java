package org.example.domain;

import jakarta.persistence.*;

import java.util.List;

@Table(name="post_txt")
@Entity
public class PostEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column
    private String boardSlug;

    @Column
    private String title;

    @Column
    private String content;

    @Column
    private List<String> tags;

    @Column
    private String visibility;

    @Column
    private Boolean heart;

    public PostEntity(){};

    public PostEntity(String boardSlug, String title,String content, List<String> tags, String visibility){
        this.boardSlug=boardSlug;
        this.title=title;
        this.content=content;
        this.tags=tags;
        this.visibility=visibility;
    }

    public int getId(){
        return this.id;
    }

    public String getBoardSlug(){
        return this.boardSlug;
    }

    public String getTitle(){
        return this.title;
    }

    public String getContent(){
        return this.content;
    }

    public List<String> getTags(){
        return this.tags;
    }

    public String getVisibility(){
        return this.visibility;
    }

    public Boolean getLike(){
        return this.heart;
    }


    public void setHeart(Boolean isHeart){
        this.heart=isHeart;
    }
}
