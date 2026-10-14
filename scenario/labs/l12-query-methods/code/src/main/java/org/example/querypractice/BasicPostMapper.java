package org.example.querypractice;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface BasicPostMapper {
    QueryPostRow detail(@Param("id") long id);
    List<QueryPostRow> list(@Param("board") String board, @Param("author") Long author,
                           @Param("pattern") String pattern, @Param("limit") int limit, @Param("offset") long offset);
    long count(@Param("board") String board, @Param("author") Long author, @Param("pattern") String pattern);
    boolean exists(@Param("id") long id);
}
