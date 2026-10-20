package org.example.service;

import jakarta.transaction.Transactional;
import org.example.domain.entity.PostEntity;
import org.example.domain.entity.TagsEntity;
import org.example.domain.repository.PostRepository;
import org.example.domain.repository.TagRepository;
import org.example.dto.PostCreateRequestDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PostService {

    private final PostRepository postRepository;
private final TagRepository tagRepository;

    public PostService(PostRepository postRepository, TagRepository tagRepository){
        this.postRepository=postRepository;
        this.tagRepository=tagRepository;
    }

    @Transactional
    public String createPost(PostCreateRequestDto requestDto){

        List<TagsEntity> tagsEntities = new ArrayList<>();
        for(int i = 0; i < requestDto.getTags().size(); i++){
            tagsEntities.add(new TagsEntity(requestDto.getTags().get(i)));
        }
        PostEntity postEntity  = new PostEntity(requestDto.getBoardSlug(), requestDto.getTitle(), requestDto.getContent(), tagsEntities, requestDto.getVisibility());

        tagRepository.saveAll(tagsEntities);
        postRepository.save(postEntity);

        return "success";
    }

//    @Transactional
    public List<PostEntity> getPosts(){
        List<PostEntity> posts = postRepository.findAll();
        return posts;
    }
}
