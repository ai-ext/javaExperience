# P17. 파일 업로드·다운로드와 외부 스토리지

> multipart는 파일 바이트와 폼 필드를 한 HTTP 요청에 담는 형식이고, Spring Boot는 이를 `MultipartFile`로 바인딩한다.
> 업로드한 바이트와 파일 메타데이터를 분리하고, 원본 파일명·MIME·경로를 신뢰하지 않아야 운영 장애와 보안 사고를 줄일 수 있다.
> 기본 추천은 애플리케이션 서버에는 임시 파일만 두고, 최종 파일은 객체 스토리지에 저장하며 DB에는 소유자·키·크기·검증 상태를 기록하는 방식이다.

## 1. 한 줄로 말하면

파일 업로드는 `multipart/form-data` 파트를 검증하고 서버 생성 key로 저장하는 과정이다. 다운로드는 권한 확인 뒤 `Resource` 또는 제한된 객체 스토리지 URL로 바이트를 전달한다. 파일과 메타데이터를 분리한다.

파일과 DB는 따로 성공·실패할 수 있다. 또한 `../../application.yml`, 가짜 MIME, 지나치게 큰 파일은 경로 조작·리소스 고갈·악성 파일 문제가 된다.

## 2. 당장 알아야 할 것

### 2.1 요청 형식과 파트 이름

브라우저나 `curl -F`는 파일·폼 값을 boundary 파트로 만든다. 서버와 파트 이름이 같아야 한다.

```java
@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
ResponseEntity<FileUploadResponse> upload(
        @RequestPart("file") MultipartFile file,
        @RequestParam("description") String description) {
    // 검증 후 저장
}
```

`@RequestPart`는 JSON 파트나 명시적인 multipart 파트에 적합하다. 단순 파일에는 `@RequestParam`도 쓸 수 있다. 이름이 다르면 `Required part 'image' is not present`가 발생한다.

### 2.2 `MultipartFile`은 영구 저장소가 아니다

Spring Framework 7의 `MultipartFile`은 요청으로 받은 파일을 표현한다. 구현에 따라 메모리 또는 임시 디스크에 있고, 요청 처리가 끝나면 임시 저장이 정리될 수 있다. 따라서 다음처럼 즉시 영구 저장한다.

```java
Path target = storageRoot.resolve(serverGeneratedName);
Files.createDirectories(target.getParent());
file.transferTo(target);       // 또는 Files.copy(file.getInputStream(), target)
```

`getBytes()`는 작은 파일에만 사용하고 큰 파일은 `getInputStream()` 또는 `transferTo(Path)`로 스트리밍한다. `getOriginalFilename()`은 저장 경로나 새 키로 사용하지 않는다.

### 2.3 Boot의 크기 제한을 먼저 정한다

Boot 4.1.1의 `MultipartProperties` 기준 기본값은 파일 하나 최대 1MB, multipart 전체 요청 최대 10MB, 파일을 디스크로 쓰기 시작하는 임계값 0이다. 서비스의 허용 정책에 맞게 명시한다.

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 20MB
      max-request-size: 25MB
      file-size-threshold: 0B
      location: ${java.io.tmpdir}/my-api-multipart
```

`max-file-size`는 개별 파일, `max-request-size`는 전체 요청이다. 여러 파일 API는 합계가 후자에 걸릴 수 있다. 초과 예외는 413으로 통일하고 프록시 제한도 확인한다.

### 2.4 파일명은 저장 키와 표시 이름으로 나눈다

DB에는 다음을 별도 컬럼으로 둔다.

```text
id, owner_id, storage_provider, storage_key, original_filename,
content_type_reported, content_type_detected, size_bytes, sha256,
status, created_at
```

`storage_key`는 UUID나 난수로 만들고, 원본명은 표시용으로만 보관한다. 동일명 덮어쓰기와 `..`·구분자 문제를 피할 수 있다.

확장자는 보조 신호다. `Content-Type`은 위조될 수 있으므로 이미지 디코더·파일 시그니처·보안 스캐너를 조합한다. SVG·HTML 등 실행 가능 형식은 공개 정책을 별도로 정한다.

### 2.5 다운로드는 `Content-Disposition`과 권한이 핵심이다

```java
return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(meta.detectedContentType()))
        .contentLength(meta.sizeBytes())
        .header(HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment()
                        .filename(meta.originalFilename(), StandardCharsets.UTF_8)
                        .build().toString())
        .body(resource);
