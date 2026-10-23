# L-H2. H2. 파일 업로드·다운로드 — multipart, 저장 이름, 받는 이름

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H2-file-upload-download.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H2-file-upload-download.md)

원문 SHA-256: `58f0ba61127b93988ea81d425c57e6711143264f872e432e973ab5e043604780`

## 판정

filename/MIME을 신뢰하지 않는 처리, parser-level size limits, signature, UUID 및 download path containment를 보여준다. signature는 악성 파일 안전성을 보장하지 않는다는 제한도 명시한다.

## 목표·선수 지식·학습자 작업

multipart/form-data로 파일을 받고, 클라이언트가 보낸 filename/MIME과 실제 bytes를 구분한다. 서버 생성명, signature 검사, 크기 제한, 다운로드 disposition 및 경로 방어를 다룬다.

문서의 ImageController, curl 요청 및 sample bytes를 별도 연습 앱에서 작성한다. source는 저자가 실행한 결과를 싣지만 runnable 프로젝트/test는 이 저장소에 없다. 11-2로 DB 메타데이터/게시글 연결을 이어 간다.

## 요구·구현·검사 대조

### 1. 빈 파일/필수 파트 누락은 400, 허용하지 않는 signature는 415, multipart limit 초과는 413이다. 서버가 UUID 저장명을 생성하고 다운로드는 그 형식만 받으며 normalize 경로가 uploads root 아래인지 확인한다.

구현 대조: 원문 코드는 PNG 앞 8 bytes/JPEG 앞 3 bytes, UUID basename, multipart 기본 1MB/10MB, 413 handler, fake PNG/empty/missing cases, path traversal 공격 예시와 UTF-8 filename* 출력을 제공한다. sample originalNames는 실제 DB가 아니라 Map이다.

검사 대조: 문서에 curl 결과는 있지만 실행 source/test file은 없다. 따라하기는 201/413/415/400, 경로 이름과 Content-Disposition을 확인한다. 문서가 Excel/browser 실제 확인을 요구하지는 않는다.

공백 또는 한계: originalNames는 프로세스 메모리 Map이고 파일은 local uploads 디렉터리에 저장한다. 재시작 후 원본 이름 mapping은 사라지고, disk write와 DB record transaction은 원자적이지 않다. 11-2는 DB post_image와 연결·실패 cleanup을 이어 받는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H2-file-upload-download.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H2-file-upload-download.md:1) — 1~336행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

H2는 filesystem persistence를 택한다. 원본명 mapping만 map으로 표현해 실제 service metadata storage가 아니다. 파일 move와 DB commit/rollback은 한 transaction이 아니다.

- 현재 난이도: 독립 개념 레슨(선수 기초 후 실무 전이)
- 판정 이유: multipart/form-data로 파일을 받고, 클라이언트가 보낸 filename/MIME과 실제 bytes를 구분한다. 서버 생성명, signature 검사, 크기 제한, 다운로드 disposition 및 경로 방어를 다룬다.
- 다음 단계: H2는 단일 파일 transfer와 검증 기본이다. 11-2는 image row, owner, 게시글 연결, GIF/WebP, 글당 수 제한과 orphan cleanup을 다루고 P17은 S3/presigned URL로 확장한다.

## 부족한 점

### L-H2-G1 · medium

sample은 DB 영속성/권한과 파일·DB 간 보상 처리를 구현하지 않으며 path/signature 검사는 이미지 재인코딩이나 malware 검사와 동등하지 않다.

판정 범위: originalNames는 프로세스 메모리 Map이고 파일은 local uploads 디렉터리에 저장한다. 재시작 후 원본 이름 mapping은 사라지고, disk write와 DB record transaction은 원자적이지 않다. 11-2는 DB post_image와 연결·실패 cleanup을 이어 받는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H2-file-upload-download.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H2-file-upload-download.md:1) — 1~336행

## 확장 개발 명세

### multipart/form-data로 파일을 받고, 클라이언트가 보낸 filename/MIME과 실제 bytes를 구분한다 구체 검증

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

sample은 DB 영속성/권한과 파일·DB 간 보상 처리를 구현하지 않으며 path/signature 검사는 이미지 재인코딩이나 malware 검사와 동등하지 않다.

