package org.example.dto;

public class CommonResponseDto<T> {

    public int status;
    public String message;
    public T data;

    public CommonResponseDto(int status, String message, T data){
        this.status = status;
        this.message = message;
        this.data = data;

    }

}
