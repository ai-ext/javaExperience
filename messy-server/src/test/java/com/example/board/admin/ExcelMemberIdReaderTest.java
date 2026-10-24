package com.example.board.admin;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.LongStream;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;

import static com.example.board.admin.Xlsx.BLANK;
import static com.example.board.admin.Xlsx.file;
import static com.example.board.admin.Xlsx.withHeader;
import static com.example.board.admin.Xlsx.xls;
import static com.example.board.admin.Xlsx.xlsx;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

/** Review Focus 5: 엑셀 비정상 입력. 1,001행·형식 오류는 400, 행 단위 오류는 skipped[]에 사유와 함께 담는다. */
class ExcelMemberIdReaderTest {

    final ExcelMemberIdReader reader = new ExcelMemberIdReader();

    ExcelReadResult read(List<?> values) {
        return reader.read(file("members.xlsx", xlsx(values)));
    }

    static List<Object> ids(long from, long to) {
        return new ArrayList<>(LongStream.rangeClosed(from, to).boxed().toList());
    }

    static void assertValidation(Runnable call) {
        assertThatThrownBy(call::run).isInstanceOfSatisfying(BusinessException.class,
                e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.VALIDATION));
    }

    @Test
    void 정상_1000행은_1000건() {
        ExcelReadResult result = read(withHeader(ids(1, 1000)));

        assertThat(result.memberIds()).hasSize(1000).startsWith(1L, 2L).endsWith(1000L);
        assertThat(result.skipped()).isEmpty();
    }

    @Test
    void 숫자가_아닌_셀은_NOT_A_NUMBER로_skipped() {
        ExcelReadResult result = read(withHeader(List.of(1, "abc", 1.5, true, "12a", 2)));

        assertThat(result.memberIds()).containsExactly(1L, 2L);
        assertThat(result.skipped()).extracting(Skipped::row, Skipped::value, Skipped::reason).containsExactly(
                tuple(3, "abc", "NOT_A_NUMBER"),
                tuple(4, "1.5", "NOT_A_NUMBER"),
                tuple(5, "TRUE", "NOT_A_NUMBER"),
                tuple(6, "12a", "NOT_A_NUMBER"));
    }

    @Test
    void 빈_행은_건너뛰고_skipped에도_넣지_않는다() {
        List<Object> values = new ArrayList<>(List.of("memberId", 1));
        values.add(null);
        values.add(BLANK);
        values.add("   ");
        values.add(2);

        ExcelReadResult result = read(values);

        assertThat(result.memberIds()).containsExactly(1L, 2L);
        assertThat(result.skipped()).isEmpty();
    }

    @Test
    void 데이터가_1001행이면_400() {
        assertValidation(() -> read(withHeader(ids(1, 1001))));
    }

    @Test
    void 헤더와_빈_행은_1000행_한도에_세지_않는다() {
        List<Object> values = withHeader(ids(1, 500));
        values.add(null);
        values.add(BLANK);
        values.addAll(ids(501, 1000));

        assertThat(read(values).memberIds()).hasSize(1000);
    }

    @Test
    void 잘못된_값의_행도_1000행_한도에_센다() {
        List<Object> values = withHeader(ids(1, 1000));
        values.add("abc");

        assertValidation(() -> read(values));
    }

    @Test
    void xls_파일은_400() {
        assertValidation(() -> reader.read(file("members.xls", xls(List.of(1, 2)))));
    }

    @Test
    void 확장자만_xlsx로_바꾼_xls_내용은_400() {
        assertValidation(() -> reader.read(file("members.xlsx", xls(List.of(1, 2)))));
    }

    @Test
    void 엑셀이_아닌_파일과_빈_파일은_400() {
        assertValidation(() -> reader.read(file("members.xlsx", "memberId\n1\n2\n".getBytes())));
        assertValidation(() -> reader.read(file("members.xlsx", new byte[] {'P', 'K', 3, 4, 0, 0})));
        assertValidation(() -> reader.read(file("members.xlsx", new byte[0])));
        assertValidation(() -> reader.read(file("members.csv", xlsx(List.of(1)))));
    }

    // MockMvc·직접 호출은 서블릿 업로드 한도를 거치지 않으므로 리더가 크기를 직접 본다
    @Test
    void 크기가_5MB를_넘으면_파싱_전에_400() {
        MockMultipartFile big = file("members.xlsx", new byte[5 * 1024 * 1024 + 1]);

        assertValidation(() -> reader.read(big));
    }

    @Test
    void 확장자는_대소문자를_가리지_않는다() {
        assertThat(reader.read(file("MEMBERS.XLSX", xlsx(List.of(7)))).memberIds()).containsExactly(7L);
    }

    @Test
    void 실수로_저장된_정수와_문자열_숫자도_읽는다() {
        ExcelReadResult result = read(List.of(1.0, "42", " 7 ", 3.0E3));

        assertThat(result.memberIds()).containsExactly(1L, 42L, 7L, 3000L);
        assertThat(result.skipped()).isEmpty();
    }

    @Test
    void 영과_음수는_NOT_POSITIVE() {
        ExcelReadResult result = read(withHeader(List.of(0, -5, "-3", 9)));

        assertThat(result.memberIds()).containsExactly(9L);
        assertThat(result.skipped()).extracting(Skipped::row, Skipped::reason).containsExactly(
                tuple(2, "NOT_POSITIVE"),
                tuple(3, "NOT_POSITIVE"),
                tuple(4, "NOT_POSITIVE"));
    }

    @Test
    void 헤더는_첫_행이_memberId일_때만_건너뛴다() {
        assertThat(read(List.of(5, 6)).memberIds()).containsExactly(5L, 6L);
        assertThat(read(List.of(" MemberId ", 5)).memberIds()).containsExactly(5L);
        // 첫 행이 아닌 곳의 memberId 글자는 잘못된 값이다
        assertThat(read(List.of(5, "memberId")).skipped()).extracting(Skipped::reason).containsExactly("NOT_A_NUMBER");
    }

    @Test
    void 행_번호는_엑셀에서_보이는_1부터_센다() {
        List<Object> values = new ArrayList<>(List.of("memberId", 1));
        values.add(null);
        values.add("x");

        assertThat(read(values).skipped()).extracting(Skipped::row).containsExactly(4);
    }
}
