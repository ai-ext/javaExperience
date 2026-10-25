#!/usr/bin/env python3
"""3-2의 정적 blob으로 교육용 CRUD 시작 패키지와 완성 참고 답안을 만든다."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import zipfile

ROOT = Path(__file__).resolve().parents[2]
SNAPSHOT = 'scenario/snapshots/3-2.json'
OUTPUT = ROOT / 'scenario/flow/packages'
METHODS = ('create', 'getDetail', 'list', 'patch', 'delete')
TASKS = ('create', 'detail', 'list', 'update', 'delete', 'reference')
SUPPLEMENTS = (
    'gradlew', 'gradlew.bat', 'gradle/wrapper/gradle-wrapper.jar',
    'gradle/wrapper/gradle-wrapper.properties', 'compose.yaml',
    'docker/cloudbeaver/start.sh', 'docker/cloudbeaver/data-sources.json',
)
ZIP_DATE = (2026, 1, 1, 0, 0, 0)


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def json_bytes(data):
    return (json.dumps(data, ensure_ascii=False, indent=2) + '\n').encode('utf-8')


def safe_path(value):
    path = PurePosixPath(value)
    if not value or path.is_absolute() or '..' in path.parts or '\\' in value or str(path) != value:
        raise ValueError(f'안전하지 않은 패키지 경로: {value}')
    return value


def service_path(method):
    name = 'PostQueryService' if method in ('getDetail', 'list') else 'PostService'
    return f'src/main/java/org/example/post/{name}.java'


def stub_method(source, method):
    # 정본의 네 칸 들여쓰기 public 메서드 경계를 사용하고, 일치가 하나일 때만 변경한다.
    pattern = re.compile(r'(^    public [^\n]*\b' + re.escape(method)
                         + r'\([^\n]*\) \{)(.*?)(\n    \})', re.M | re.S)
    replacement = '\n        throw new UnsupportedOperationException("학습용 미구현: '
    replacement += method + ' 메서드를 완성하세요.");'
    result, count = pattern.subn(lambda match: match[1] + replacement + match[3], source)
    if count != 1:
        raise ValueError(f'{method}: 메서드 경계가 정확히 하나가 아님({count})')
    return result


def learning_readme(task, stubs, provided):
    purpose = '완성 참고 답안' if task == 'reference' else '교육용 starter'
    target = METHODS[TASKS.index(task)] if task != 'reference' else '없음(답안)'
    return f'''# 게시글 CRUD · {purpose} · {task}

이 패키지는 학생 코드를 복사하거나 수정한 결과가 아닙니다. 문서의 정적 3-2 snapshot
files[].blob 75개를 재구성한 별도의 {purpose}입니다. snapshot의 commit 필드로
Git archive를 만들지 않았습니다. 원본과 패키지의 파일별 출처·해시는 PACKAGE-MANIFEST.json에 있습니다.

현재 구현할 메서드: {target}
이미 제공된 CRUD 메서드: {', '.join(provided) or '없음'}
미구현 CRUD 메서드: {', '.join(stubs) or '없음'}

Controller, DTO, 인증·가시성 정책, Entity, Repository, 검증·태그 helper는 제공됩니다.
현재 단계와 이후 단계의 CRUD 메서드 body는 컴파일 가능한 UnsupportedOperationException으로
남겨 두었습니다. 이후 기능의 미구현은 현재 과제의 실패로 채점하지 않습니다.
copy/replace 등 원본의 다른 기능과 테스트도 원문 보존을 위해 포함되어 있습니다.
이 파일들이 있다는 사실이 이번 다섯 과제에서 그 기능까지 완성해야 한다는 뜻은 아닙니다.

## 1. 처음 한 번: 학습 폴더와 DB 준비

준비물은 JDK 21, Docker Desktop, 터미널입니다. build.gradle은 Spring Boot 4.1.1,
wrapper는 Gradle 9.8.0입니다. 의존성과 Gradle 배포본을 처음 다운로드할 수 있습니다.
create.zip을 새 학습 폴더에 압축 해제하고 IntelliJ에서 그 폴더를 Gradle 프로젝트로 엽니다.
기존 학생 코드 위에 압축을 풀어 덮어쓰지 않습니다. 아래 명령은 압축을 푼 프로젝트 루트에서 실행합니다.
macOS/Linux는 먼저 `chmod +x gradlew`를 실행합니다. Windows는 `./gradlew` 대신 `gradlew.bat`를 씁니다.

이미 이 학습용 community DB가 실행 중이면 그 DB를 계속 사용하고 새 Compose를 올리지 않습니다.
처음 준비하는 경우에만 Docker Desktop을 켜고 다음 명령을 실행합니다.

```bash
DB_PORT=13308 docker compose up -d mysql
docker compose ps mysql
```

`docker compose ps mysql`에서 mysql 상태가 **healthy**가 될 때까지 기다립니다.
상태가 준비되지 않으면 같은 폴더에서 `docker compose logs mysql`로 오류를 확인합니다.
MySQL 초기 빈 볼륨을 처음 만들 때 docker/mysql/init/01-community.sql,
02-practice.sql, 03-grants.sql이 이름 순서대로 적용됩니다. 기존 볼륨에서는 다시 실행되지 않습니다.
이미 다른 실습 데이터가 있다면 지우거나 SQL dump를 다시 덮어 넣지 않습니다.

DB 연결 기본값은 호스트 `localhost:13308`, DB `community`, DB 계정은 **community / community**입니다.
compose.yaml의 `DB_PORT` 기본값 13308과 src/main/resources/application.yml의 datasource URL
`jdbc:mysql://localhost:13308/community?characterEncoding=UTF-8&serverTimezone=Asia/Seoul`이 같습니다.
JPA ddl-auto=validate이므로 앱은 빠진 테이블을 자동 생성하지 않습니다.

포트 13308을 다른 프로그램이 사용한다면 처음 DB를 만들기 전에 사용할 포트를 정합니다.
예를 들어 DB를 13318로 준비하려면 `DB_PORT=13318 docker compose up -d mysql`을 쓰고,
앱도 아래 환경변수로 같은 포트에 연결합니다. 이후 모든 단계에서 이 DB와 포트를 유지합니다.

```bash
SPRING_DATASOURCE_URL='jdbc:mysql://localhost:13318/community?characterEncoding=UTF-8&serverTimezone=Asia/Seoul' ./gradlew bootRun
```

## 2. 컴파일 → 서버 시작 → 연결 확인

기본 DB 포트 13308을 사용하는 경우 다음 명령으로 진행합니다.

```bash
./gradlew compileJava
./gradlew bootRun
```

bootRun 터미널은 켜 둡니다. 앱의 기본 URL은 `http://localhost:8080`입니다.
코드 수정 내용은 실행 중인 앱에 자동 반영되지 않습니다. 코드를 저장한 뒤 기존 bootRun 터미널에서
`Ctrl+C`로 앱만 종료하고, 같은 프로젝트 폴더에서 `./gradlew bootRun`을 다시 실행합니다.
DB·Compose·작성 응답 id는 유지합니다. DB 포트를 바꿨다면 재실행할 때도 같은 `SPRING_DATASOURCE_URL`을 지정합니다.
다른 터미널에서 다음 요청의 본문이 `pong`인지 확인합니다.

```bash
curl -i http://localhost:8080/api/start/ping
```

이 확인은 서버 연결 확인입니다. 아직 미구현인 CRUD 메서드가 완성됐다는 의미는 아닙니다.
8080을 다른 서버가 사용 중이면 기존 작업을 확인하고 현재 실습 서버 한 개만 사용합니다.

## 3. 토큰으로 작성 요청 보내기

seed의 `tok-kimjava`는 member id=2, nickname=김자바, role=USER, status=ACTIVE에 연결되며
만료 시각은 2099-12-31 23:59:59입니다. 이것은 연습 토큰이며 DB 접속 계정과 다릅니다.
일반 회원이 작성할 수 있는 게시판 `dev`를 사용합니다. POST에서는 요청 본문에 authorId를 넣지 않습니다.
작성자는 `Authorization: Bearer tok-kimjava`로 결정됩니다.

create 메서드를 구현한 뒤 위 안내대로 앱만 재시작하고 다음 요청을 보냅니다. 뒤 단계 ZIP에는 create의 정본 구현이 제공됩니다.

```bash
curl -i -X POST http://localhost:8080/api/posts -H 'Authorization: Bearer tok-kimjava' -H 'Content-Type: application/json' --data '{{"boardSlug":"dev","title":"나의 CRUD 연습","content":"게시글 본문","tags":["spring"],"visibility":"PUBLIC"}}'
```

201과 Location 헤더 및 JSON의 id를 확인하고 실제 반환된 id를 기록합니다. 고정 seed 글 id로 바꾸지 않습니다.
뒤 과제는 이 id로 상세 GET, 목록 GET, PATCH, DELETE를 같은 서버와 DB에서 이어갑니다.
create 미구현 starter에서 위 요청을 먼저 보내면 UnsupportedOperationException으로 실패합니다.
기능별 요청·기대 응답·직접 실행한 결과와 DB 관찰은 해당 과제 화면에서 따로 확인합니다.

## 4. 다음 과제로 이동할 때

**현재 프로젝트와 DB를 유지**하고 다음 메서드 하나를 구현합니다.
순서는 create → getDetail → list → patch → delete입니다. 앞 과제에서 직접 쓴 코드를 그대로 둡니다.
각 메서드의 코드를 수정한 뒤에는 앱만 Ctrl+C → 같은 프로젝트의 `./gradlew bootRun`으로 다시 실행합니다.
다음 ZIP을 기존 학생 코드에 덮어쓰지 않습니다. DB와 Compose도 처음 준비한 한 폴더에서 계속 관리합니다.
매 단계의 새 폴더에서 Compose를 올리면 같은 포트 충돌이나 별도 볼륨이 생길 수 있습니다.

중간 합류 또는 앞 과제의 정본을 기준으로 시작하고 싶은 경우에만 해당 단계 ZIP을 별도의 새 폴더에 풉니다.
이 경우에도 DB는 처음 준비한 폴더의 기존 DB를 그대로 사용하고, 새 폴더에서는 Compose를 다시 올리지 않습니다.
서버를 옮길 때는 앞 bootRun 터미널에서 Ctrl+C로 앱만 종료한 뒤 새 폴더에서 bootRun을 실행합니다.
포트를 바꿨다면 새 프로젝트에서도 위 SPRING_DATASOURCE_URL을 동일하게 지정합니다.

패키지 생성과 컴파일 검사는 서버·DB의 실제 실행을 증명하지 않습니다. 제공된 검증 기록은 compile-only입니다.
테스트는 Docker/Testcontainers가 필요하며, starter의 미구현 메서드를 호출하는 테스트는 완성 전 실패합니다.

## 시작 코드와 답안 구분

create.zip → detail.zip → list.zip → update.zip → delete.zip 순서입니다.
각 단계는 앞 단계의 정본 구현을 제공하고 현재·이후 메서드만 미구현으로 둡니다.
reference.zip은 다섯 메서드가 모두 완성된 **완성 참고 답안**입니다. 스스로 구현한 뒤 비교합니다.

원본 snapshot에 없는 Gradle wrapper·compose·CloudBeaver 파일은 저장소 루트에서
보충했습니다. 원본 75개와 혼동하지 않도록 PACKAGE-MANIFEST.json의 supplementalFiles에
출처와 SHA-256을 별도로 기록했습니다. 기본 snapshot의 알려진 정책·검증 한계도 그대로 유지합니다.
'''.encode('utf-8')


def generate(output):
    snapshot_bytes = (ROOT / SNAPSHOT).read_bytes()
    snapshot = json.loads(snapshot_bytes)
    if snapshot['id'] != '3-2' or len(snapshot['files']) != 75:
        raise ValueError('정본 3-2의 75개 파일이 필요함')
    originals = {}
    records = []
    for entry in snapshot['files']:
        name = safe_path(entry['path'])
        blob = entry['blob']
        if not re.fullmatch(r'[a-f0-9]{40}', blob):
            raise ValueError(f'잘못된 blob ID: {name}')
        data = (ROOT / f'scenario/snapshots/blobs/{blob}.txt').read_bytes()
        actual_blob = hashlib.sha1(f'blob {len(data)}\0'.encode() + data).hexdigest()
        if actual_blob != blob or name in originals:
            raise ValueError(f'원본 blob 해시 불일치 또는 중복: {name}')
        originals[name] = data
        records.append({'path': name, 'blob': blob, 'source': f'scenario/snapshots/blobs/{blob}.txt',
                        'sourceSha256': sha256(data)})
    supplements = {}
    extra_records = []
    for name in SUPPLEMENTS:
        safe_path(name)
        if name in originals:
            raise ValueError(f'보충 파일이 정본과 겹침: {name}')
        data = (ROOT / name).read_bytes()
        supplements[name] = data
        extra_records.append({'path': name, 'source': name, 'sha256': sha256(data),
                              'reason': 'snapshot에 없는 실행 보조 파일을 현재 저장소 루트에서 보충'})
    source_info = {'id': snapshot['id'], 'path': SNAPSHOT, 'sha256': sha256(snapshot_bytes),
                   'fileCount': len(originals), 'source': snapshot['source'],
                   'recordedCommit': snapshot['commit'],
                   'authority': 'files[].blob의 파일별 정적 내용. recordedCommit tree로 대체하지 않음'}
    manifest = {'schemaVersion': 1, 'sourceSnapshot': source_info,
                'supplementalFiles': extra_records, 'packages': []}
    output.mkdir(parents=True, exist_ok=True)
    for index, task in enumerate(TASKS):
        stubs = list(METHODS[index:]) if task != 'reference' else []
        provided = list(METHODS[:index]) if task != 'reference' else list(METHODS)
        content = dict(originals)
        for method in stubs:
            name = service_path(method)
            content[name] = stub_method(content[name].decode('utf-8'), method).encode('utf-8')
        package_records = [dict(record, sha256=sha256(content[record['path']]),
                                stubMethods=[name for name in stubs if service_path(name) == record['path']])
                           for record in records]
        provenance = {'schemaVersion': 1, 'taskId': task, 'kind': 'answer' if task == 'reference' else 'starter',
                      'sourceSnapshot': source_info, 'stubMethods': stubs, 'providedMethods': provided,
                      'files': package_records, 'supplementalFiles': extra_records}
        content.update(supplements)
        content['README-LEARNING.md'] = learning_readme(task, stubs, provided)
        content['PACKAGE-MANIFEST.json'] = json_bytes(provenance)
        zip_path = output / f'{task}.zip'
        with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for name, data in sorted(content.items()):
                info = zipfile.ZipInfo(safe_path(name), ZIP_DATE)
                info.create_system = 3
                mode = 0o755 if name in ('gradlew', 'docker/cloudbeaver/start.sh') else 0o644
                info.external_attr = (0o100000 | mode) << 16
                info.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(info, data, compresslevel=9)
        # UI 코드 열람용 두 서비스만 별도로 둔다. 나머지는 원본 blob을 읽는다.
        for name in sorted({service_path(method) for method in METHODS}):
            code_path = output / 'code' / task / Path(name).name
            code_path.parent.mkdir(parents=True, exist_ok=True)
            code_path.write_bytes(content[name])
        manifest['packages'].append({'taskId': task, 'kind': provenance['kind'],
                                    'url': f'scenario/flow/packages/{task}.zip',
                                    'sourceSnapshot': source_info, 'stubMethods': stubs,
                                    'providedMethods': provided, 'sha256': sha256(zip_path.read_bytes()),
                                    'bytes': zip_path.stat().st_size})
    (output / 'manifest.json').write_bytes(json_bytes(manifest))
    print(f'6 packages generated: {output} (75 verified static blobs each)')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, default=OUTPUT)
    generate(parser.parse_args().output_dir.resolve())
