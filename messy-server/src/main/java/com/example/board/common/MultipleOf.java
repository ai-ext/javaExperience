package com.example.board.common;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

/** 정수가 value의 배수인지 본다. null은 @NotNull에 맡긴다. */
@Target({ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = MultipleOf.Validator.class)
public @interface MultipleOf {

    int value();

    String message() default "{value}의 배수여야 합니다";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    class Validator implements ConstraintValidator<MultipleOf, Integer> {

        private int divisor;

        @Override
        public void initialize(MultipleOf annotation) {
            this.divisor = annotation.value();
        }

        @Override
        public boolean isValid(Integer value, ConstraintValidatorContext context) {
            return value == null || value % divisor == 0;
        }
    }
}
