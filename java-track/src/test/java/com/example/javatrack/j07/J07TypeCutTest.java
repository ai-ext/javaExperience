package com.example.javatrack.j07;

import static org.assertj.core.api.Assertions.assertThat;

import java.beans.IntrospectionException;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

/**
 * 타입 한 컷: boolean vs Boolean, is 접두어와 JSON 직렬화 — 응답 필드 이름이 바뀌는 문제.
 * 응답 이름은 JSON 라이브러리(Jackson)가 getter 이름으로 정한다. 이 모듈에는 Jackson이 없으므로 같은 이름 규칙을 쓰는
 * JDK의 JavaBeans 분석기(java.beans.Introspector)로 확인한다. 여기 나오는 getter 모양(getX·boolean isX)에서는 둘의 결과가 같다.
 * <p>
 * 기본 과제는 관찰이다(주어진 delombok 코드를 Introspector로 읽어 본다. 처음부터 통과한다).
 * 이름 규칙을 직접 구현하는 {@link JsonNames}는 선택 과제다(@Tag("optional"), {@code :java-track:optionalTest --tests 'J07*'}).
 */
class J07TypeCutTest {

    private static List<String> beanNames(Class<?> type) throws IntrospectionException {
        return Arrays.stream(Introspector.getBeanInfo(type, Object.class).getPropertyDescriptors())
                .map(PropertyDescriptor::getName)
                .toList();
    }

    @Test
    void 함정_boolean_필드를_isExpired로_지으면_응답_필드는_expired가_된다() throws IntrospectionException {
        // boolean 필드 isExpired의 getter는 isExpired()다. JavaBeans는 getter에서 "is"를 떼어 이름을 만든다.
        // 프런트엔드가 response.isExpired를 읽으면 undefined다
        assertThat(beanNames(LombokCouponResponse.class)).contains("expired").doesNotContain("isExpired");
    }

    @Test
    void 함정_null을_담으려고_Boolean으로만_바꿔도_getIsExpired가_되어_응답_이름이_isExpired로_바뀐다() throws IntrospectionException {
        assertThat(beanNames(WrapperExpiredResponse.class)).containsExactly("isExpired");
    }

    @Test
    void is_다음이_소문자면_접두어가_아니라_issued는_그대로다() throws IntrospectionException {
        // 필드 issued의 getter는 isIssued()다. "is"로 시작한다고 무조건 떼면 "sued"가 된다
        assertThat(beanNames(LombokCouponResponse.class)).contains("issued");
    }

    @Test
    void 약어는_첫_글자를_소문자로_바꾸지_않아_isURL은_URL이_된다() throws IntrospectionException {
        // "is"를 뗀 "URL"은 앞 두 글자가 모두 대문자라 그대로 둔다(Introspector.decapitalize 규칙). "uRL"이 아니다
        assertThat(beanNames(AcronymFlagResponse.class)).containsExactly("URL");
        assertThat(Introspector.decapitalize("URL")).isEqualTo("URL");
        assertThat(Introspector.decapitalize("Expired")).isEqualTo("expired");
    }

    @Test
    @Tag("optional")
    void 선택_getter_이름_규칙대로_필드마다_응답_이름을_구한다() throws IntrospectionException {
        List<String> names = JsonNames.jsonNames(LombokCouponResponse.class);

        // getDeclaredFields는 선언 순서를 보장하지 않으므로 순서 없이 비교한다
        assertThat(names).containsExactlyInAnyOrder("name", "used", "expired", "issued", "isHidden", "autoRenew");
        assertThat(names).containsExactlyInAnyOrderElementsOf(beanNames(LombokCouponResponse.class));
    }

    @Test
    @Tag("optional")
    void 선택_jsonName은_boolean의_is_접두어만_떼고_래퍼와_소문자는_그대로_둔다() throws Exception {
        assertThat(JsonNames.jsonName(LombokCouponResponse.class.getDeclaredField("isExpired"))).isEqualTo("expired");
        assertThat(JsonNames.jsonName(WrapperExpiredResponse.class.getDeclaredField("isExpired"))).isEqualTo("isExpired");
        assertThat(JsonNames.jsonName(LombokCouponResponse.class.getDeclaredField("issued"))).isEqualTo("issued");
    }

    @Test
    @Tag("optional")
    void 선택_jsonName은_약어를_JavaBeans_규칙대로_URL로_남긴다() throws Exception {
        String name = JsonNames.jsonName(AcronymFlagResponse.class.getDeclaredField("isURL"));

        assertThat(name).isEqualTo("URL");
        assertThat(JsonNames.jsonNames(AcronymFlagResponse.class)).containsExactlyElementsOf(beanNames(AcronymFlagResponse.class));
    }
}
