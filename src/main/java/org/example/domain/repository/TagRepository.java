package org.example.domain.repository;

import org.example.domain.entity.TagsEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagRepository extends JpaRepository<TagsEntity, Long> {

}
