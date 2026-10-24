package com.example.javatrack.j10;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

/** 타입 한 컷: final·var·static final 상수 — 설정 상수, 불변 필드. */
class J10TypeCutTest {

    private static List<Field> fields(Class<?> type, boolean statics) {
        return Arrays.stream(type.getDeclaredFields())
                .filter(f -> !f.isSynthetic())
                .filter(f -> Modifier.isStatic(f.getModifiers()) == statics)
                .toList();
    }

    @Test
    void 한도_안의_업로드는_받아들인다() {
        UploadLimits smallest = new UploadLimits(1, 1);
        UploadLimits largest = new UploadLimits(UploadLimits.MAX_ROWS, UploadLimits.MAX_FILE_BYTES);

        assertThat(smallest.rows()).isEqualTo(1);
        assertThat(largest.rows()).isEqualTo(1_000);
        assertThat(largest.fileBytes()).isEqualTo(5L * 1024 * 1024);
    }

    @Test
    void 한도를_넘으면_거절한다() {
        assertThatThrownBy(() -> new UploadLimits(0, 1)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new UploadLimits(1_001, 1)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new UploadLimits(1, 0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new UploadLimits(1, UploadLimits.MAX_FILE_BYTES + 1))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void 인스턴스_필드는_모두_private_final이다() {
        List<Field> instanceFields = fields(UploadLimits.class, false);

        assertThat(instanceFields).as("UploadLimits에 한도 값을 담을 인스턴스 필드를 선언하세요").isNotEmpty();
        assertThat(instanceFields).allSatisfy(f -> {
            assertThat(Modifier.isPrivate(f.getModifiers())).as(f.getName() + "는 private").isTrue();
            assertThat(Modifier.isFinal(f.getModifiers())).as(f.getName() + "는 final").isTrue();
        });
    }

    @Test
    void 함정_final이_없는_static_필드는_한_곳에서_바꾸면_모든_곳이_바뀐다() {
        LeakyUploadSettings requestA = new LeakyUploadSettings();
        LeakyUploadSettings requestB = new LeakyUploadSettings();
        assertThat(requestB.accepts(500)).isTrue();
        try {
            // 요청 A를 처리하던 코드가 "이번만" 한도를 줄였다. static은 클래스에 하나뿐이라 요청 B도 같이 줄어든다
            LeakyUploadSettings.maxRows = 10;
            assertThat(requestA.accepts(500)).isFalse();
            assertThat(requestB.accepts(500)).isFalse();
        } finally {
            LeakyUploadSettings.maxRows = 1_000;
        }

        // UploadLimits의 static 필드는 모두 final이라 이런 대입이 컴파일되지 않는다
        assertThat(fields(UploadLimits.class, true))
                .allSatisfy(f -> assertThat(Modifier.isFinal(f.getModifiers())).as(f.getName() + "는 final").isTrue());
        assertThat(new UploadLimits(500, 1).rows()).isEqualTo(500);
    }

    @Test
    void var는_오른쪽_값으로_타입이_정해질_뿐_final은_아니다() {
        // var max의 타입은 오른쪽 상수의 타입(long)이다
        var max = UploadLimits.MAX_FILE_BYTES;
        assertThat((Object) max).isInstanceOf(Long.class);

        // var는 타입을 적지 않을 뿐 다시 대입할 수 있다. 막으려면 final var로 쓴다
        var limits = new UploadLimits(10, 1_024);
        limits = new UploadLimits(20, 2_048);

        assertThat(limits.rows()).isEqualTo(20);
    }
}
