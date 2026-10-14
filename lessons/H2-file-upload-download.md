# H2. 파일 업로드·다운로드 — multipart, 저장 이름, 받는 이름

> 개념 레슨 · 35분

## 이게 뭐냐

지금까지 요청 본문은 전부 JSON이었다. 사진은 JSON에 못 담는다(바이트 덩어리라서). 파일은 **`multipart/form-data`**로 보낸다. 본문을 경계 문자열(boundary)로 잘라 "파트"를 여러 개 담는 형식이다. 파트마다 이름, 파일 이름, 형식이 붙는다.

```text
POST /h2/images HTTP/1.1
Content-Type: multipart/form-data; boundary=demo-123

--demo-123
Content-Disposition: form-data; name="file"; filename="dot.png"
Content-Type: image/png

(여기에 파일 바이트)
--demo-123--
```

curl은 `-F`로 이 본문을 만들어 준다. `-F 'file=@dot.png'`는 "이름이 `file`인 파트에 `dot.png` 파일 내용을 담아라"다. Spring에서는 그 파트를 `MultipartFile`로 받는다.

```java
@PostMapping("/h2/images")
public ResponseEntity<Map<String, Object>> upload(@RequestParam("file") MultipartFile file) { … }
```

파일을 받는 코드는 이게 전부다. 어려운 건 **무엇을 믿느냐**다. 파트에 붙어 오는 정보는 전부 보낸 쪽이 적은 것이다.

| 파트에 붙어 오는 것 | `MultipartFile`에서 | 믿어도 되나 |
|---|---|---|
| 파일 이름 `filename="…"` | `getOriginalFilename()` | **아니다.** `../evil.png`도 그대로 온다 |
| 형식 `Content-Type: image/png` | `getContentType()` | **아니다.** 텍스트 파일에 `image/png`를 붙일 수 있다 |
| 파일 바이트 | `getInputStream()` | 실제로 받은 것. 앞 몇 바이트(서명)로 형식을 판정한다 |
| 크기 | `getSize()` | 실제 크기. 단 이 값을 볼 때는 **이미 다 받은 뒤**다 |

그래서 규칙이 셋 나온다.

1. **크기는 컨트롤러에 오기 전에 막는다.** `spring.servlet.multipart.max-file-size`(파일 하나, 기본 1MB)와 `max-request-size`(요청 전체, 기본 10MB).
2. **저장 이름은 서버가 짓는다.** UUID 같은 이름으로 저장하고, 원래 이름은 DB에 "표시용"으로만 둔다. 형식은 파일 앞 바이트로 판정한다.
3. **내려줄 때 원래 이름은 `Content-Disposition` 헤더로 알려 준다.** 한글 이름은 `filename*=UTF-8''…` 형식이다.

## 예시

이 레슨을 쓰면서 작은 Spring Boot 4.1 앱(포트 `18300`)을 만들어 실제로 보냈다. 아래 출력은 전부 그 실행 결과다.

### 올리기 — 서버가 이름을 짓는다

```java
private static final Path ROOT = Path.of("uploads").toAbsolutePath().normalize();

@PostMapping("/h2/images")
public ResponseEntity<Map<String, Object>> upload(@RequestParam("file") MultipartFile file) throws IOException {
    if (file.isEmpty()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "빈 파일");
    }
    String ext;
    try (InputStream in = file.getInputStream()) {
        ext = imageExtension(in.readNBytes(8));          // 앞 8바이트만 본다
    }
    String storedName = UUID.randomUUID().toString().replace("-", "") + ext;
    Files.createDirectories(ROOT);
    file.transferTo(ROOT.resolve(storedName));
    originalNames.put(storedName, String.valueOf(file.getOriginalFilename()));   // 실제로는 DB 한 행
    return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "fileName", storedName,
            "originalName", String.valueOf(file.getOriginalFilename()),
            "browserSaidType", String.valueOf(file.getContentType()),
            "size", file.getSize()));
}

static String imageExtension(byte[] head) {
    byte[] png = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
    if (Arrays.equals(head, png)) return ".png";
    if (head.length >= 3 && (head[0] & 0xFF) == 0xFF && (head[1] & 0xFF) == 0xD8 && (head[2] & 0xFF) == 0xFF) {
        return ".jpg";
    }
    throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "PNG·JPEG만 올릴 수 있습니다");
}
```

