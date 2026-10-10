package org.example.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.example.domain.PostEntity;
import org.example.dto.ChangeHeartDto;
import org.example.dto.CommonResponseDto;
import org.example.dto.ListResponseDto;
import org.example.dto.PostRequestDto;
import org.example.service.ListService;
import org.example.service.PostService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
    public CommonResponseDto<Void> response(@RequestHeader(name="hi") @RequestBody PostRequestDto params){


        if(params.title.length() <5){
            return new CommonResponseDto<>(401, "제목은 5글자 이상입니다.", null);
        }
        int status = 200;

        postService.postSave(params);

        return new CommonResponseDto<>(200, "success", null);
    }
    // TODO 여러건 조회
    @GetMapping("/api/list")
    public CommonResponseDto<List<ListResponseDto>> listResponse (@PageableDefault(
                                                                    page = 1,
                                                                    size = 10,
                                                                    direction = Sort.Direction.ASC) Pageable pageable){
        Pageable page = PageRequest.of(pageable.getPageNumber()-1,pageable.getPageSize());
        Page<PostEntity> list = listService.getList(page);
//
//        List<ListResponseDto> listResponseDtos = new ArrayList<>();
//        for(int i=0; i<list.size(); i++){
//            listResponseDtos.add(new ListResponseDto(list.get(i)));
//        }
        return new CommonResponseDto(200, "성공", list);
    }

    //TODO 단건 조회 ex api/list/1 api/list/2
    @GetMapping("/api/detail/{detailId}")
    public CommonResponseDto<?> getDetail (@PathVariable int detailId){
        ListResponseDto detailContents = listService.getDetail(detailId);
        return new CommonResponseDto<>(200, "성공", detailContents);
    }

    //TODO 단건 좋아요 heart를 false -> true\ true면 false로 바꾸기 좋아요 2번이면 안눌리게 ,
    @PutMapping("/api/changeHeart")
    public CommonResponseDto<?> changeHeart (@RequestBody ChangeHeartDto changeHeartDto){

        return listService.changeHeart(changeHeartDto);
    }

    //TODO 단건 수정
//
//    crud
//
//    c -> 생성
//
//    r -> 조회
//    update -> 조회, 값바꾸기, 저장하기 (본문을 바꾸겠다 -> content를 바꾸거나, 좋아요 )
//    delete -> 조회, 값바꾸기, 저장하기 (updateYn = false -> true) \ 조회해서 삭제할 수 있고
}