```

`inline`은 화면 열기, `attachment`는 저장을 유도한다. 사용자 입력을 raw 헤더에 연결하지 말고 `ContentDisposition`으로 인코딩한다. 먼저 소유자·공유 권한을 확인한다. Framework 7의 `ResourceHttpMessageConverter`는 byte range를 지원한다.

### 2.6 대용량은 애플리케이션을 경유하지 않는다

수백 MB 이상은 API가 바이트를 중계하지 않는다. S3 presigned URL 방식은 API가 짧은 PUT URL을 만들고 클라이언트가 S3로 직접 업로드한다. URL은 생성자 권한 범위에서만 동작하고 같은 key는 덮어쓰므로 key·만료를 서버가 관리한다.

```text
클라이언트 ── POST /files/presign ──> API ──> DB에 UPLOADING 기록
클라이언트 <─ {uploadUrl, key} ───── API
클라이언트 ── PUT uploadUrl (파일) ─> S3
클라이언트 ── POST /files/{id}/complete ─> API ──> HEAD/검증 후 AVAILABLE
```

presigned URL에는 같은 method·필요한 헤더로 PUT하며 임시 권한이므로 로그에 노출하지 않는다.

## 3. 따라 하기

아래 예제는 Boot 4.1.1, Java 25를 기준으로 한 최소 서버다. 여기서는 저장 위치를 로컬 `./data/uploads`로 단순화했다. 운영에서는 `FileStorage` 구현을 S3 어댑터로 교체한다.

### 3.1 프로젝트 생성

`build.gradle.kts`:

```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
    toolchain { languageVersion = JavaLanguageVersion.of(25) }
}

repositories { mavenCentral() }

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
}
```

`src/main/resources/application.yml`:

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 20MB
      max-request-size: 25MB
      file-size-threshold: 0B
storage:
  root: ./data/uploads
```

### 3.2 저장 서비스와 안전한 파일명

```java
package com.example.file;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LocalFileStorage {
    private final Path root;

    public LocalFileStorage(@Value("${storage.root}") String root) throws IOException {
        this.root = Path.of(root).toAbsolutePath().normalize();
        Files.createDirectories(this.root);
    }

    public StoredFile save(MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("empty file");
        String original = file.getOriginalFilename() == null
                ? "unnamed" : Path.of(file.getOriginalFilename()).getFileName().toString();
        String extension = extensionOf(original);
        String key = UUID.randomUUID() + extension;
        Path target = root.resolve(key).normalize();
        if (!target.getParent().equals(root)) throw new IllegalArgumentException("invalid key");
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target);
        }
        return new StoredFile(key, original, file.getContentType(), Files.size(target));
    }

    public InputStream open(String key) throws IOException {
        Path target = root.resolve(key).normalize();
        if (!target.getParent().equals(root)) throw new IllegalArgumentException("invalid key");
        return Files.newInputStream(target);
    }

    private static String extensionOf(String name) {
        int dot = name.lastIndexOf('.');
        if (dot <= 0 || dot == name.length() - 1) return "";
        String ext = name.substring(dot).toLowerCase(Locale.ROOT);
        return switch (ext) {
            case ".jpg", ".jpeg", ".png", ".pdf", ".txt" -> ext;
            default -> "";
        };
    }

    public record StoredFile(String key, String originalName,
                             String reportedContentType, long size) {}
}
```

확장자는 보조 정보이며 실제 서비스는 시그니처·바이러스 검사 후 공개한다. (Spring 예제 미실행)

### 3.3 업로드·다운로드 컨트롤러

```java
package com.example.file;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
public class FileController {
    private final LocalFileStorage storage;

    public FileController(LocalFileStorage storage) { this.storage = storage; }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResponse> upload(@RequestPart("file") MultipartFile file)
            throws Exception {
        LocalFileStorage.StoredFile saved = storage.save(file);
        return ResponseEntity.ok(new UploadResponse(saved.key(), saved.originalName(), saved.size()));
    }

    @GetMapping("/{key}")
    public ResponseEntity<Resource> download(@PathVariable String key) throws Exception {
        // 실제 코드에서는 이 지점 앞에서 DB 조회와 현재 사용자 권한 검사를 한다.
        InputStream stream = storage.open(key);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(key, StandardCharsets.UTF_8).build().toString())
                .body(new InputStreamResource(stream));
    }

    public record UploadResponse(String key, String originalName, long size) {}
}
```

`InputStreamResource`의 스트림은 메시지 변환기가 응답을 쓴 뒤 닫으므로 컨트롤러에서 먼저 닫지 않는다. 객체 스토리지는 권한 확인 뒤 presigned GET을 반환하는 구성이 흔하다. (Spring 예제 미실행)

### 3.4 실행과 `curl` 확인

