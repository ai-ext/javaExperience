package com.example.board.admin;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import org.apache.poi.poifs.filesystem.FileMagic;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;

/**
 * 쿠폰 대량 지급 파일(.xlsx)의 첫 열에서 회원 id를 읽는다(spec-v2 5-6).
 * - 파일 오류(비었음, 5MB 초과, .xlsx 아님, 읽을 수 없음, 데이터 1,000행 초과)는 400이다.
 * - 첫 번째 비어 있지 않은 행의 첫 셀이 문자열 memberId면 헤더로 건너뛴다.
 * - 첫 셀이 비어 있는 행은 빈 행으로 건너뛰고 한도에도 세지 않는다. 값이 잘못된 행은 한도에 센다.
 * - 숫자 셀은 정수일 때만(1.0은 1), 문자열 셀은 정수 표기일 때만 받는다. 0·음수는 NOT_POSITIVE.
 */
@Component
public class ExcelMemberIdReader {

    static final long MAX_BYTES = 5L * 1024 * 1024;
    static final int MAX_ROWS = 1000;
    private static final String HEADER = "memberId";
    private static final Pattern INTEGER = Pattern.compile("[+-]?\\d{1,18}");
    // double이 정수를 정확히 담는 한계(2^53). 넘으면 엑셀에서 이미 자릿수가 깎였을 수 있다.
    private static final double MAX_EXACT = 9_007_199_254_740_992d;

    public ExcelReadResult read(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw invalid("파일이 비어 있습니다.");
        }
        // 파싱보다 먼저 본다. 서블릿 업로드 한도는 MockMvc·직접 호출에서는 걸리지 않는다.
        if (file.getSize() > MAX_BYTES) {
            throw invalid("파일은 최대 5MB입니다.");
        }
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase(Locale.ROOT).endsWith(".xlsx")) {
            throw invalid(".xlsx 파일만 받습니다.");
        }
        try (XSSFWorkbook workbook = open(file)) {
            if (workbook.getNumberOfSheets() == 0) {
                throw invalid("시트가 없습니다.");
            }
            return read(workbook.getSheetAt(0));
        } catch (IOException e) {
            throw invalid("엑셀 파일을 읽을 수 없습니다.");
        }
    }

    private static XSSFWorkbook open(MultipartFile file) throws IOException {
        try (InputStream in = FileMagic.prepareToCheckMagic(file.getInputStream())) {
            // 확장자만 바꾼 .xls(OLE2)나 엑셀이 아닌 파일을 내용으로 거른다
            if (FileMagic.valueOf(in) != FileMagic.OOXML) {
                throw invalid(".xlsx 형식이 아닙니다.");
            }
            // zip bomb 방지 기본값(ZipSecureFile 최소 압축률 등)은 끄지 않는다
            return new XSSFWorkbook(in);
        } catch (RuntimeException e) {
            if (e instanceof BusinessException) {
                throw e;
            }
            // POI는 손상된 파일을 여러 런타임 예외(POIXMLException, NotOfficeXmlFileException 등)로 알린다.
            // 이 블록은 파일 열기 한 곳만 감싸므로 서버 버그를 입력 오류로 숨기지 않는다.
            throw invalid("엑셀 파일을 읽을 수 없습니다.");
        }
    }

    private static ExcelReadResult read(Sheet sheet) {
        DataFormatter formatter = new DataFormatter();
        List<MemberIdRow> rows = new ArrayList<>();
        List<Skipped> skipped = new ArrayList<>();
        boolean first = true;
        int dataRows = 0;
        // 시트 반복자는 실제로 있는 행만 돈다. getLastRowNum()으로 세면 서식만 남은 빈 행까지 센다.
        for (Row row : sheet) {
            Cell cell = row.getCell(0, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            if (cell == null || isBlankText(cell)) {
                continue;
            }
            if (first) {
                first = false;
                if (isHeader(cell)) {
                    continue;
                }
            }
            if (++dataRows > MAX_ROWS) {
                throw invalid("최대 1,000행까지 받습니다.");
            }
            int rowNumber = row.getRowNum() + 1;
            Long id = parse(cell);
            if (id == null) {
                skipped.add(new Skipped(rowNumber, formatter.formatCellValue(cell), "NOT_A_NUMBER"));
            } else if (id <= 0) {
                skipped.add(new Skipped(rowNumber, formatter.formatCellValue(cell), "NOT_POSITIVE"));
            } else {
                rows.add(new MemberIdRow(rowNumber, id));
            }
        }
        return new ExcelReadResult(rows, skipped);
    }

    /** 정수로 읽을 수 없으면 null. */
    private static Long parse(Cell cell) {
        CellType type = cell.getCellType() == CellType.FORMULA ? cell.getCachedFormulaResultType() : cell.getCellType();
        return switch (type) {
            case NUMERIC -> fromNumber(cell.getNumericCellValue());
            case STRING -> fromText(cell.getStringCellValue().trim());
            default -> null;
        };
    }

    // 엑셀은 숫자를 모두 double로 저장한다. 1을 넣어도 1.0으로 읽힌다.
    private static Long fromNumber(double value) {
        if (value != Math.rint(value) || Math.abs(value) > MAX_EXACT) {
            return null;
        }
        return (long) value;
    }

    private static Long fromText(String text) {
        return INTEGER.matcher(text).matches() ? Long.parseLong(text) : null;
    }

    private static boolean isBlankText(Cell cell) {
        return cell.getCellType() == CellType.STRING && cell.getStringCellValue().isBlank();
    }

    private static boolean isHeader(Cell cell) {
        return cell.getCellType() == CellType.STRING && cell.getStringCellValue().trim().equalsIgnoreCase(HEADER);
    }

    private static BusinessException invalid(String detail) {
        return new BusinessException(ErrorCode.VALIDATION, detail);
    }
}
