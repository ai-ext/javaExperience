package com.example.board.post;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

/** 목록·검색 전용 읽기 매퍼. 쓰기는 JPA가 맡는다. */
@Mapper
public interface PostQueryMapper {

    List<Long> findLatestIds(int limit);
}
