package com.example.board.point;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/** 포인트 이력 읽기 전용 매퍼. 쓰기는 PointService(JPA)가 맡는다. */
@Mapper
public interface PointHistoryMapper {

    /** afterId가 null이면 첫 쪽이다. 항상 id DESC이다. */
    List<PointHistoryItem> findByMember(@Param("memberId") Long memberId, @Param("afterId") Long afterId,
            @Param("limit") int limit);
}
