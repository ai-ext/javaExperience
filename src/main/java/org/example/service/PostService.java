package org.example.service;

import jakarta.transaction.Transactional;
import org.example.domain.PostEntity;
import org.example.domain.PostRepository;
import org.example.dto.PostRequestDto;
import org.springframework.stereotype.Service;

@Service
public class PostService {

    private final PostRepository postRepository;

    public PostService(PostRepository postRepository){
        this.postRepository=postRepository;
    }

    @Transactional
    public String postSave(PostRequestDto requestDto){

        PostEntity postEntity  = new PostEntity(requestDto.getBoardSlug(), requestDto.getTitle(), requestDto.getContent(), requestDto.getTags(), requestDto.getVisibility());

        postRepository.save(postEntity);

        return "success";
    }
}
