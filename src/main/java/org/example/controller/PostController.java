package org.example.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.example.domain.PostEntity;
import org.example.dto.CommonResponseDto;
import org.example.dto.ListResponseDto;
import org.example.dto.PostRequestDto;
import org.example.service.ListService;
import org.example.service.PostService;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@CrossOrigin("*")
@RestController
public class PostController {

    private final PostService postService;
    private final ListService listService;

    public PostController(PostService postService,
                          ListService listService){

        this.postService=postService;
        this.listService=listService;
    }


    @PostMapping("/api/posts")
    public CommonResponseDto<Void> response(HttpServletRequest request, @RequestHeader(name="hi") @RequestBody PostRequestDto params){


        if(params.title.length() <5){
            return new CommonResponseDto<>(401, "제목은 5글자 이상입니다.", null);
        }
        int status = 200;

        postService.postSave(params);

        return new CommonResponseDto<>(200, "success", null);
    }
    // TODO 여러건 조회
    @GetMapping("/api/lists")
    public CommonResponseDto<List<ListResponseDto>> listReseponse (){

        List<PostEntity> list = listService.getList();

        List<ListResponseDto> listResponseDtos = new ArrayList<>();
        for(int i=0; i<list.size(); i++){
            listResponseDtos.add(new ListResponseDto(list.get(i)));
        }
        return new CommonResponseDto(200, "성공", listResponseDtos);
    }

    //TODO 단건 조회 ex api/list/1 api/list/2
}
