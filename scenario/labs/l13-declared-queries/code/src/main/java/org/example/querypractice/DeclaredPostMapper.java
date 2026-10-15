package org.example.querypractice;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface DeclaredPostMapper {
    List<QueryPostRow> search(@Param("f") SearchFilter filter);
    long count(@Param("f") SearchFilter filter);
    List<BoardCountRow> boardCounts();
}
