package org.example.global;

import lombok.Getter;

@Getter
public enum StatusEnum {
    PARAMETER_MESSAGE("파라미터가 잘못됐다네" , 401);

    private String message;
    private int status;

    StatusEnum(String message, int status){
        this.message= message;
        this.status=status;
    }






}
