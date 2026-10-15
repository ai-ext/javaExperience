package org.example.dto;

import org.example.domain.PostEntity;

import java.util.List;

public class ListResponseDto {

    public int id;
    public String boardSlug;
    public String title;
    public String content;
    public String visibility;
    public boolean like;
    public List<String> tags;

    public ListResponseDto(int id, String boardSlug, String title, String content, String visibility, boolean like){
        this.id =id;
        this.boardSlug =boardSlug;
        this.title =title;
        this.content =content;
        this.visibility =visibility;
        this.like =like;

    }

    public ListResponseDto(PostEntity postEntity){
        this.id=postEntity.getId();
        this.boardSlug=postEntity.getBoardSlug();
        this.title=postEntity.getTitle();
        this.content=postEntity.getContent();
        this.tags=postEntity.getTags();
        this.visibility=postEntity.getVisibility();
        this.tags=postEntity.getTags();
        this.like=postEntity.getLike();

    }
}
