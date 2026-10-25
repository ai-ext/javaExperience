import copy
import hashlib
import importlib.util
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location('reviewed_harness', ROOT / 'docs/design/concept-cycle-2026-10-22/run-harness.py')
h = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(h)
assert json.loads((HERE / '01-spec-review.json').read_text())['verdict'] == 'PASS'
observations = []


def check(name, exercise):
    exercise()
    observations.append({'name': name, 'verdict': 'PASS'})


class Fixture:
    def __init__(self):
        self.temp = tempfile.TemporaryDirectory(prefix='harness-sol-')
        self.root = Path(self.temp.name).resolve()
        self.cycle = self.root / h.CONTRACT_DIR
        self.cycle.mkdir(parents=True)
        (self.root / 'docs/knowledge').mkdir()
        (self.root / 'tools/site').mkdir(parents=True)
        self.tasks = []
        self.scripts = {}
        for n in range(1, 135):
            document = f'D{n}'
            source = f'docs/knowledge/{document}.md'
            raw = f'source {n}\n'.encode()
            (self.root / source).write_bytes(raw)
            command = ['npm', '--prefix', 'tools/site', 'run', f'test:d{n}'] if n <= 25 or n == 134 else None
            self.tasks.append({'number': n, 'taskId': f'task{n}', 'documentId': document, 'source': source,
                               'sourceSHA256': hashlib.sha256(raw).hexdigest(), 'harnessCommand': command})
            if command:
                self.scripts[command[-1]] = 'node fixture-test.mjs'
        self.calls = []
        self.flush()

    def flush(self):
        (self.cycle / 'tasks.json').write_text(json.dumps({'tasks': self.tasks}))
        (self.root / 'tools/site/package.json').write_text(json.dumps({'scripts': self.scripts}))

    def runner(self, argv, **kwargs):
        self.calls.append((argv, kwargs))
        assert kwargs['shell'] is False
        assert kwargs['cwd'] == str(self.root)
        assert kwargs['timeout'] == 9
        return subprocess.CompletedProcess(argv, 0, 'fixture success\n', 'fixture stderr\n')

    def run(self, task='task25', **kwargs):
        self.flush()
        return h.run_task(task, repo_root=self.root, runner=kwargs.pop('runner', self.runner),
                          head_reader=kwargs.pop('head_reader', lambda _: 'fixed-head'), timeout_seconds=9, **kwargs)

    def rejected(self, task='task25', **kwargs):
        try:
            result = self.run(task, **kwargs)
            assert result['status'] == 'failed' and result['executionStatus'] == 'not_run', result
        except h.HarnessError:
            pass
        assert not self.calls


def isolated(action):
    def run():
        f = Fixture()
        try:
            action(f)
        finally:
            f.temp.cleanup()
    return run


def valid(f, number):
    result = f.run(f'task{number}')
    assert result['status'] == 'passed'
    assert len(f.calls) == 1
    assert result['argv'] == ['npm', '--prefix', 'tools/site', 'run', f'test:d{number}']


for n in (1, 24, 25, 134):
    check(f'valid fixed argv task{n}', isolated(lambda f, n=n: valid(f, n)))
for task in ('task0', 'task01', 'task-1', 'task25 ', 'task25/../task1', 'task135', 'task999', 'taskx', '', 'TASK25', 'task25\n'):
    check(f'malformed/outside {task!r}', isolated(lambda f, task=task: f.rejected(task)))


def registered135(f):
    t = copy.deepcopy(f.tasks[24]); t.update(number=135, taskId='task135')
    f.tasks.append(t)
    f.rejected('task135')


check('registered135 still rejected', isolated(registered135))
check('queued26 never launches', isolated(lambda f: f.rejected('task26')))
check('unregistered25 rejected', isolated(lambda f: (f.tasks.pop(24), f.rejected())))
for field, value in [('number', 26), ('number', '25'), ('number', 25.0), ('number', True), ('taskId', 'task26')]:
    check(f'identity mismatch {field}={value!r}', isolated(lambda f, field=field, value=value: (f.tasks[24].update({field: value}), f.rejected())))
for field, value in [('number', 99), ('taskId', 'task99')]:
    def duplicate(f, field=field, value=value):
        t = copy.deepcopy(f.tasks[24]); t[field] = value; f.tasks.append(t); f.rejected()
    check(f'duplicate identity by modifying {field}', isolated(duplicate))
