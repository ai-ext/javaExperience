package com.example.javatrack.j02;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.Constructor;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

/** 주제 과제: 예외 계층(BusinessException ← NotFoundException)과 제네릭 Result&lt;T&gt;, static 팩토리와 인스턴스 메서드. */
class J02ResultTest {

    @Test
    void BusinessException은_에러_코드와_메시지를_담는다() {
        BusinessException e = new BusinessException(ErrorCode.DUPLICATE, "이미 가입한 이메일입니다");

        assertThat(e.errorCode()).isEqualTo(ErrorCode.DUPLICATE);
        assertThat(e.getMessage()).isEqualTo("이미 가입한 이메일입니다");
    }

    @Test
    void NotFoundException은_NOT_FOUND와_대상_id를_담은_메시지를_만든다() {
        NotFoundException e = new NotFoundException("글", 42);

        assertThat(e.errorCode()).isEqualTo(ErrorCode.NOT_FOUND);
        assertThat(e.errorCode().status()).isEqualTo(404);
        assertThat(e.getMessage()).isEqualTo("찾을 수 없습니다: 글 id=42");
    }

    @Test
    void NotFoundException은_부모_타입_BusinessException으로_잡힌다() {
        ErrorCode caught = null;
        try {
            // 언체크 예외라 이 메서드에 throws를 적지 않았다
            throw new NotFoundException("회원", 7);
        } catch (BusinessException e) {
            // 자식 예외도 부모 타입 catch에 걸린다. 전역 예외 처리기가 BusinessException 하나만 받으면 되는 이유다
            caught = e.errorCode();
        }

        assertThat(caught).isEqualTo(ErrorCode.NOT_FOUND);
        assertThat(new NotFoundException("회원", 7)).isInstanceOf(RuntimeException.class);
    }

    @Test
    void 성공_결과는_값을_돌려주고_에러_코드는_null이다() {
        Result<String> result = Result.success("첫 글");

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.value()).isEqualTo("첫 글");
        assertThat(result.errorCode()).isNull();
        assertThat(result.message()).isNull();
    }

    @Test
    void 실패_결과는_자식_예외의_에러_코드와_메시지를_담는다() {
        Result<String> result = Result.failure(new NotFoundException("글", 42));

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(ErrorCode.NOT_FOUND);
        assertThat(result.message()).isEqualTo("찾을 수 없습니다: 글 id=42");
    }

    @Test
    void 실패_결과에서_값을_꺼내면_IllegalStateException이_난다() {
        Result<String> result = Result.failure(new BusinessException(ErrorCode.FORBIDDEN, "작성자만 수정할 수 있습니다"));

        assertThatThrownBy(result::value).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void Result는_생성자를_숨기고_static_팩토리로만_만든다() throws NoSuchMethodException {
        Result<Integer> result = Result.success(1);
        assertThat(result.value()).isEqualTo(1);

        assertThat(Arrays.stream(Result.class.getDeclaredConstructors()).map(Constructor::getModifiers))
                .allSatisfy(modifiers -> assertThat(Modifier.isPrivate(modifiers)).isTrue());
        // success·failure는 클래스에 붙은 static, isSuccess·value는 만들어진 객체에 붙은 인스턴스 메서드다
        assertThat(Modifier.isStatic(Result.class.getMethod("success", Object.class).getModifiers())).isTrue();
        assertThat(Modifier.isStatic(Result.class.getMethod("failure", BusinessException.class).getModifiers())).isTrue();
        assertThat(Modifier.isStatic(Result.class.getMethod("isSuccess").getModifiers())).isFalse();
        assertThat(Modifier.isStatic(Result.class.getMethod("value").getModifiers())).isFalse();
    }

    @Test
    void 제네릭_덕분에_꺼낸_값을_형변환_없이_쓴다() {
        Result<Integer> likes = Result.success(3);
        Result<List<String>> tags = Result.success(List.of("java", "spring"));

        // Result<Integer>의 value()는 Integer, Result<List<String>>의 value()는 List<String>이다
        int doubled = likes.value() * 2;
        String first = tags.value().get(0);

        assertThat(doubled).isEqualTo(6);
        assertThat(first).isEqualTo("java");
    }
}
