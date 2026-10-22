package com.example.javatrack.j05;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.ConcurrentModificationException;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

/** 주제 과제: 엔티티 목록을 DTO 목록으로(for → stream), 사용 가능한 쿠폰 거르기, Optional, 리스트에서 지우기. */
class J05DtoMappingTest {

    private static final List<Post> POSTS = List.of(
            new Post(1L, "첫 글", "자바초보", 3, PostStatus.ACTIVE, List.of("java", "spring")),
            new Post(2L, "지운 글", "자바초보", 9, PostStatus.DELETED, List.of("java")),
            new Post(3L, "셋째 글", "스프링입문", 5, PostStatus.ACTIVE, List.of()));

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 22);

    @Test
    void 엔티티_목록을_DTO_목록으로_바꾸며_삭제된_글은_뺀다() {
        List<PostResponse> responses = PostMapper.toResponsesWithFor(POSTS);

        assertThat(responses).containsExactly(
                new PostResponse(1, "첫 글", "자바초보", 2),
                new PostResponse(3, "셋째 글", "스프링입문", 0));
    }

    @Test
    void for와_stream이_같은_결과를_낸다() {
        assertThat(PostMapper.toResponsesWithStream(POSTS)).isEqualTo(PostMapper.toResponsesWithFor(POSTS));
        assertThat(PostMapper.toResponsesWithStream(List.of())).isEmpty();
    }

    @Test
    void PostResponse_from은_엔티티에서_필요한_값만_꺼내_담는다() {
        PostResponse response = PostResponse.from(POSTS.get(0));

        assertThat(response.id()).isEqualTo(1);
        assertThat(response.author()).isEqualTo("자바초보");
        assertThat(response.tagCount()).isEqualTo(2);
    }

    @Test
    void 사용_가능한_쿠폰은_미사용이고_만료_전이고_최소_주문_금액을_넘는_것이다() {
        List<MemberCoupon> coupons = List.of(
                new MemberCoupon(1, "웰컴", CouponStatus.UNUSED, TODAY.plusDays(7), 0),
                new MemberCoupon(2, "이미 씀", CouponStatus.USED, TODAY.plusDays(7), 0),
                new MemberCoupon(3, "어제 만료", CouponStatus.UNUSED, TODAY.minusDays(1), 0),
                new MemberCoupon(4, "3만원 이상", CouponStatus.UNUSED, TODAY.plusDays(7), 30_000),
                new MemberCoupon(5, "2만원 이상", CouponStatus.UNUSED, TODAY.plusDays(7), 20_000));

        assertThat(CouponFinder.usable(coupons, 20_000, TODAY))
                .extracting(MemberCoupon::id)
                .containsExactly(1L, 5L);
    }

    @Test
    void 만료일_당일까지는_쓸_수_있다() {
        List<MemberCoupon> coupons = List.of(new MemberCoupon(1, "오늘까지", CouponStatus.UNUSED, TODAY, 0));

        assertThat(CouponFinder.usable(coupons, 10_000, TODAY)).hasSize(1);
        assertThat(CouponFinder.usable(coupons, 10_000, TODAY.plusDays(1))).isEmpty();
    }

    @Test
    void id로_찾으면_Optional로_돌려주고_없으면_빈_Optional이다() {
        List<MemberCoupon> coupons = List.of(new MemberCoupon(7, "웰컴", CouponStatus.UNUSED, TODAY, 0));

        Optional<MemberCoupon> found = CouponFinder.findById(coupons, 7);
        Optional<MemberCoupon> missing = CouponFinder.findById(coupons, 8);

        assertThat(found).map(MemberCoupon::name).contains("웰컴");
        assertThat(missing).isNotNull().isEmpty();
    }

    @Test
    void 함정_향상된_for_안에서_remove하면_ConcurrentModificationException_removeIf는_안전하다() {
        List<MemberCoupon> leakyTarget = new ArrayList<>(List.of(
                new MemberCoupon(1, "이미 씀", CouponStatus.USED, TODAY, 0),
                new MemberCoupon(2, "웰컴", CouponStatus.UNUSED, TODAY, 0),
                new MemberCoupon(3, "생일", CouponStatus.UNUSED, TODAY, 0)));
        List<MemberCoupon> target = new ArrayList<>(leakyTarget);

        // for는 내부에서 Iterator를 쓴다. 돌던 리스트가 바뀐 것을 다음 차례에 알아채고 예외를 던진다
        assertThatThrownBy(() -> LeakyCouponCleaner.removeUsed(leakyTarget))
                .isInstanceOf(ConcurrentModificationException.class);

        CouponFinder.removeUsed(target);

        assertThat(target).extracting(MemberCoupon::id).containsExactly(2L, 3L);
    }
}
