#!/usr/bin/env python3
"""참고 ZIP 전용 격리 MySQL/API CRUD 검증. 학생 src·기존 DB·브라우저에는 접근하지 않는다."""
import argparse
import hashlib
import io
import json
import math
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import signal
import socket
import stat
import subprocess
import tempfile
import time
from urllib import error, request
import uuid
import zipfile

ROOT = Path(__file__).resolve().parents[2]
LABEL = 'org.javaexperience.crud.reference-run'
TOKEN = 'tok-kimjava'  # 공개 seed의 연습용 토큰. 요청/로그에는 값 자체를 기록하지 않는다.
MAX_ARCHIVE_BYTES = 64 * 1024 * 1024


class NotRun(RuntimeError):
    pass


def redact(value):
    return str(value).replace(TOKEN, '[REDACTED_FIXTURE_TOKEN]')


def digest(data):
    return hashlib.sha256(data).hexdigest()


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def safe_extract(data, expected_hash, target):
    if digest(data) != expected_hash:
        raise ValueError('reference ZIP SHA-256 불일치')
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        entries = z.infolist()
        names = [item.filename for item in entries]
        if len(names) != len(set(names)) or sum(item.file_size for item in entries) > MAX_ARCHIVE_BYTES:
            raise ValueError('중복 경로 또는 ZIP 크기 한도 초과')
        for item in entries:
            name = item.filename
            path = PurePosixPath(name)
            if (not name or path.is_absolute() or '..' in path.parts or '\\' in name
                    or ':' in name or str(path) != name or item.is_dir()
                    or stat.S_ISLNK(item.external_attr >> 16)):
                raise ValueError('안전하지 않은 ZIP 경로/파일 유형')
        # 검사가 모두 끝난 뒤에만 쓴다. extractall의 경로 처리에 의존하지 않는다.
        for item in entries:
            destination = target.joinpath(*PurePosixPath(item.filename).parts)
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(z.read(item))
            destination.chmod(0o755 if item.filename == 'gradlew' else 0o644)


def sql_id(value):
    if type(value) is not int or value <= 0:
        raise ValueError('SQL 식별자는 응답에서 캡처한 양의 JSON 정수만 허용')
    return str(value)


def expect_http(response, status):
    check(response['status'] == status, f'HTTP 상태 불일치: expected={status}, actual={response["status"]}')
    if status == 204:
        check(response['body'] == '', '204 응답 본문이 비어 있지 않음')


def owns_container(identity, container_id, name, run_id):
    return (identity.get('id') == container_id and identity.get('name') == '/' + name
            and identity.get('labels', {}).get(LABEL) == run_id)


def stop_process(process):
    if process is None or process.poll() is not None:
        return
    if os.getpgid(process.pid) != process.pid:
        raise RuntimeError('자신이 생성한 process group이 아니므로 종료하지 않음')
    os.killpg(process.pid, signal.SIGTERM)
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        if os.getpgid(process.pid) != process.pid:
            raise RuntimeError('process group 소유권 변경으로 강제 종료하지 않음')
        os.killpg(process.pid, signal.SIGKILL)
        process.wait(timeout=5)


