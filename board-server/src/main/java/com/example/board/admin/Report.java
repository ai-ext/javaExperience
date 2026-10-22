package com.example.board.admin;

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
import jakarta.persistence.Table;

import com.example.board.common.BaseEntity;
import com.example.board.member.Member;
import com.example.board.post.Post;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "report")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Report extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id", nullable = false)
    private Member reporter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ReportReason reason;

    @Column(length = 300)
    private String detail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ReportStatus status;

    private Report(Post post, Member reporter, ReportReason reason, String detail) {
        this.post = post;
        this.reporter = reporter;
        this.reason = reason;
        this.detail = detail;
        this.status = ReportStatus.OPEN;
    }

    public static Report create(Post post, Member reporter, ReportReason reason, String detail) {
        return new Report(post, reporter, reason, detail);
    }
}
