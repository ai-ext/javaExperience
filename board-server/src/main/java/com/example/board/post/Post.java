package com.example.board.post;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import com.example.board.common.BaseEntity;
import com.example.board.member.Member;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "post")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 5000)
    private String content;

    // ORDINAL이면 enum 중간에 값을 끼울 때 기존 행의 의미가 바뀐다
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private PostStatus status;

    @Column(name = "like_count", nullable = false)
    private int likeCount;

    @OneToMany(mappedBy = "post", cascade = CascadeType.PERSIST, orphanRemoval = true)
    private List<PostTag> postTags = new ArrayList<>();

    private Post(Member member, String title, String content) {
        this.member = member;
        this.title = title;
        this.content = content;
        this.status = PostStatus.ACTIVE;
    }

    public static Post create(Member member, String title, String content) {
        return new Post(member, title, content);
    }

    public void addTag(Tag tag) {
        postTags.add(PostTag.create(this, tag));
    }

    public void update(String title, String content) {
        this.title = title;
        this.content = content;
    }

    /** null인 인자는 바꾸지 않는다. */
    public void patch(String title, String content) {
        if (title != null) {
            this.title = title;
        }
        if (content != null) {
            this.content = content;
        }
    }

    /** 겹치는 태그는 그대로 두고 차이만 반영한다. 지우고 다시 넣으면 INSERT가 DELETE보다 먼저 나가 UNIQUE에 걸린다. */
    public void replaceTags(List<Tag> tags) {
        Set<Tag> wanted = new HashSet<>(tags);
        postTags.removeIf(pt -> !wanted.contains(pt.getTag()));
        wanted.removeAll(postTags.stream().map(PostTag::getTag).toList());
        tags.stream().filter(wanted::contains).forEach(this::addTag);
    }

    public void delete() {
        this.status = PostStatus.DELETED;
    }

    public boolean isWrittenBy(Long memberId) {
        return member.getId().equals(memberId);
    }
}
