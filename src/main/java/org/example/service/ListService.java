package org.example.service;

import jakarta.transaction.Transactional;
import org.example.domain.PostEntity;
import org.example.domain.PostRepository;
import org.example.dto.ListResponseDto;
import org.example.dto.PostRequestDto;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ListService {


    private final PostRepository postRepository;

    public ListService(PostRepository postRepository){
        this.postRepository=postRepository;
    }

    @Transactional
    public List<PostEntity> getList(){

        List<PostEntity> list = postRepository.findAll();

        return list;
    }
}
