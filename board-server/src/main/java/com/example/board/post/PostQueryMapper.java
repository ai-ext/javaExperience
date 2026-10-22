package com.example.board.post;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/** 목록·검색 전용 읽기 매퍼. 쓰기는 JPA가 맡는다. */
@Mapper
public interface PostQueryMapper {

    /** afterId가 null이면 첫 쪽이다. 항상 id DESC(latest)이다. */
    List<PostSummary> search(@Param("cond") PostSearchCondition cond, @Param("afterId") Long afterId,
            @Param("limit") int limit);

    /** ACTIVE 글을 좋아요 내림차순(같으면 최신 먼저)으로 limit개. */
    List<PostSummary> findPopular(@Param("limit") int limit);
}
