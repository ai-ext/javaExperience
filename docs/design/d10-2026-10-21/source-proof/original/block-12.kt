// build.gradle.kts — 설정 예시 (미실행)
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
}

java {
    toolchain { languageVersion = JavaLanguageVersion.of(25) }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    runtimeOnly("org.postgresql:postgresql") // 또는 MySQL 드라이버
}
