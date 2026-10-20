package org.example.dto;

import org.example.domain.entity.PostEntity;
import org.example.domain.entity.TagsEntity;

import java.util.List;
import java.util.stream.Collectors;

public class PostResponseDto {

    public int id;
    public String boardSlug;
    public String title;
    public String content;
    public String visibility;
    public boolean like;
    public List<String> tags;

    public PostResponseDto(int id, String boardSlug, String title, String content, String visibility, boolean like){
        this.id =id;
        this.boardSlug =boardSlug;
        this.title =title;
        this.content =content;
        this.visibility =visibility;
        this.like =like;

    }

    public PostResponseDto(PostEntity postEntity){
        this.id=postEntity.getId();
        this.boardSlug=postEntity.getBoardSlug();
        this.title=postEntity.getTitle();
        this.content=postEntity.getContent();
        this.tags=postEntity.getTags().stream().map(TagsEntity::getTitle).collect(Collectors.toList());
        this.visibility=postEntity.getVisibility();
        this.like=postEntity.getLike();

    }
}