- PNG 파일은 항상 `89 50 4E 47 0D 0A 1A 0A` 8바이트로 시작하고, JPEG는 `FF D8 FF`로 시작한다. 이걸 **파일 서명**(매직 넘버)이라고 한다.
- `transferTo`는 받은 파일을 그 경로로 옮겨 저장한다.

```text
$ B=http://localhost:18300
$ curl -s -w '\n%{http_code}\n' -F 'file=@산책사진.png' $B/h2/images
{"browserSaidType":"image/png","size":108,"fileName":"8219b586e8104515a8c0eaa9ca8a8551.png","originalName":"산책사진.png"}
201
```

디스크에는 `uploads/8219b586…a8551.png`로 저장됐다. 같은 이름의 사진을 두 사람이 올려도 덮어쓰지 않는다.

### 너무 큰 파일 — 컨트롤러에 오기 전에 413

아무 설정 없이(기본 1MB) 1.2MB 파일을 보냈다.

```text
$ curl -s -i -F 'file=@big12.png' $B/h2/images
HTTP/1.1 100

HTTP/1.1 413
Content-Length: 0
Date: Sat, 10 Oct 2026 06:56:54 GMT
Connection: close
```

```text
WARN … .w.s.m.s.DefaultHandlerExceptionResolver : Resolved [org.springframework.web.multipart.MaxUploadSizeExceededException: Maximum upload size exceeded]
```

- 상태는 **413**(Content Too Large)이고 **본문이 비어 있다**. 서버는 연결도 끊는다(`Connection: close`).
- 예외는 `MaxUploadSizeExceededException`이다. Spring이 요청을 컨트롤러에 넘기기 **전**, multipart를 풀다가 던졌다. 그래서 컨트롤러의 어떤 코드도 돌지 않았고 `uploads`에 아무것도 생기지 않았다. 5MB, 30MB 파일도 똑같이 413이었다.

한도를 바꿔서도 해 봤다(`max-file-size=2MB`, `max-request-size=3MB`).

| 보낸 것 | 결과 | 걸린 한도 |
|---|---|---|
| 1.2MB 파일 하나 | `201` | — |
| 1.2MB 파일 셋을 한 요청에(`-F file=@… -F a=@… -F b=@…`) | `413` | 요청 전체 3MB |
| 5MB 파일 하나 | `413` | 파일 하나 2MB |

빈 본문 대신 사용자에게 보여 줄 메시지를 주려면 전역 핸들러에서 이 예외를 잡는다.

```java
@RestControllerAdvice
public class UploadErrors {
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.CONTENT_TOO_LARGE)
    public Map<String, String> tooLarge(MaxUploadSizeExceededException e) {
        return Map.of("message", "사진은 1MB까지 올릴 수 있어요");
    }
}
```

```text
HTTP/1.1 413
Content-Type: application/json
Content-Length: 54
Connection: close

{"message":"사진은 1MB까지 올릴 수 있어요"}
```

### 이미지가 아닌 것 — 415와 400

```text
$ echo 'hello' > fake.png
$ curl -s -w '\n%{http_code}\n' -F 'file=@fake.png;type=image/png' $B/h2/images
{"timestamp":"2026-10-10T06:56:42.189Z","status":415,"error":"Unsupported Media Type","path":"/h2/images"}
415
$ : > empty.png
$ curl -s -o /dev/null -w '%{http_code}\n' -F 'file=@empty.png' $B/h2/images
400
$ curl -s -o /dev/null -w '%{http_code}\n' -F 'note=hi' $B/h2/images
400
```

