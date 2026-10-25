plugins {
    java
    id("org.springframework.boot") version "4.1.1"
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}