for argv in [
    ['sh', '-c', 'echo bad'], ['npm', '--prefix', 'tools/site', 'run', 'test:d26'],
    ['npm', '--prefix', 'tools/site', 'run', 'test:d25', '--', '--flag'],
    ['npm', '--prefix', 'elsewhere', 'run', 'test:d25'], 'npm --prefix tools/site run test:d25',
    ['npm', '--prefix', 'tools/site', 'run', 'test:d25;echo bad'], [], None,
]:
    check(f'command tamper {argv!r}', isolated(lambda f, argv=argv: (f.tasks[24].update(harnessCommand=argv), f.rejected())))
for document in ('D25;echo', '../D25', 'D-25', '25', '', None, 'D25\n'):
    check(f'document invalid {document!r}', isolated(lambda f, document=document: (f.tasks[24].update(documentId=document), f.rejected())))
for value in (None, '0'*64, 'x'*64, 'abc', 42):
    check(f'source sha invalid {value!r}', isolated(lambda f, value=value: (f.tasks[24].update(sourceSHA256=value), f.rejected())))
check('missing package script', isolated(lambda f: (f.scripts.pop('test:d25'), f.rejected())))
check('missing source file', isolated(lambda f: ((f.root / f.tasks[24]['source']).unlink(), f.rejected())))
check('source traversal outside', isolated(lambda f: (f.tasks[24].update(source='../outside.md'), f.rejected())))


def source_symlink(f):
    with tempfile.TemporaryDirectory() as target:
        outside = Path(target) / 'source.md'; outside.write_text('outside\n')
        path = f.root / f.tasks[24]['source']; path.unlink(); path.symlink_to(outside)
        f.tasks[24]['sourceSHA256'] = hashlib.sha256(outside.read_bytes()).hexdigest()
        f.rejected()


check('outside source symlink rejected', isolated(source_symlink))
check('output outside tasks rejected', isolated(lambda f: f.rejected(output_root=f.root / 'elsewhere')))


def append_only(f):
    first = f.run()
    raw = f.cycle / 'tasks/task25' / first['runDirectory']
    before = {p.name: p.read_bytes() for p in raw.iterdir()}
    second = f.run(runner=lambda argv, **kwargs: subprocess.CompletedProcess(argv, 7, 'second output\n', 'failed\n'))
    assert second['status'] == 'failed' and first['runDirectory'] != second['runDirectory']
    assert before == {p.name: p.read_bytes() for p in raw.iterdir()}
    latest = json.loads((f.cycle / 'tasks/task25/harness.json').read_text())
    assert latest['latestRun'] == second['runDirectory'] and latest['result'] == second
    second_raw = f.cycle / 'tasks/task25' / second['runDirectory']
    assert (second_raw / 'stdout.log').read_text() == 'second output\n'
    assert json.loads((second_raw / 'result.json').read_text()) == second


check('append-only full prior bytes / failed latest pointer', isolated(append_only))


def existing24(f):
    f.flush()
    results, code = h.run_existing24(repo_root=f.root, runner=f.runner, head_reader=lambda _: 'fixed-head', timeout_seconds=9)
    assert code == 0 and [r['taskId'] for r in results] == [f'task{i}' for i in range(1, 25)]
    assert len(f.calls) == 24 and all(r['status'] == 'passed' for r in results)


check('fixture existing24 exact order without25', isolated(existing24))


def timeout(f):
    def runner(argv, **kwargs):
        raise subprocess.TimeoutExpired(argv, 9, output=b'partial stdout', stderr=b'partial stderr')
    r = f.run(runner=runner)
    assert r['status'] == 'failed' and r['executionStatus'] == 'timeout'
    raw = f.cycle / 'tasks/task25' / r['runDirectory']
    assert (raw / 'stdout.log').read_text() == 'partial stdout'


check('task25 timeout retains partial output', isolated(timeout))
(HERE / '03-independent-probes.json').write_text(json.dumps({'verdict': 'PASS', 'count': len(observations), 'checks': observations,
 'runner': 'injected CompletedProcess or TimeoutExpired only; no npm/native/external child execution',
 'fixture': 'TemporaryDirectory; all task outputs isolated from real tasks'}, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'verdict': 'PASS', 'checks': len(observations)}))
