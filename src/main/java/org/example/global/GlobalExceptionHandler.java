package org.example.global;

import org.example.dto.CommonResponseDto;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// 아래 예시를 직접 적용할 때 필요한 import입니다.
// import org.example.dto.CommonResponseDto;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.ExceptionHandler;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
     public ResponseEntity<CommonResponseDto<Void>> handleIllegalArgument(
             IllegalArgumentException e) {
         return ResponseEntity.status(404)
                 .body(new CommonResponseDto<>(404, e.getMessage(), null));
     }


    // 참고용 예시입니다. 현재는 주석이므로 실제 예외 처리를 바꾸지 않습니다.
    // 컨트롤러의 요청 처리 중 서비스에서 아래 예외가 발생했다고 가정합니다.
    // throw new IllegalArgumentException("파라미터가 잘못 들어왔습니다.");
    //
    // @ExceptionHandler는 어떤 예외를 이 메서드로 처리할지 지정합니다.
    // e는 발생한 예외 객체이고, e.getMessage()는 위에서 지정한 문구입니다.
    // ResponseEntity.badRequest()는 실제 HTTP 상태를 400으로 지정합니다.
    // CommonResponseDto는 응답 본문이며, 내부 status 값만으로 HTTP 상태가 바뀌지는 않습니다.
    // ResponseEntity로 본문을 반환하므로 여기서는 별도 @ResponseBody가 필요 없습니다.
    //
    // @ExceptionHandler(IllegalArgumentException.class)
    // public ResponseEntity<CommonResponseDto<Void>> handleIllegalArgument(
    //         IllegalArgumentException e) {
    //     return ResponseEntity.badRequest()
    //             .body(new CommonResponseDto<>(400, e.getMessage(), null));
    // }
    //
    // 응답 예시 (HTTP 400):
    // {"status": 400, "message": "파라미터가 잘못 들어왔습니다.", "data": null}
    // deleteTodo()의 ResponseStatusException은 위 예시가 처리하는 예외와 종류가 다릅니다.

}
