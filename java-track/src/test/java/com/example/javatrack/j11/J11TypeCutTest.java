package com.example.javatrack.j11;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

/** 타입 한 컷: 배열 vs List — 고정 길이·공변성, Arrays.asList의 크기 고정. 레거시 코드의 배열 반환. */
class J11TypeCutTest {

    @Test
    void 배열은_길이가_고정이고_List는_늘어난다() {
        String[] names = LegacyPointCalculator.gradeNames();
        List<String> list = GradeLists.toModifiableList(names);

        list.add("SILVER");

        // 배열 길이는 만들 때 정해져 바뀌지 않는다. 늘리려면 새 배열을 만들어 옮겨야 한다
        assertThat(names).hasSize(3);
        assertThat(list).containsExactly("VIP", "GOLD", "BASIC", "SILVER");
    }

    @Test
    void 함정_Arrays_asList는_크기가_고정이고_원본_배열과_연결돼_있다() {
        String[] names = LegacyPointCalculator.gradeNames();
        List<String> view = Arrays.asList(names);

        // Arrays.asList는 배열 위에 씌운 뷰다. 크기를 바꾸는 add·remove는 막혀 있다
        assertThatThrownBy(() -> view.add("SILVER"))
                .isInstanceOf(UnsupportedOperationException.class);
        // set은 된다. 그리고 배열까지 바뀐다
        view.set(0, "VVIP");
        assertThat(names[0]).isEqualTo("VVIP");

        String[] fresh = LegacyPointCalculator.gradeNames();
        List<String> mine = GradeLists.toModifiableList(fresh);
        mine.set(0, "VVIP");
        mine.add("SILVER");
        fresh[1] = "PLATINUM";

        assertThat(fresh).containsExactly("VIP", "PLATINUM", "BASIC");
        assertThat(mine).containsExactly("VVIP", "GOLD", "BASIC", "SILVER");
    }

    @Test
    void 배열은_공변이라_잘못된_원소가_실행_중에야_터진다() {
        // String[]은 Object[]에 대입된다(공변). 컴파일러는 통과시키고, 넣는 순간 런타임이 막는다
        Object[] objects = LegacyPointCalculator.gradeNames();
        assertThatThrownBy(() -> objects[0] = 1)
                .isInstanceOf(ArrayStoreException.class);

        // List<String>은 List<Object>에 대입할 수 없다(불공변). 같은 실수를 컴파일러가 먼저 막는다
        // List<Object> wrong = GradeLists.toModifiableList(...);   ← 컴파일 에러
        List<String> names = GradeLists.toModifiableList(LegacyPointCalculator.gradeNames());
        List<? extends Object> readOnly = names;
        assertThat(readOnly).hasSize(3);
    }

    @Test
    void 함정_int_배열을_Arrays_asList에_넣으면_원소가_하나다() {
        int[] rates = LegacyPointCalculator.gradeRates();

        // 제네릭에는 기본형이 못 들어가 int[] 자체가 원소 하나가 된다. List<Integer>가 아니라 List<int[]>다
        List<int[]> wrong = Arrays.asList(rates);
        List<Integer> right = GradeLists.toIntegerList(rates);

        assertThat(wrong).hasSize(1);
        assertThat(right).containsExactly(5, 3, 1);
    }
}
