package com.example.board.admin;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.List;

import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.mock.web.MockMultipartFile;

/** 테스트용 엑셀을 POI로 만든다(바이너리 파일을 저장소에 두지 않는다). 첫 열에만 값을 쓴다. */
final class Xlsx {

    /** 행은 만들되 첫 열 셀을 비워 둔다. */
    static final Object BLANK = new Object();

    private Xlsx() {
    }

    /** null은 행 자체를 만들지 않는다(빈 행). Number는 숫자 셀, String은 문자열 셀, Boolean은 논리 셀. */
    static byte[] xlsx(List<?> values) {
        return write(new XSSFWorkbook(), values);
    }

    static byte[] xls(List<?> values) {
        return write(new HSSFWorkbook(), values);
    }

    static List<Object> withHeader(List<?> values) {
        List<Object> all = new ArrayList<>();
        all.add("memberId");
        all.addAll(values);
        return all;
    }

    static MockMultipartFile file(String filename, byte[] bytes) {
        return new MockMultipartFile("file", filename,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes);
    }

    private static byte[] write(Workbook wb, List<?> values) {
        try (wb; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("members");
            for (int i = 0; i < values.size(); i++) {
                Object v = values.get(i);
                if (v == null) {
                    continue;
                }
                Row row = sheet.createRow(i);
                if (v == BLANK) {
                    row.createCell(0);
                } else if (v instanceof Number n) {
                    row.createCell(0).setCellValue(n.doubleValue());
                } else if (v instanceof Boolean b) {
                    row.createCell(0).setCellValue(b);
                } else {
                    row.createCell(0).setCellValue(v.toString());
                }
            }
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
