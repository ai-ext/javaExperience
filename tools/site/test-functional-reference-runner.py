#!/usr/bin/env python3
"""실제 Docker/DB 없이 검증기의 안전 경계와 실패 판정을 확인한다."""
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import sys
import unittest
from unittest import mock
import zipfile

sys.dont_write_bytecode = True
SPEC = importlib.util.spec_from_file_location('reference_runner', Path(__file__).with_name('verify-functional-reference.py'))
assert SPEC is not None and SPEC.loader is not None, 'reference runner가 필요함'
runner = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(runner)


def archive(entries):
    data = io.BytesIO()
    with zipfile.ZipFile(data, 'w') as z:
        for name, value in entries:
            z.writestr(name, value)
    return data.getvalue()


class Guards(unittest.TestCase):
    def test_zip_hash_and_path_guards(self):
        good = archive([('build.gradle', b'example')])
        with tempfile.TemporaryDirectory() as folder:
            runner.safe_extract(good, hashlib.sha256(good).hexdigest(), Path(folder))
            self.assertEqual((Path(folder) / 'build.gradle').read_bytes(), b'example')
            with self.assertRaises(ValueError):
                runner.safe_extract(good, '0' * 64, Path(folder))
            for name in ('../escape', '/etc/passwd', 'C:\\escape', 'a/../escape'):
                bad = archive([(name, b'bad')])
                with self.assertRaises(ValueError):
                    runner.safe_extract(bad, hashlib.sha256(bad).hexdigest(), Path(folder))

    def test_zip_symlink_rejected(self):
        link = zipfile.ZipInfo('link')
        link.create_system = 3
        link.external_attr = 0o120777 << 16
        bad = archive([(link, b'/etc/passwd')])
        with tempfile.TemporaryDirectory() as folder, self.assertRaises(ValueError):
            runner.safe_extract(bad, hashlib.sha256(bad).hexdigest(), Path(folder))

    def test_sql_id_only_positive_json_integer(self):
        self.assertEqual(runner.sql_id(42), '42')
        for value in (True, False, 0, -1, 1.5, '42', '1 OR 1=1', None):
            with self.assertRaises(ValueError):
                runner.sql_id(value)

    def test_http_204_must_be_empty_and_wrong_status_fails(self):
        runner.expect_http({'status': 204, 'body': ''}, 204)
        for response, status in (({'status': 204, 'body': 'unexpected'}, 204),
                                 ({'status': 500, 'body': ''}, 201)):
            with self.assertRaises(AssertionError):
                runner.expect_http(response, status)

    def test_container_ownership_requires_id_name_and_run_label(self):
        identity = {'id': 'a' * 64, 'name': '/javaexperience-crud-run1',
                    'labels': {runner.LABEL: 'run1'}}
        self.assertTrue(runner.owns_container(identity, 'a' * 64, 'javaexperience-crud-run1', 'run1'))
        for changed in ({'id': 'b' * 64}, {'name': '/existing'}, {'labels': {runner.LABEL: 'other'}}):
            self.assertFalse(runner.owns_container(dict(identity, **changed), 'a' * 64, 'javaexperience-crud-run1', 'run1'))

    def test_cleanup_never_removes_foreign_container(self):
        with tempfile.TemporaryDirectory() as folder:
            subject = runner.Runner(Path(folder))
            subject.container_id = 'a' * 64
            foreign = {'id': 'a' * 64, 'name': '/' + subject.name,
                       'labels': {runner.LABEL: 'another-run'}}
            with mock.patch.object(subject, 'inspect', return_value=foreign), mock.patch.object(runner, 'command') as command:
                errors = subject.cleanup()
                self.assertTrue(errors)
                command.assert_not_called()

    def test_reference_provenance_uses_only_package_and_snapshot(self):
        with tempfile.TemporaryDirectory() as folder:
            subject = runner.Runner(Path(folder))
            subject.load_reference(Path(folder) / 'project')
            self.assertEqual(subject.report['source']['files'], 75)
            self.assertEqual(subject.report['preflight']['gradleWrapper'], '9.8.0 (ZIP hash/provenance verified)')
            self.assertIsNone(subject.container_id)

    def test_seed_copy_happens_only_after_ownership_and_storage_checks(self):
        with tempfile.TemporaryDirectory() as folder:
            subject = runner.Runner(Path(folder))
            subject.temporary = mock.Mock(name=folder)
            subject.temporary.name = folder
            subject.project = Path(folder) / 'project'
            cid = 'a' * 64
            identity = {'id': cid, 'name': '/' + subject.name,
                        'labels': {runner.LABEL: subject.run_id}, 'mounts': [],
                        'tmpfs': {'/var/lib/mysql': 'rw,nosuid,size=512m'},
                        'ports': {'3306/tcp': [{'HostIp': '127.0.0.1', 'HostPort': '65432'}]}}
            events = []

            def command(args, **kwargs):
                events.append(args)
                if args[1] == 'create':
                    Path(args[args.index('--cidfile') + 1]).write_text(cid)
                    self.assertNotIn('--mount', args)
                    return cid
                return ''

            with mock.patch.object(runner, 'command', side_effect=command), \
                 mock.patch.object(subject, 'inspect', return_value=identity), \
                 mock.patch.object(subject, 'sql', return_value=['1']):
                subject.start_mysql()
            self.assertEqual([args[1] for args in events], ['create', 'cp', 'start'])
            self.assertEqual(events[1][-1], cid + ':/docker-entrypoint-initdb.d')
            self.assertEqual(subject.report['isolation']['storage'], 'tmpfs')
            # bind/volume을 발견하면 초기 SQL도 복사하거나 기동하지 않는다.
            identity['mounts'] = [{'Type': 'bind', 'Destination': '/existing'}]
            events.clear()
            with mock.patch.object(runner, 'command', side_effect=command), \
                 mock.patch.object(subject, 'inspect', return_value=identity):
                with self.assertRaises(AssertionError):
                    subject.start_mysql()
            self.assertEqual([args[1] for args in events], ['create'])

    def test_stop_only_own_process_group(self):
        process = mock.Mock(pid=12345)
        process.poll.return_value = None
        with mock.patch.object(runner.os, 'getpgid', return_value=999), mock.patch.object(runner.os, 'killpg') as kill:
            with self.assertRaises(RuntimeError):
                runner.stop_process(process)
            kill.assert_not_called()
        with mock.patch.object(runner.os, 'getpgid', return_value=12345), mock.patch.object(runner.os, 'killpg') as kill:
            runner.stop_process(process)
            self.assertEqual(kill.call_args.args[0], 12345)

    def test_not_run_and_failure_are_never_passed(self):
        for error, expected, code in ((runner.NotRun('Docker unavailable'), 'not_run', 2),
                                      (AssertionError('POST mismatch'), 'failed', 1)):
            with tempfile.TemporaryDirectory() as folder, mock.patch.object(runner.Runner, 'execute', side_effect=error):
                result = runner.main(['--output-dir', folder])
                self.assertEqual(result, code)
                report = json.loads((Path(folder) / 'report.json').read_text())
                self.assertEqual(report['status'], expected)
                self.assertFalse(report['browserVerified'])

    def test_public_fixture_token_redacted_from_report_text(self):
        self.assertNotIn('tok-kimjava', runner.redact('Authorization: Bearer tok-kimjava'))


if __name__ == '__main__':
    unittest.main()
