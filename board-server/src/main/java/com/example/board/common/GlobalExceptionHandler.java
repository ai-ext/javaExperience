package com.example.board.common;

import java.net.URI;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.validation.method.ParameterErrors;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    ProblemDetail handleBusiness(BusinessException e, HttpServletRequest request) {
        ErrorCode code = e.errorCode();
        ProblemDetail pd = problem(code.status(), code.type(), code.title(), e.getMessage(), request.getRequestURI());
        if (e.field() != null) {
            pd.setProperty("errors", List.of(Map.of("field", e.field(), "reason", e.getMessage())));
        }
        return pd;
    }

    // 직접 검증한 본문(PG 콜백처럼 원문을 먼저 봐야 하는 경우)도 같은 errors[] 형식으로 맞춘다
    @ExceptionHandler(ConstraintViolationException.class)
    ProblemDetail handleConstraintViolation(ConstraintViolationException e, HttpServletRequest request) {
        ProblemDetail pd = problem(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION.type(), ErrorCode.VALIDATION.title(),
                "요청 값이 올바르지 않습니다.", request.getRequestURI());
        List<Map<String, String>> errors = e.getConstraintViolations().stream()
                .map(v -> {
                    String path = v.getPropertyPath().toString();
                    return Map.of("field", path.substring(path.lastIndexOf('.') + 1), "reason", v.getMessage());
                })
                .toList();
        pd.setProperty("errors", errors);
        return pd;
    }

    // 메서드 보안(@PreAuthorize) 거부는 필터가 아니라 컨트롤러 안에서 난다. 아래 Exception 핸들러에 먹혀 500이 되지 않게
    // 필터 단계 403(ProblemDetailSecurityHandler)과 같은 형식으로 내보낸다.
    @ExceptionHandler(AccessDeniedException.class)
    ProblemDetail handleAccessDenied(AccessDeniedException e, HttpServletRequest request) {
        ErrorCode code = ErrorCode.FORBIDDEN;
        return problem(code.status(), code.type(), code.title(), "접근 권한이 없습니다.", request.getRequestURI());
    }

    // IllegalArgumentException 등을 400으로 바꾸지 않는다. 서버 버그가 클라이언트 잘못으로 보이면 장애가 숨는다.
    @ExceptionHandler(Exception.class)
    ProblemDetail handleUnexpected(Exception e, HttpServletRequest request) {
        log.error("처리되지 않은 예외", e);
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "/errors/internal", "서버 오류",
                "요청을 처리하지 못했습니다.", request.getRequestURI());
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail pd = problem(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION.type(), ErrorCode.VALIDATION.title(),
                "요청 값이 올바르지 않습니다.", path(request));
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(GlobalExceptionHandler::toError)
                .toList();
        pd.setProperty("errors", errors);
        return ResponseEntity.badRequest().body(pd);
    }

    // 필수 헤더(Idempotency-Key 등)가 빠진 것도 검증 실패다. 상위 클래스 기본은 errors[] 없이 제목이 "Bad Request"라
    // 형식이 틀린 헤더(아래 파라미터 검증)와 같은 field 이름·제목으로 맞춘다.
    @Override
    protected ResponseEntity<Object> handleServletRequestBindingException(ServletRequestBindingException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        if (!(ex instanceof MissingRequestHeaderException missing)) {
            return super.handleServletRequestBindingException(ex, headers, status, request);
        }
        ProblemDetail pd = problem(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION.type(), ErrorCode.VALIDATION.title(),
                "요청 값이 올바르지 않습니다.", path(request));
        pd.setProperty("errors", List.of(Map.of("field", String.valueOf(missing.getParameter().getParameterName()),
                "reason", missing.getHeaderName() + " 헤더가 필요합니다.")));
        return ResponseEntity.badRequest().body(pd);
    }

    // 경로·쿼리 파라미터 검증(@Positive 등) 실패도 본문 검증과 같은 400 형식으로 맞춘다
    @Override
    protected ResponseEntity<Object> handleHandlerMethodValidationException(HandlerMethodValidationException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail pd = problem(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION.type(), ErrorCode.VALIDATION.title(),
                "요청 값이 올바르지 않습니다.", path(request));
        List<Map<String, String>> errors = ex.getParameterValidationResults().stream()
                .flatMap(r -> r instanceof ParameterErrors pe
                        // @Valid 본문은 필드 이름을, 경로·쿼리 파라미터는 파라미터 이름을 field로 쓴다
                        ? pe.getFieldErrors().stream().map(GlobalExceptionHandler::toError)
                        : r.getResolvableErrors().stream().map(e -> Map.of(
                                "field", String.valueOf(r.getMethodParameter().getParameterName()),
                                "reason", String.valueOf(e.getDefaultMessage()))))
                .toList();
        pd.setProperty("errors", errors);
        return ResponseEntity.badRequest().body(pd);
    }

    // 서블릿 업로드 한도(spring.servlet.multipart) 초과. 상위 클래스 기본은 413이지만 spec-v2 5-6은 400 /errors/validation이다.
    @Override
    protected ResponseEntity<Object> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail pd = problem(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION.type(), ErrorCode.VALIDATION.title(),
                "파일은 최대 5MB입니다.", path(request));
        pd.setProperty("errors", List.of(Map.of("field", "file", "reason", "최대 5MB")));
        return ResponseEntity.badRequest().body(pd);
    }

    // 나머지 Spring MVC 예외(404, 405, 본문 파싱 실패 등)는 상위 클래스가 ProblemDetail로 만든다. instance와 type만 맞춘다.
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
            HttpStatusCode statusCode, WebRequest request) {
        ResponseEntity<Object> response = super.handleExceptionInternal(ex, body, headers, statusCode, request);
        // body가 null이면 상위 클래스가 ErrorResponse에서 ProblemDetail을 만들어 응답에 넣으므로 결과에서 꺼내 맞춘다
        if (response != null && response.getBody() instanceof ProblemDetail pd) {
            pd.setInstance(URI.create(path(request)));
            pd.setType(typeOf(statusCode));
        }
        return response;
    }

    private static URI typeOf(HttpStatusCode status) {
        return URI.create(switch (status.value()) {
            case 404 -> ErrorCode.NOT_FOUND.type();
            case 400 -> ErrorCode.VALIDATION.type();
            default -> "about:blank";
        });
    }

    private static Map<String, String> toError(FieldError fe) {
        return Map.of("field", fe.getField(), "reason", String.valueOf(fe.getDefaultMessage()));
    }

    private static String path(WebRequest request) {
        return ((ServletWebRequest) request).getRequest().getRequestURI();
    }

    private static ProblemDetail problem(HttpStatus status, String type, String title, String detail, String instance) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setType(URI.create(type));
        pd.setTitle(title);
        pd.setInstance(URI.create(instance));
        return pd;
    }
}