**시작 상태**

연습용 upload root와 가짜 이미지 파일에서 시작하고 repo의 실제 업로드 파일/사용자 데이터를 사용하지 않는다. 제출 전후 파일 목록을 기록한다.

**학습자가 할 일**

- 산책사진.png와 동일 bytes의 dot.png를 올려 status201, UUID 32자리와 확장자, originalName, size 및 저장 bytes 동일성을 확인한다.
- hello fake.png를 MIME=image/png로 강제, 0-byte, missing file part, 1.2MB 파일을 각각 전송해 415/400/400/413을 확인한다.
- max-file-size=2MB, max-request-size=3MB로 바꾼 뒤 1.2MB 단일은 201, 같은 크기 세 파트는 413, 5MB 파일은 413인지 비교한다.
- filename=../evil.png 업로드와 query param 기반 ../secret.txt 다운로드를 naive endpoint에서만 재현하고 안전 경로의 저장 위치/404를 확인한다.
- 한글 original filename 응답의 filename* 헤더를 기록하고 curl -OJ와 브라우저 저장명 결과를 구분한다.
- 업로드 뒤 프로세스를 재시작해 Map 기반 originalName lookup이 유지되는지 확인하고 DB-backed 11-2와 차이를 기록한다.

**정상 사례**

- 유효한 PNG bytes는 201, 저장 파일 bytes는 원본과 동일, fileName은 32 hex + .png다.
- 가짜 MIME은 본문 signature를 바꾸지 않으므로 415다.
- 다운로드 200에 attachment 및 UTF-8 filename*가 포함된다.

**실패·경계 사례**

- 크기 제한을 controller getSize()로만 구현하면 body는 이미 수신된다.
- 파일명 기반 경로는 ../ traversal 및 overwrite를 허용한다.
- header/MIME 또는 확장자만으로 이미지 유형을 믿으면 fake.png 통과 가능하다.
- 메모리 Map과 local filesystem은 process restart/다중 인스턴스에서 mapping/파일 일관성을 보장하지 않는다.

**동시성·성능**

요청 파일 크기/전체 multipart 크기 각각 제한한다. 대용량 streaming이나 image decode 비용은 이 35분 소개에서 측정하지 않는다.

**DB 관찰**

- status/body/header, 저장명/원본명, file size 및 bytes hash.
- upload root 전후 파일 목록, 재시작 전후 mapping.
- 요청의 multipart size와 설정값.

**합격 기준**

- valid/empty/missing/fake/oversize 결과가 각각 201/400/400/415/413이다.
- 사용자 파일명은 저장 경로가 아니며 다운로드 root 밖 파일을 읽지 않는다.
- 11-2의 DB metadata/권한/cleanup 확장으로 넘어갈 필요를 설명한다.

**기존 과제와 중복·연결**

11-2는 실제 post_image repository/authorization/cleanup을 구현한다. P17은 외부 저장소를 다루며 H2의 단일 로컬 경로는 그와 구분한다.

**우선순위**

medium

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H2/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H2/screen.jpg)
- 관찰: HTML/캡처를 실제 열어 확인하지 않았다. source와 HTML 차이만으로 시각 검토를 완료하지 않는다.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H2/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H2/dom.txt)

- source: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H2-file-upload-download.md](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H2-file-upload-download.md)
- source_same: 예
- html: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H2-file-upload-download.html](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H2-file-upload-download.html)
- html_same: 아니오
- difference: source는 corpus에서 최신 원문과 동일하다고 기록되어 있다. HTML byte hash가 다르지만 화면/원인을 미검토했다.

- 인쇄된 임시 앱 결과는 원문에 기록된 과거 저자 관찰이며 이번 실행이 아니다.
- 레슨별 runnable app/자동 테스트가 저장소에서 확인되지 않아 수치를 이번 검증 성공으로 주장하지 않는다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H2-file-upload-download.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H2-file-upload-download.md:1) — 1~336행 (원리·코드 예시·기록된 저자 실행·따라 하기·실패 반례·정답과 후속 경로)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-H2.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-H2.json)
