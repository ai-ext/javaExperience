package org.example.service;

import jakarta.transaction.Transactional;
import org.example.domain.PostEntity;
import org.example.domain.PostRepository;
import org.example.dto.ChangeHeartDto;
import org.example.dto.CommonResponseDto;
import org.example.dto.ListResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ListService {

    private final PostRepository postRepository;

    public ListService(PostRepository postRepository){
        this.postRepository=postRepository;
    }

    @Transactional
    public Page<PostEntity> getList(Pageable page){

        Page<PostEntity> list = postRepository.findAll(page);

        return list;
    }

    @Transactional
    public ListResponseDto getDetail(int detailId){

        Optional<PostEntity> postEntity = postRepository.findById(detailId);

        ListResponseDto detailData = new ListResponseDto(postEntity.get());

        return detailData;
    }

    @Transactional
    public CommonResponseDto<?> changeHeart (ChangeHeartDto changeHeartDto){
        Optional<PostEntity> data = postRepository.findById(changeHeartDto.getId());

        if(data.isEmpty()){
            return new CommonResponseDto(500, "실패", null);
        }

        // 지금 하려던게 조회는 했으니까 수정해야되고

        Boolean heart2 = !(data.get().getLike() == null ? true : false);

        data.get().setHeart(heart2);

        postRepository.save(data.get());

        return new CommonResponseDto<>(200,"성공",null);
    }
}


//const aa = data.g