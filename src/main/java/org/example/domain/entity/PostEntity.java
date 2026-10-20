package org.example.domain.entity;

import jakarta.persistence.*;

import java.util.List;

@Table(name="post_txt")
@Entity
public class PostEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "board_slug")
    private String boardSlug;

    @Column(name = "title")
    private String title;

    @Column(name = "content")
    private String content;

    @OneToMany()
    @JoinColumn(name = "post_id")
    private List<TagsEntity> tags;

    @Column(name = "visibility")
    private String visibility;

    @Column(name = "heart")
    private boolean heart;

    public PostEntity(){};

    public PostEntity(String boardSlug, String title,String content, List<TagsEntity> tags, String visibility){
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

    public List<TagsEntity> getTags(){
        return this.tags;
    }

    public String getVisibility(){
        return this.visibility;
    }

    public boolean getLike(){
        return this.heart;
    }

}
