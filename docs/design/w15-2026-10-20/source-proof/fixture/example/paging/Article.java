package example.paging;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** 원문이 가정만 제공한 Article을 별도 실험용으로 구현한 entity다. */
@Entity
@Table(name="article")
public class Article {
    @Id
    private Long id;
    @Column(name="published_at",nullable=false)
    private LocalDateTime publishedAt;
    @Column(nullable=false,length=16)
    private String status;
    @Column(nullable=false,length=160)
    private String title;

    protected Article() {}
    public Long getId(){return id;}
    public LocalDateTime getPublishedAt(){return publishedAt;}
    public String getStatus(){return status;}
    public String getTitle(){return title;}
}