- `;type=image/png`는 curl에게 "이 파트의 `Content-Type`을 `image/png`로 적어라"다. 이름도 `.png`, 형식도 `image/png`지만 앞 바이트가 `hello`라서 415다.
- 0바이트 파일은 `isEmpty()`에 걸려 400. `file` 파트가 아예 없으면 Spring이 `MissingServletRequestPartException: Required part 'file' is not present.`를 로그에 남기고 400을 준다.

### 내려받기 — 한글 이름은 `filename*`

```java
@GetMapping("/h2/images/{fileName}")
public ResponseEntity<Resource> download(@PathVariable String fileName) {
    if (!STORED_NAME.matcher(fileName).matches()) {          // [0-9a-f]{32}\.(png|jpg) 모양만
        throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    Path path = ROOT.resolve(fileName).normalize();
    if (!path.startsWith(ROOT) || !Files.isRegularFile(path)) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    ContentDisposition cd = ContentDisposition.attachment()
            .filename(originalNames.getOrDefault(fileName, fileName), StandardCharsets.UTF_8)
            .build();
    return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
            .body(new FileSystemResource(path));
}
```

```text
$ curl -s -D - -o /dev/null $B/h2/images/8219b586e8104515a8c0eaa9ca8a8551.png
HTTP/1.1 200
Content-Disposition: attachment; filename="___________.png"; filename*=UTF-8''%EC%82%B0%EC%B1%85%EC%82%AC%EC%A7%84.png
Content-Type: application/octet-stream
Content-Length: 108
```

- `attachment`는 "화면에 띄우지 말고 파일로 저장하라"는 뜻이다.
- `filename*=UTF-8''…`가 진짜 이름이다. `%EC%82%B0`이 `산`의 UTF-8 세 바이트다.
- Spring은 `filename*`를 못 읽는 옛 프로그램을 위해 `filename="___________.png"`도 같이 넣었다. 한글 자리가 밑줄로 바뀐 대체 이름이다. 둘 다 있으면 `filename*`를 아는 프로그램은 `filename*`를 쓴다(RFC 6266).
- **curl은 `filename*`를 쓰지 않았다.** `curl -OJ`(헤더의 이름으로 저장)로 받았더니 `___________.png`로 저장됐다. 한글 이름이 제대로 보이는지는 브라우저로 확인한다.

## 따라 해 보기

15분. 0~9장에서 만든 앱(Boot 4.1)에 위 `upload`·`download`·`imageExtension`을 담은 `ImageController`를 하나 만든다. `STORED_NAME`은 `Pattern.compile("[0-9a-f]{32}\\.(png|jpg)")`, `originalNames`는 `new ConcurrentHashMap<String, String>()`이다. `uploads` 폴더는 프로젝트 폴더 안에 생긴다(`.gitignore`에 넣어 둔다).

**1. 시험 파일을 만든다.** 진짜 PNG 대신 PNG 서명 8바이트 + 아무 바이트로 만든다.

```bash
printf '\x89PNG\r\n\x1a\n' > dot.png; head -c 100 /dev/urandom >> dot.png
cp dot.png 산책사진.png
printf '\x89PNG\r\n\x1a\n' > big12.png; head -c 1250000 /dev/urandom >> big12.png
echo 'hello' > fake.png
xxd dot.png | head -1      # 89504e47 0d0a1a0a 로 시작하는지
```

**2. 올리고 받는다.** 예시의 curl을 그대로 친다. 표가 맞으면 된다.

| 보낸 것 | 기대 |
|---|---|
| `dot.png` · `산책사진.png` | `201`, `fileName`이 32자 16진수`.png` |
| `big12.png` | `413`, 본문 없음 |
| `fake.png;type=image/png` | `415` |
| `file` 파트 없음 | `400` |
| 받기 `-D -` | `filename*=UTF-8''%EC%82%B0…` |
| 받기 `/h2/images/secret.txt` | `404` (이름 모양이 다르다) |

