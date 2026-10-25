import java.security.MessageDigest

plugins {
    java
    id("org.springframework.boot") version "4.1.1"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

// 아래는 관측용 추가 구성이다. 원문 Java25 블록과 구분한다.
repositories { mavenCentral() }
dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:4.1.1"))
    implementation("org.springframework.boot:spring-boot-starter")
    testImplementation(platform("org.springframework.boot:spring-boot-dependencies:4.1.1"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}
tasks.withType<Test>().configureEach { useJUnitPlatform() }
dependencyLocking { lockAllConfigurations() }
tasks.register("policySkip") {
    onlyIf { false }
    doLast { layout.buildDirectory.file("unexpected-skip-action.txt").get().asFile.writeText("unexpected") }
}
tasks.register("recordProof") {
    doLast {
        val graph = listOf("compileJava", "processResources", "classes", "compileTestJava", "processTestResources", "testClasses", "test", "check", "jar", "bootJar", "assemble", "build").associateWith { name ->
            val task = tasks.getByName(name)
            task.taskDependencies.getDependencies(task).map { it.name }.sorted()
        }
        file("task-graph.json").writeText(groovy.json.JsonOutput.prettyPrint(groovy.json.JsonOutput.toJson(graph)))
        val artifacts = configurations.testRuntimeClasspath.get().resolvedConfiguration.resolvedArtifacts.sortedBy { it.moduleVersion.id.toString() }.map { artifact ->
            val bytes = artifact.file.readBytes()
            val hash = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it.toInt() and 255) }
            mapOf("coordinate" to artifact.moduleVersion.id.toString(), "file" to artifact.file.absolutePath, "sha256" to hash)
        }
        file("dependencies.json").writeText(groovy.json.JsonOutput.prettyPrint(groovy.json.JsonOutput.toJson(artifacts)))
    }
}
