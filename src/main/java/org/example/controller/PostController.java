package org.example.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.example.domain.entity.PostEntity;
import org.example.dto.CommonResponseDto;
import org.example.dto.PostResponseDto;
import org.example.dto.PostCreateRequestDto;
import org.example.service.PostService;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@CrossOrigin("*")
@RestController
public class PostController {

    private final PostService postService;

    public PostController(PostService postService){

        this.postService=postService;
    }


    @PostMapping("/api/posts")
    public CommonResponseDto<Void> createPost(HttpServletRequest request, @RequestHeader(name="hi") @RequestBody PostCreateRequestDto params){


        if(params.title.length() <5){
            return new CommonResponseDto<>(401, "제목은 5글자 이상입니다.", null);
        }
        int status = 200;

        postService.createPost(params);

        return new CommonResponseDto<>(200, "success", null);
    }
    // TODO 여러건 조회
    @GetMapping("/api/lists")
    public CommonResponseDto<List<PostResponseDto>> getPosts(){

        List<PostEntity> posts = postService.getPosts();

        List<PostResponseDto> postResponseDtos = new ArrayList<>();
        for(int i=0; i<posts.size(); i++){
            postResponseDtos.add(new PostResponseDto(posts.get(i)));
        }
        return new CommonResponseDto<>(200, "성공", postResponseDtos);
    }

    //TODO 단건 조회 ex api/list/1 api/list/2
}