```bash
./gradlew bootRun
printf 'hello P17\n' > /tmp/p17.txt
curl -i -F 'file=@/tmp/p17.txt;type=text/plain' http://localhost:8080/api/files
curl -i -OJ 'http://localhost:8080/api/files/{응답의-key}'
```

첫 요청은 생성 key·크기를 반환하고, 두 번째는 `Content-Disposition: attachment`를 반환한다. 25MB 초과 예외는 `@ControllerAdvice`에서 413 JSON으로 매핑한다. (Spring 예제 미실행)

presigned PUT은 다음처럼 시험한다.

```bash
curl -X PUT --upload-file /tmp/p17.txt \
  -H 'Content-Type: text/plain' \
  'https://bucket.s3.amazonaws.com/key?...signature...'
```

### 3.5 DB 메타데이터

presigned URL 발급 시 `PENDING` 행을 만들고, 완료 콜백에서 사용자 소유권과 S3 `HEAD`의 key·크기를 확인한 뒤 `AVAILABLE`로 바꾼다. 만료 행과 고아 객체는 정리한다. 이미지 리사이즈·OCR·바이러스 검사는 별도 작업으로 보내며 비동기 일반론은 S15를 참조한다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| `@RequestPart` | multipart 파트 바인딩 | `@RequestPart("file") MultipartFile f` | 파트 이름이 정확해야 한다 |
| `getOriginalFilename()` | 표시용 원본명 | DB `original_filename` | 경로·키로 쓰지 않는다 |
| `getInputStream()` | 스트리밍 읽기 | `Files.copy(in, target)` | 사용 후 닫기, 전체 byte 배열 금지 |
| `transferTo(Path)` | 파일 저장 | `file.transferTo(target)` | 대상 키를 서버가 만든다 |
| `max-file-size` | 파일 하나의 상한 | `20MB` | 프록시 제한도 확인 |
| `max-request-size` | multipart 전체 상한 | `25MB` | 여러 파일 합계를 포함 |
| `Content-Disposition` | 다운로드 동작 지정 | `attachment; filename="..."` | 사용자명 헤더 주입 방지 |
| `Resource` | Spring 응답 바디 | `InputStreamResource` | 대용량은 스트리밍·range 고려 |
| presigned PUT | 클라이언트 직접 업로드 | `curl -X PUT ...` | 만료·key 덮어쓰기·권한 제한 |

## 5. 자주 나는 에러와 해결

1. `MaxUploadSizeExceededException` 또는 413 → `max-file-size`/`max-request-size`나 프록시 body 제한 초과 → 파일별·전체·Ingress 제한을 함께 조정하고 예외를 413으로 반환한다.

2. `Required part 'file' is not present` → `curl`의 `-F 'upload=@x'`와 `@RequestPart("file")`의 이름 불일치, 또는 `Content-Type`을 multipart로 보내지 않음 → 파트 이름을 통일하고 `curl -F`를 사용한다.

3. `NoSuchFileException` 또는 재시작 후 파일 소실 → 컨테이너의 로컬 디스크를 영구 저장소로 착각 → 볼륨을 연결하거나 객체 스토리지로 이전하고 DB의 키만 보존한다.

4. `InvalidPathException`, `AccessDeniedException`, 또는 `../../`로 다른 파일이 노출됨 → 원본명을 경로에 이어 붙이고 정규화·범위 검사를 하지 않음 → UUID 키를 만들고 `normalize()`한 뒤 허용 root 밖인지 검사한다. 그래도 파일 권한 검사가 필요하다.

5. 다운로드 파일명이 `???`로 보이거나 헤더 파싱 오류 → `filename`에 한글을 raw로 연결하거나 인코딩하지 않음 → `ContentDisposition.filename(name, UTF_8)`을 사용하고 원본명은 표시용으로만 둔다.

6. 이미지 확장자는 `.png`인데 열리지 않거나 업로드 후 XSS → 확장자와 `Content-Type`만 신뢰함 → 파일 시그니처·실제 디코딩·허용 목록을 검사하고, 공개 파일은 `Content-Type`과 `Content-Disposition` 정책을 명확히 한다.

7. 대용량 다운로드에서 힙 사용량이 급증하고 요청이 멈춤 → `Files.readAllBytes()`나 `getBytes()`로 전체를 메모리에 적재 → `Resource`/입력 스트림을 사용하고 객체 스토리지 presigned GET으로 중계를 없앤다.

## 6. 한 단계 더

업로드 경계에서 인증·크기·타입·내용을 검사하고, 서버 생성 key와 DB 상태로 소유권을 관리한다. 다운로드 경계에서는 권한과 헤더를 적용한다. presigned URL은 완료 확인과 고아 객체 정리가 필수다.