**3. 한도를 바꿔 본다.** `application.yml`에 넣고 다시 켠다.

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 2MB
      max-request-size: 3MB
```

`big12.png`가 `201`로 바뀌고, 셋을 한 번에 보내면 `413`인지 본다.

## 일부러 틀려 보기

**1. 보낸 이름으로 저장하기.** 이렇게 쓰고 싶어진다.

```java
@PostMapping("/h2/naive")
public Map<String, String> naiveUpload(@RequestParam("file") MultipartFile file) throws IOException {
    Path target = ROOT.resolve(file.getOriginalFilename());
    file.transferTo(target);
    return Map.of("originalName", String.valueOf(file.getOriginalFilename()),
            "savedTo", target.normalize().toString());
}
```

curl은 `;filename=`으로 파트의 파일 이름을 마음대로 적을 수 있다.

```text
$ curl -s -F 'file=@dot.png;filename=../evil.png' $B/h2/naive
{"originalName":"../evil.png","savedTo":"/…/lessons-h2349/evil.png"}
```

`getOriginalFilename()`은 `../evil.png`를 **그대로** 돌려줬고, 파일은 `uploads` **바깥**(한 단계 위)에 저장됐다. `../`를 더 붙이면 더 위로 간다. 같은 이름을 올리면 남의 파일을 덮어쓴다. 안전한 `/h2/images`에 같은 요청을 보내면 `201`에 `fileName`은 UUID, `originalName`만 `../evil.png`다. 원래 이름은 표시용 데이터로만 남는다.

**2. 받을 때 경로를 그대로 붙이기.**

```java
@GetMapping("/h2/naive")
public ResponseEntity<Resource> naiveDownload(@RequestParam String name) {
    return ResponseEntity.ok().contentType(MediaType.TEXT_PLAIN)
            .body(new FileSystemResource(ROOT.resolve(name)));
}
```

```text
$ echo '이건 비밀' > secret.txt      # uploads 바깥(프로젝트 폴더)
$ curl -s "$B/h2/naive?name=../secret.txt"
이건 비밀
```

`uploads` 밖의 파일이 그대로 나갔다. 경로 변수(`/h2/images/..%2Fsecret.txt`)로 같은 짓을 하면 톰캣이 먼저 `400`(HTML 에러 페이지)으로 막았다. 하지만 위처럼 쿼리 파라미터로 받으면 아무도 막아 주지 않는다. 그래서 받는 쪽도 **서버가 지은 이름 모양**(`[0-9a-f]{32}\.png`)만 받고, `normalize()` 후 `startsWith(ROOT)`로 한 번 더 확인한다.

**3. `getContentType()`만 믿기.** `getContentType()`만 돌려주는 엔드포인트에 `fake.png`(내용 `hello`)를 보냈다. `;type=image/png`를 붙여도, 안 붙여도(curl이 확장자 `.png`를 보고 적는다) 결과는 `{"getContentType":"image/png"}`였다. 형식 검사를 `file.getContentType().startsWith("image/")`로 하면 `hello`가 이미지로 저장된다.

## 확인 문제

**1.** `max-file-size`의 기본값과, 그걸 넘는 파일을 보냈을 때 Boot 4.1 기본 응답은?

<details>
<summary>정답</summary>

**1MB, 상태 `413`에 빈 본문.** `MaxUploadSizeExceededException`이 컨트롤러에 오기 전에 나고, `DefaultHandlerExceptionResolver`가 413으로 바꾼다. 메시지를 주려면 `@ExceptionHandler`로 잡는다.
</details>

**2.** `max-file-size: 5MB`만 바꾸고 4MB 사진 세 장을 한 요청에 올렸다. 결과는? 왜?

<details>
<summary>정답</summary>

**`413`.** 파일 하나는 5MB 안이지만 요청 전체가 12MB라 `max-request-size`(기본 10MB)에 걸린다. 실제로 `max-file-size=5MB`만 주고 켜서 4MB 하나는 `201`, 셋은 `413`이었다. 두 한도를 같이 정한다.
</details>

**3.** 컨트롤러에서 `if (file.getSize() > 1_048_576) throw …`로 크기를 막으면 뭐가 아쉬운가?

<details>
<summary>정답</summary>

`getSize()`를 볼 때는 **이미 파일을 다 받은 뒤**다. 큰 파일이 들어오는 동안 서버가 그만큼 받아 둔다. `max-file-size`는 multipart를 푸는 단계에서 끊는다.
</details>

**4.** 사용자가 보낸 파일 이름이 `../../app.yml`이다. `uploads.resolve(이름)`에 저장하면 무슨 일이 생기나? 어떻게 바꾸나?

<details>
<summary>정답</summary>

`uploads` 밖, 두 단계 위에 `app.yml`이 저장된다(덮어쓸 수도 있다). `getOriginalFilename()`은 보낸 문자열을 그대로 준다. 저장 이름은 **서버가 UUID로 짓고**, 원래 이름은 DB에 표시용으로만 둔다.
</details>

**5.** 다운로드 응답에 `filename="___________.png"; filename*=UTF-8''%EC%82%B0…`가 같이 있다. 왜 둘인가? curl `-OJ`는 어느 쪽으로 저장했나?

<details>
<summary>정답</summary>

`filename*`가 UTF-8 진짜 이름, `filename`은 `filename*`를 모르는 프로그램을 위한 ASCII 대체 이름이다. 둘 다 있으면 `filename*`를 아는 쪽은 그걸 쓴다. 이 실험에서 **curl은 `filename`**(밑줄 이름)으로 저장했다. 한글 이름 확인은 브라우저로 한다.
</details>

## 더 깊이

- [P17 파일 업로드·다운로드와 외부 스토리지](../docs/knowledge/P17-file-upload-storage.md) — 저장 이름과 표시 이름, 권한 확인, S3·presigned URL
- [A2 HTTP 요청·응답 뜯어보기](./A2-http-anatomy.md) — `Content-Type`과 본문 형식
- [F1 검증과 에러 응답](./F1-validation-errors.md) — 413·415도 같은 에러 모양으로 맞추기
- Spring Framework — Multipart: https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/multipart-forms.html
- Spring Boot 4.1.1 API — `MultipartProperties`(기본 1MB·10MB): https://docs.spring.io/spring-boot/api/java/org/springframework/boot/servlet/autoconfigure/MultipartProperties.html
- Spring Framework 7 API — `MaxUploadSizeExceededException`: https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/multipart/MaxUploadSizeExceededException.html
- Spring Framework 7 API — `ContentDisposition`: https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/ContentDisposition.html
- OWASP File Upload Cheat Sheet — 이름은 서버가 짓기, 웹 루트 밖 저장, 서명 검사의 한계: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- RFC 6266(`Content-Disposition`) · RFC 8187(`filename*` 인코딩): https://datatracker.ietf.org/doc/html/rfc6266 · https://www.rfc-editor.org/rfc/rfc8187.html

서명 8바이트가 맞아도 "안전한 이미지"라는 뜻은 아니다. 실서비스는 이미지 라이브러리로 열어 보기, 다시 인코딩하기, 악성코드 검사를 겹친다(OWASP). 그리고 UUID 이름을 안다고 아무나 받게 두면 안 된다. 비공개 파일은 받을 때마다 권한을 확인한다.

## 다음

- 실습: [11-2. 글에 이미지 첨부](../scenario/ch11-post-advanced/11-2-image-upload.md) — 오늘 만든 올리기·받기를 `post_image` 테이블과 엮는다. GIF·WebP 서명도 받고, 1MB 초과는 413, 서버가 지은 이름 모양이 아니면 404다.
- CSV 파일로 내려주기는 [H9. CSV 내려받기와 시간 다루기](./H9-csv-and-time.md)에서 같은 `Content-Disposition`을 다시 쓴다.
