package org.example.dto;

import java.util.List;


public class PostCreateRequestDto {
    public String boardSlug;
    public String title;
    public String content;
    public List<String> tags;
    public String visibility;

    public PostCreateRequestDto(){}

    public PostCreateRequestDto(String boardSlug,
                          String title,
                          String content,
                          List<String> tags,
                          String visibility){
        this.boardSlug=boardSlug;
        this.title=title;
        this.content=content;
        this.tags=tags;
        this.visibility=visibility;
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



}