def command(args, *, timeout=15, cwd=None, env=None, input_text=None):
    result = subprocess.run(args, cwd=cwd, env=env, input=input_text, text=True,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
    if result.returncode:
        # argv/env는 비밀값이 포함될 수 있어 에러에 기록하지 않는다.
        raise RuntimeError(redact(f'{Path(args[0]).name}: exit={result.returncode}; {result.stderr[-2000:]}'))
    return result.stdout


class Runner:
    def __init__(self, output):
        self.output = output
        self.run_id = uuid.uuid4().hex
        self.name = 'javaexperience-crud-' + self.run_id
        self.container_id = None
        self.creation_attempted = False
        self.app = None
        self.app_log = None
        self.build = None
        self.temporary = None
        self.env = None
        self.java = None
        self.report = {'status': 'not_run', 'runId': self.run_id,
                       'startedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                       'browserVerified': False,
                       'scope': '별도 reference ZIP의 격리 MySQL/API 동작. 브라우저/UI 검증이 아님.',
                       'preflight': {}, 'requests': [], 'observations': [], 'checks': [], 'cleanup': []}

    def load_reference(self, folder):
        packages = ROOT / 'scenario/flow/packages'
        manifest = json.loads((packages / 'manifest.json').read_text())
        pkg = next(item for item in manifest['packages'] if item['taskId'] == 'reference')
        check(pkg['kind'] == 'answer' and pkg['stubMethods'] == [], '완성 참고 답안 패키지가 아님')
        check(pkg['url'] == 'scenario/flow/packages/reference.zip', '고정 참고 ZIP 경로 불일치')
        source = manifest['sourceSnapshot']
        check(source['path'] == 'scenario/snapshots/3-2.json' and source['id'] == '3-2', '정본 snapshot 불일치')
        snapshot_bytes = (ROOT / source['path']).read_bytes()
        check(digest(snapshot_bytes) == source['sha256'], '정본 snapshot manifest 해시 불일치')
        snapshot = json.loads(snapshot_bytes)
        check(len(snapshot['files']) == source['fileCount'] == 75, '정본 75개 파일 필요')
        data = (packages / 'reference.zip').read_bytes()
        # 압축 해제 전 경로·해시를 검사하고 임시 프로젝트에만 쓴다.
        safe_extract(data, pkg['sha256'], folder)
        provenance = json.loads((folder / 'PACKAGE-MANIFEST.json').read_text())
        check(provenance['kind'] == 'answer' and provenance['taskId'] == 'reference'
              and provenance['stubMethods'] == [] and provenance['sourceSnapshot'] == source,
              'ZIP 출처가 외부 manifest와 다름')
        records = {item['path']: item for item in provenance['files']}
        check(len(records) == len(provenance['files']) == 75, 'ZIP 정본 기록 수 불일치')
        for original in snapshot['files']:
            item = records[original['path']]
            content = (folder / original['path']).read_bytes()
            blob = hashlib.sha1(f'blob {len(content)}\0'.encode() + content).hexdigest()
            check(blob == original['blob'] == item['blob'], 'ZIP 원본 Git blob 해시 불일치')
            check(digest(content) == item['sha256'] == item['sourceSha256'], 'ZIP 원본 SHA-256 불일치')
            check(item['stubMethods'] == [], '참고 답안에 미구현 메서드 존재')
        check(provenance['supplementalFiles'] == manifest['supplementalFiles'], '보충 파일 출처 불일치')
        for item in provenance['supplementalFiles']:
            extra = PurePosixPath(item['path'])
            check(not extra.is_absolute() and '..' not in extra.parts and '\\' not in item['path']
                  and str(extra) == item['path'], '보충 파일 경로가 안전하지 않음')
            check(digest((folder / item['path']).read_bytes()) == item['sha256'], '보충 파일 해시 불일치')
        actual = {str(item.relative_to(folder)) for item in folder.rglob('*') if item.is_file()}
        allowed = set(records) | {item['path'] for item in provenance['supplementalFiles']}
        check(actual == allowed | {'README-LEARNING.md', 'PACKAGE-MANIFEST.json'}, '선언되지 않은 ZIP 파일')
        check((folder / 'gradlew').is_file() and (folder / 'gradle/wrapper/gradle-wrapper.jar').is_file(), 'Gradle wrapper 없음')
        wrapper = (folder / 'gradle/wrapper/gradle-wrapper.properties').read_text()
        check('gradle-9.8.0-bin.zip' in wrapper, '검증 기준 Gradle wrapper 9.8.0 불일치')
        self.report['preflight']['gradleWrapper'] = '9.8.0 (ZIP hash/provenance verified)'
        self.report['source'] = {'referenceSha256': pkg['sha256'], 'snapshotSha256': source['sha256'], 'files': 75}
        self.project = folder

    def preflight(self):
        candidates = []
        if Path('/usr/libexec/java_home').exists():
            try:
                home = command(['/usr/libexec/java_home', '-v', '21'], timeout=5).strip()
                candidates.append(str(Path(home) / 'bin/java'))
            except (RuntimeError, subprocess.TimeoutExpired):
                pass
        if os.environ.get('JAVA_HOME'):
            candidates.append(str(Path(os.environ['JAVA_HOME']) / 'bin/java'))
        if shutil.which('java'):
            candidates.append(shutil.which('java'))
        for candidate in dict.fromkeys(candidates):
            try:
                result = subprocess.run([candidate, '-version'], capture_output=True, text=True, timeout=5)
                version = result.stdout + result.stderr
                if result.returncode == 0 and re.search(r'version "21(?:[.\"]|$)', version):
                    self.java = candidate
                    self.report['preflight']['java'] = version.splitlines()[0]
                    break
            except (OSError, subprocess.TimeoutExpired):
                pass
        if not self.java:
            raise NotRun('JDK 21을 찾지 못해 실행하지 않음. 설치/버전 변경 미실시.')
        if not shutil.which('docker'):
            raise NotRun('Docker CLI가 없어 실행하지 않음. 설치/환경 변경 미실시.')
        try:
            docker_version = command(['docker', 'info', '--format', '{{.ServerVersion}}'], timeout=8).strip()
        except (RuntimeError, subprocess.TimeoutExpired, OSError) as exc:
            self.report['preflight']['docker'] = 'unavailable'
            raise NotRun('Docker daemon 가용성 확인 실패(8초 상한, 재시도 없음): ' + redact(exc)) from exc
        check(bool(docker_version), 'Docker 서버 버전이 비어 있음')
        self.report['preflight']['docker'] = docker_version
        # 외부 설정/비밀 환경변수를 앱과 Gradle에 전달하지 않는다.
        self.env = {key: os.environ[key] for key in ('PATH', 'HOME', 'LANG', 'TMPDIR') if key in os.environ}
        self.env['JAVA_HOME'] = str(Path(self.java).resolve().parents[1])

    def inspect(self):
        template = ('{"id":{{json .Id}},"name":{{json .Name}},"labels":{{json .Config.Labels}},'
                    '"ports":{{json .NetworkSettings.Ports}},"mounts":{{json .Mounts}},'
                    '"tmpfs":{{json .HostConfig.Tmpfs}}}')
        return json.loads(command(['docker', 'inspect', '--format', template, self.container_id], timeout=8))

    def check_container(self):
        identity = self.inspect()
        check(owns_container(identity, self.container_id, self.name, self.run_id), '컨테이너 소유권 불일치')
        return identity

    def start_mysql(self):
        cid_file = Path(self.temporary.name) / 'created-container.cid'
        args = ['docker', 'create', '--cidfile', str(cid_file), '--name', self.name, '--label', f'{LABEL}={self.run_id}',
                '--tmpfs', '/var/lib/mysql:rw,nosuid,size=512m',
                '--publish', '127.0.0.1::3306', '-e', 'MYSQL_DATABASE=community', '-e', 'MYSQL_USER=community',
                '-e', 'MYSQL_PASSWORD=community', '-e', 'MYSQL_ROOT_PASSWORD=reference-fixture-only', '-e', 'TZ=Asia/Seoul',
                'mysql:8.4', '--character-set-server=utf8mb4', '--collation-server=utf8mb4_0900_ai_ci']
        self.creation_attempted = True
        try:
            returned_id = command(args, timeout=180).strip()
        finally:
            if cid_file.exists():
                self.container_id = cid_file.read_text().strip()
        check(self.container_id is not None and re.fullmatch('[a-f0-9]{64}', self.container_id), '생성 CID 파일의 ID 형식 불일치')
        check(returned_id == self.container_id, '생성 stdout ID와 CID 파일 불일치')
        identity = self.check_container()
        mounts = identity.get('mounts') or []
        check('/var/lib/mysql' in (identity.get('tmpfs') or {}), 'MySQL 데이터 tmpfs 설정 확인 실패')
        check(not any(item.get('Type') in ('volume', 'bind') for item in mounts), '비영속 실행에 volume/bind가 생겨 기동하지 않음')
        # Docker Desktop의 호스트 공유 경로 설정에 의존하지 않는다.
        # 정본 검사를 통과한 초기 SQL만 소유권을 확인한 새 컨테이너에 복사한다.
        command(['docker', 'cp', str(self.project / 'docker/mysql/init') + '/.',
                 self.container_id + ':/docker-entrypoint-initdb.d'], timeout=20)
        command(['docker', 'start', self.container_id])
        identity = self.check_container()
        bindings = (identity.get('ports') or {}).get('3306/tcp') or []
        check(len(bindings) == 1 and bindings[0]['HostIp'] == '127.0.0.1', 'MySQL loopback 전용 publish 필요')
        self.db_port = int(bindings[0]['HostPort'])
        check(self.db_port != 13308, '기존 실습용 13308 포트 사용 거절')
        self.report['isolation'] = {'containerId': self.container_id, 'containerName': self.name,
                                    'label': LABEL, 'mysqlPort': self.db_port, 'storage': 'tmpfs', 'image': 'mysql:8.4',
                                    'seedTransfer': 'docker cp after ownership check; no host bind mount'}
        deadline = time.monotonic() + 120
        while time.monotonic() < deadline:
            try:
                if self.sql('SELECT 1') == ['1']:
                    return
            except (RuntimeError, subprocess.TimeoutExpired):
                pass
            time.sleep(1)
        raise RuntimeError('격리 MySQL 초기화/연결이 120초 안에 완료되지 않음')

    def sql(self, statement):
        result = command(['docker', 'exec', '-e', 'MYSQL_PWD=community', self.container_id,
                          'mysql', '-h', '127.0.0.1', '-ucommunity', '--default-character-set=utf8mb4',
                          '--batch', '--raw', '--skip-column-names', 'community', '-e', statement], timeout=10)
        return result.strip().splitlines() if result.strip() else []

    def start_app(self):
        # Gradle과 앱은 각각 자신이 만든 process group만 종료한다.
        build_log = self.output / 'build.log'
        with build_log.open('w') as log:
            self.build = subprocess.Popen(['bash', './gradlew', '--no-daemon', '--console=plain', 'bootJar'],
                                          cwd=self.project, env=self.env, stdout=log, stderr=subprocess.STDOUT,
                                          start_new_session=True)
            try:
                code = self.build.wait(timeout=240)
            except subprocess.TimeoutExpired:
                stop_process(self.build)
                raise RuntimeError('참고 ZIP bootJar가 240초를 초과함')
        check(code == 0, '참고 ZIP bootJar 실패. build.log 확인 필요')
        jars = [file for file in (self.project / 'build/libs').glob('*.jar') if not file.name.endswith('-plain.jar')]
        check(len(jars) == 1, '실행할 bootJar가 정확히 하나가 아님')
        # 바인딩 전 잠시 예약한 가용 포트를 반환한다. 경합 시 실제 기동 실패로 보고한다.
        with socket.socket() as listener:
            listener.bind(('127.0.0.1', 0))
            self.app_port = listener.getsockname()[1]
        app_env = dict(self.env)
        app_env.update({'SPRING_DATASOURCE_URL': f'jdbc:mysql://127.0.0.1:{self.db_port}/community?characterEncoding=UTF-8&serverTimezone=Asia/Seoul',
                        'SPRING_DATASOURCE_USERNAME': 'community', 'SPRING_DATASOURCE_PASSWORD': 'community',
                        'SERVER_ADDRESS': '127.0.0.1', 'SERVER_PORT': str(self.app_port),
                        'LOGGING_LEVEL_ORG_HIBERNATE_ORM_JDBC_BIND': 'OFF',
                        'LOGGING_LEVEL_ORG_HIBERNATE_SQL': 'OFF'})
        self.app_log = (self.output / 'app.log').open('w')
        self.app = subprocess.Popen([self.java, '-jar', str(jars[0])], cwd=self.project, env=app_env,
                                    stdout=self.app_log, stderr=subprocess.STDOUT, start_new_session=True)
        self.base_url = f'http://127.0.0.1:{self.app_port}'
        deadline = time.monotonic() + 90
        while time.monotonic() < deadline:
            check(self.app.poll() is None, '참고 API 서버가 기동 중 종료됨. app.log 확인 필요')
            try:
                response = self.http('GET', '/api/start/ping', authenticated=False, record=False)
                if response['status'] == 200 and response['body'] == 'pong':
                    self.report['isolation']['appPort'] = self.app_port
                    return
            except (OSError, error.URLError):
                pass
            time.sleep(0.5)
        raise RuntimeError('격리 API 서버가 90초 안에 준비되지 않음')

    def http(self, method, path, body=None, *, authenticated=True, record=True):
        headers = {'Content-Type': 'application/json'}
        if authenticated:
            headers['Authorization'] = 'Bearer ' + TOKEN
        data = json.dumps(body, ensure_ascii=False).encode() if body is not None else None
        req = request.Request(self.base_url + path, data=data, headers=headers, method=method)
        # 프록시 환경/리다이렉트를 사용하지 않고 자신이 만든 loopback API에만 요청한다.
        opener = request.build_opener(request.ProxyHandler({}), NoRedirect())
        try:
            response = opener.open(req, timeout=10)
        except error.HTTPError as exc:
            response = exc
        with response:
            result = {'status': response.code, 'body': response.read().decode('utf-8'),
                      'location': response.headers.get('Location'), 'contentType': response.headers.get('Content-Type')}
        if record:
            self.report['requests'].append({'method': method, 'path': path, 'json': body,
                                            'authenticated': authenticated, 'response': result})
        return result

    def observe(self, post_id, stage):
        number = sql_id(post_id)
        columns = ('id', 'board_id', 'author_id', 'title', 'content', 'status', 'visibility',
                   'view_count', 'like_count', 'comment_count', 'published_at', 'created_at', 'updated_at', 'deleted_at')
        pairs = ','.join(f"'{name}',{name}" for name in columns)
        rows = self.sql(f'SELECT JSON_OBJECT({pairs}) FROM post WHERE id={number}')
        check(len(rows) == 1, '작성한 DB 행이 정확히 하나가 아님')
        result = json.loads(rows[0])
        result['tags'] = [json.loads(row) for row in self.sql(
            f"SELECT JSON_OBJECT('id',t.id,'name',t.name) FROM tag t JOIN post_tag pt ON pt.tag_id=t.id WHERE pt.post_id={number} ORDER BY t.id")]
        result['relations'] = json.loads(self.sql(
            "SELECT JSON_OBJECT('postTags',(SELECT COUNT(*) FROM post_tag WHERE post_id=" + number
            + "),'likes',(SELECT COUNT(*) FROM post_like WHERE post_id=" + number
            + "),'comments',(SELECT COUNT(*) FROM `comment` WHERE post_id=" + number
            + "),'bookmarks',(SELECT COUNT(*) FROM bookmark WHERE post_id=" + number + '))')[0])
        self.report['observations'].append({'stage': stage, 'post': result})
        return result

    def assert_same(self, first, second, excluded=()):
        for key in first:
            if key not in excluded:
                check(first[key] == second[key], f'DB 필드가 의도와 다르게 변경됨: {key}')

    def listing(self):
        response = self.http('GET', '/api/boards/dev/posts?page=0&size=50')
        expect_http(response, 200)
        result = json.loads(response['body'])
        for field in ('items', 'page', 'size', 'totalElements', 'totalPages', 'hasNext'):
            check(field in result, f'목록 메타 누락: {field}')
        check(result['page'] == 0 and result['size'] == 50, '목록 page/size 불일치')
        total = result['totalElements']
        check(type(total) is int and total >= 0 and result['totalPages'] == math.ceil(total / 50), '목록 총계/페이지 불일치')
        check(type(result['hasNext']) is bool and result['hasNext'] == (total > 50), '목록 hasNext 불일치')
        items = result['items']
        keys = [(item['publishedAt'], item['id']) for item in items]
        check(keys == sorted(keys, reverse=True), 'publishedAt/id 내림차순 불일치')
        check(all('content' not in item for item in items), '목록에 본문 content가 노출됨')
        check(len(items) == min(total, 50), '목록 항목 수와 메타 불일치')
        return result

    def flow(self):
        actor_rows = self.sql("SELECT JSON_OBJECT('id',m.id,'nickname',m.nickname,'role',m.role,'status',m.member_status) FROM member m JOIN api_token a ON a.member_id=m.id WHERE a.token='" + TOKEN + "'")
        check(len(actor_rows) == 1, '연습 토큰에 대응하는 seed 회원이 없음')
        actor = json.loads(actor_rows[0])
        self.report['actor'] = actor
        tags = ['spring', '새태그-' + self.run_id[:8]]
        body = {'boardSlug': 'dev', 'title': '새게시글', 'content': '본문', 'tags': tags, 'visibility': 'PUBLIC'}
        response = self.http('POST', '/api/posts', body)
        expect_http(response, 201)
        created = json.loads(response['body'])
        post_id = created.get('id')
        number = sql_id(post_id)
        post_path = '/api/posts/' + number
        check(response['location'] == post_path, 'Location과 생성 id 불일치')
        for field in ('boardSlug', 'title', 'content', 'visibility'):
            check(created[field] == body[field], f'작성 응답 {field} 불일치')
        check(set(created['tags']) == set(tags) and created['author']['id'] == actor['id'], '작성 태그/인증 작성자 불일치')
        before = self.observe(post_id, 'created')
        board_id = int(self.sql("SELECT id FROM board WHERE slug='dev'")[0])
        check(before['board_id'] == board_id and before['author_id'] == actor['id'], '작성 board/author DB 불일치')
        for field in ('title', 'content', 'visibility'):
            check(before[field] == body[field], f'저장 필드 {field} 불일치')
        check(before['status'] == 'PUBLISHED' and before['deleted_at'] is None, '작성 상태/삭제 시각 불일치')
        check(all(before[field] == 0 for field in ('view_count', 'like_count', 'comment_count')), '작성 카운터 0이 아님')
        check(before['created_at'] == before['updated_at'] == before['published_at'], '작성 시각 초기값 불일치')
        check({item['name'] for item in before['tags']} == set(tags), 'DB 태그 관계 저장 불일치')
        self.report['checks'].append('POST 201/Location/DTO/DB 저장/인증 작성자/태그/초기 카운터')
        response = self.http('GET', post_path)
        expect_http(response, 200)
        detail = json.loads(response['body'])
        check(detail['id'] == post_id and detail['viewCount'] == 1, '상세 id/조회수 불일치')
        after_get = self.observe(post_id, 'detail')
        check(after_get['view_count'] == 1, '상세 GET DB 조회수 증가 불일치')
        self.assert_same(before, after_get, ('view_count',))
        self.report['checks'].append('GET 상세 조회수 +1, created/updated/published 및 다른 필드 보존')
        listed = self.listing()
        matches = [item for item in listed['items'] if item['id'] == post_id]
        check(len(matches) == 1 and matches[0]['viewCount'] == 1, '목록에 생성 글/조회수 누락')
        self.assert_same(after_get, self.observe(post_id, 'listed'))
        self.report['checks'].append('LIST 정렬/메타/본문 제외/생성 글 포함/조회수 불변')
        response = self.http('PATCH', post_path, {'title': '수정한제목'})
        expect_http(response, 200)
        patched = json.loads(response['body'])
        check(patched['id'] == post_id and patched['title'] == '수정한제목', 'PATCH 응답 불일치')
        check(patched['content'] == body['content'] and set(patched['tags']) == set(tags)
              and patched['viewCount'] == 1, 'PATCH 응답의 기존 값 손실')
        after_patch = self.observe(post_id, 'patched')
        check(after_patch['title'] == '수정한제목' and after_patch['updated_at'] is not None, 'PATCH DB 반영 실패')
        self.assert_same(after_get, after_patch, ('title', 'updated_at'))
        self.report['checks'].append('PATCH 제목만 변경; updatedAt은 DB 정밀도상 이전과 달라야 한다고 단정하지 않음')
        response = self.http('DELETE', post_path)
        expect_http(response, 204)
        after_delete = self.observe(post_id, 'deleted')
        check(after_delete['deleted_at'] is not None and after_delete['updated_at'] == after_delete['deleted_at'], 'soft delete 두 시각 불일치')
        self.assert_same(after_patch, after_delete, ('updated_at', 'deleted_at'))
        self.report['checks'].append('DELETE 204 빈 본문/행 유지/deletedAt=updatedAt/태그 및 관계 보존')
        for method, data in (('GET', None), ('PATCH', {'title': '숨긴글수정'}), ('DELETE', None)):
            expect_http(self.http(method, post_path, data), 404)
        final_list = self.listing()
        check(all(item['id'] != post_id for item in final_list['items']), '삭제 글이 목록에 남음')
        check(final_list['totalElements'] == listed['totalElements'] - 1, '삭제 후 목록 총계 불일치')
        self.assert_same(after_delete, self.observe(post_id, 'after-rejected-requests'))
        self.report['checks'].append('삭제 후 GET/PATCH/재DELETE 404 및 목록 제외; DB 추가 변화 없음')
        self.report['capturedPostId'] = post_id

    def execute(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='javaexperience-reference-')
        self.load_reference(Path(self.temporary.name) / 'project')
        self.preflight()
        self.start_mysql()
        self.start_app()
        self.flow()

    def cleanup(self):
        errors = []
        for name, process in (('app', self.app), ('build', self.build)):
            try:
                stop_process(process)
                if process is not None:
                    self.report['cleanup'].append(name + ': own process group stopped/exited')
            except Exception as exc:
                errors.append(redact(exc))
        if self.app_log:
            self.app_log.close()
        if self.creation_attempted and not self.container_id:
            errors.append('생성 요청 후 CID를 받지 못해 소유권을 증명할 수 없음. 임의 삭제하지 않고 임시폴더 유지: ' + self.name)
        if self.container_id:
            try:
                self.check_container()
                command(['docker', 'rm', '--force', self.container_id], timeout=20)
                self.report['cleanup'].append('removed own ID/name/run-label matched container; volumes untouched')
            except Exception as exc:
                errors.append('컨테이너 소유권 확인/정리 실패; 다른 리소스 정리 안 함: ' + redact(exc))
        if self.temporary:
            if errors:
                self.report['retainedTemporaryDirectory'] = self.temporary.name
                # 활성 리소스가 참조할 수 있는 mount 경로를 자동 삭제하지 않는다.
                self.temporary._finalizer.detach()
            else:
                self.temporary.cleanup()
        return errors


class NoRedirect(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def main(argv=None, *, runner_type=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', required=True, type=Path,
                        help='리서치 작업 폴더의 새/빈 실행 폴더. report.json/build.log/app.log 저장')
    args = parser.parse_args(argv)
    output = args.output_dir.expanduser().resolve()
    if output == ROOT or ROOT in output.parents or 'src' in output.parts:
        parser.error('--output-dir은 학생 소스/저장소 밖의 리서치 폴더로 지정하세요.')
    output.mkdir(parents=True, exist_ok=True)
    if any(output.iterdir()):
        parser.error('--output-dir은 기존 결과를 덮어쓰지 않도록 빈 폴더여야 합니다.')
    runner = (runner_type or Runner)(output)
    code = 0
    try:
        runner.execute()
        runner.report['status'] = 'passed'
    except NotRun as exc:
        code = 2
        runner.report.update(status='not_run', reason=redact(exc))
    except (Exception, KeyboardInterrupt) as exc:
        code = 1
        runner.report.update(status='failed', reason=redact(f'{type(exc).__name__}: {exc}'))
    finally:
        errors = runner.cleanup()
        if errors:
            code = 1
            runner.report.update(status='failed', cleanupErrors=errors)
        runner.report['finishedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        (output / 'report.json').write_text(redact(json.dumps(runner.report, ensure_ascii=False, indent=2)) + '\n')
        for filename in ('app.log', 'build.log'):
            log = output / filename
            if log.exists():
                log.write_text(redact(log.read_text(errors='replace')))
    print(json.dumps({'status': runner.report['status'], 'report': str(output / 'report.json')}, ensure_ascii=False))
    return code


if __name__ == '__main__':
    raise SystemExit(main())