Spring MVC 요청 흐름은 → S05, 보안은 → D11, 비동기 처리는 → S15를 참조한다.

## 7. 자가점검 Q&A (면접 대비)

### Q1. `multipart/form-data`가 JSON보다 파일 업로드에 적합한 이유는?

파일 바이트와 문자열·JSON 파트를 함께 보낼 수 있기 때문이다. Base64 JSON은 크기와 메모리 부담이 커진다. 파트 이름이 서버와 일치해야 한다.

꼬리질문: `@RequestPart`와 `@RequestParam`은 언제 구분하나?

JSON 등 명시적 파트는 `@RequestPart`, 단순 파일·폼 값은 `@RequestParam`도 가능하다.

### Q2. `getOriginalFilename()`을 저장 경로로 쓰면 안 되는 이유는?

클라이언트 값이라 `..`나 구분자가 섞일 수 있고 path traversal·덮어쓰기가 발생한다. 표시명과 서버 생성 UUID key를 분리한다.

꼬리질문: `normalize()`만 하면 안전한가?

아니다. 정규화 후 허용 root 안인지 확인하고 심볼릭 링크·OS 권한도 관리한다.

### Q3. `max-file-size`와 `max-request-size`의 차이는?

전자는 파일 하나, 후자는 multipart 전체의 상한이다. 여러 파일·폼 필드가 후자에 포함되며 프록시와 애플리케이션 중 작은 값이 실제 상한이다.

꼬리질문: 크기를 늘리면 `getBytes()`도 써도 되나?

아니다. 대용량은 스트림·임시 파일·객체 스토리지 직접 업로드를 쓴다.

### Q4. 로컬 디스크 대신 S3를 선택하는 기준은?

여러 서버·교체되는 컨테이너에서는 객체 스토리지가 기본이다. 단일 서버의 임시 산출물은 로컬 디스크가 단순하며, 어느 쪽이든 백업·삭제·보존 기간을 정한다.

꼬리질문: DB BLOB은 항상 나쁜가?

아니다. 작고 트랜잭션 일관성이 중요한 파일에는 검토하지만 대용량 미디어에는 객체 스토리지가 낫다.

### Q5. presigned URL 업로드의 전체 흐름과 주의점은?

API가 권한을 확인하고 서버 생성 key와 짧은 만료의 PUT URL을 발급한다. 클라이언트가 S3로 업로드한 뒤 API가 HEAD·검증 후 `AVAILABLE`로 바꾼다. 동일 key 덮어쓰기와 완료 검증에 주의한다.

꼬리질문: presigned PUT 응답 200이면 DB도 완료 처리해도 되나?

클라이언트의 완료 호출만 믿기보다 서버가 S3 HEAD로 key·크기·Content-Type을 확인하고 검사 상태를 기록해야 한다. 미완료 행과 고아 객체를 정리하는 작업도 필요하다.

### Q6. 다운로드에서 `Resource`를 반환하는 장점은?

Spring의 메시지 변환기가 Resource를 응답 스트림으로 쓰고, `ResourceHttpMessageConverter`는 byte range 요청을 지원한다. 따라서 전체 바이트를 byte 배열로 만들지 않고 대용량·재개 다운로드를 처리하기 쉽다. 실제 파일의 권한과 Content-Disposition은 컨트롤러가 책임진다.

꼬리질문: S3 파일도 API가 `Resource`로 중계해야 하나?

대용량은 presigned GET으로 S3에서 직접 받는다.

## 8. 참고문헌

- Uploading Files — https://spring.io/guides/gs/uploading-files — Spring Boot multipart 업로드의 전체 흐름과 자동 구성 예제.
- MultipartProperties (Spring Boot 4.1.1 API) — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/servlet/autoconfigure/MultipartProperties.html — `max-file-size`, `max-request-size`, 임시 저장 기본값.
- MultipartFile (Spring Framework 7.0.9 API) — https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/multipart/MultipartFile.html — 임시 저장 수명, 스트림·`transferTo`, 원본명 주의사항.
- ResourceHttpMessageConverter (Spring Framework 7.0.9 API) — https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/converter/ResourceHttpMessageConverter.html — Resource 응답과 byte range 지원.
- Uploading objects with presigned URLs — https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html — PUT presigned URL 권한, 만료, 동일 key 덮어쓰기와 curl 예제.
- Work with Amazon S3 pre-signed URLs — https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/examples-s3-presign.html — AWS SDK for Java 2.x의 GET/PUT presigned URL 흐름.
- File Upload Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html — 파일명·타입·크기·저장 위치·권한 검증 원칙.
