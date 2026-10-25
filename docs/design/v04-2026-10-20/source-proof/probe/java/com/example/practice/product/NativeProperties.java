package com.example.practice.product;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import v04.support.Proof;

/** DynamicPropertySource URL은 Boot의 test database 판정 대상이다. TC 실행은 아니다. */
abstract class NativeProperties {
 @DynamicPropertySource static void properties(DynamicPropertyRegistry p){
  p.add("spring.datasource.url",Proof::url);p.add("spring.datasource.username",()->"v04_probe");p.add("spring.datasource.password",Proof::password);
 }
}
