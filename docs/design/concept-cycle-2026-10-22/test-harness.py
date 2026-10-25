import importlib.util
import hashlib
import json
import os
import tempfile
import unittest
from pathlib import Path
from subprocess import CompletedProcess, TimeoutExpired
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("run_harness", HERE / "run-harness.py")
harness = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(harness)


class HarnessTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.cycle = self.root / "docs/design/concept-cycle-2026-10-22"
        self.tasks_dir = self.cycle / "tasks"
        self.site = self.root / "tools/site"
        self.site.mkdir(parents=True)
        self.tasks_dir.mkdir(parents=True)
        (self.root / "docs/knowledge").mkdir(parents=True)
        tasks = []
        scripts = {}
        for number in range(1, 25):
            task_id = f"task{number}"
            doc_id = "P09" if number == 1 else f"P{number:02}"
            source = f"docs/knowledge/{doc_id}.md"
            source_bytes = b"stable source\n"
            (self.root / source).write_bytes(source_bytes)
            slug = doc_id.lower()
            scripts[f"test:{slug}"] = f"node test-{slug}.mjs"
            tasks.append({"taskId": task_id, "number": number, "documentId": doc_id, "source": source,
                          "sourceSHA256": hashlib.sha256(source_bytes).hexdigest(),
                          "harnessCommand": ["npm", "--prefix", "tools/site", "run", f"test:{slug}"]})
        queued_source = b"queued source\n"
        (self.root / "docs/knowledge/D11.md").write_bytes(queued_source)
        tasks.append({"taskId": "task25", "number": 25, "documentId": "D11",
                      "source": "docs/knowledge/D11.md",
                      "sourceSHA256": hashlib.sha256(queued_source).hexdigest(),
                      "harnessCommand": None})
        (self.site / "package.json").write_text(json.dumps({"scripts": scripts}))
        self.registry = {"tasks": tasks}
        (self.cycle / "tasks.json").write_text(json.dumps(self.registry))

    def tearDown(self):
        self.temp.cleanup()

    def _run(self, runner, task_id="task1", output_root=None):
        return harness.run_task(task_id, repo_root=self.root, output_root=output_root, runner=runner, head_reader=lambda _: "deadbeef")

    def _register_executable_task(self, number, document_id):
        task_id = f"task{number}"
        source = f"docs/knowledge/{document_id}.md"
        source_bytes = f"stable {document_id}\n".encode()
        (self.root / source).write_bytes(source_bytes)
        task = {
            "taskId": task_id,
            "number": number,
            "documentId": document_id,
            "source": source,
            "sourceSHA256": hashlib.sha256(source_bytes).hexdigest(),
            "harnessCommand": ["npm", "--prefix", "tools/site", "run", f"test:{document_id.lower()}"],
        }
        existing_index = next(
            (index for index, existing in enumerate(self.registry["tasks"])
             if isinstance(existing, dict) and existing.get("taskId") == task_id),
            None,
        )
        if existing_index is None:
            self.registry["tasks"].append(task)
        else:
            self.registry["tasks"][existing_index] = task
        package_path = self.site / "package.json"
        package = json.loads(package_path.read_text())
        package["scripts"][f"test:{document_id.lower()}"] = f"node test-{document_id.lower()}.mjs"
        package_path.write_text(json.dumps(package))
        (self.cycle / "tasks.json").write_text(json.dumps(self.registry))
        return task

    def test_executes_allowlisted_argv_without_shell_and_records_latest_and_raw_run(self):
        seen = []
        def runner(argv, **kwargs):
            seen.append((argv, kwargs))
            return CompletedProcess(argv, 0, stdout="ok\n", stderr="")
        result = self._run(runner)
        self.assertEqual(seen[0][0], ["npm", "--prefix", "tools/site", "run", "test:p09"])
        self.assertIs(seen[0][1]["shell"], False)
        self.assertEqual(seen[0][1]["cwd"], str(self.root.resolve()))
        latest = json.loads((self.tasks_dir / "task1/harness.json").read_text())
        self.assertEqual(latest["latestRun"], result["runDirectory"])
        raw = self.tasks_dir / "task1" / result["runDirectory"]
        self.assertTrue((raw / "stdout.log").is_file())
        self.assertEqual(json.loads((raw / "result.json").read_text())["exitCode"], 0)
        second = self._run(lambda argv, **kwargs: CompletedProcess(argv, 0, stdout="new run\n", stderr=""))
        self.assertNotEqual(result["runDirectory"], second["runDirectory"])
        self.assertTrue((self.tasks_dir / "task1" / result["runDirectory"] / "result.json").is_file())
        latest = json.loads((self.tasks_dir / "task1/harness.json").read_text())
        self.assertEqual(latest["latestRun"], second["runDirectory"])

    def test_nonzero_child_exit_is_failure(self):
        result = self._run(lambda argv, **kwargs: CompletedProcess(argv, 7, stdout="", stderr="bad"))
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["exitCode"], 7)

    def test_invalid_and_queued_tasks_are_rejected_without_launch(self):
        for task_id in ("task0", "task110", "taskx"):
            with self.subTest(task_id=task_id):
                with self.assertRaises(harness.HarnessError):
                    self._run(lambda *args, **kwargs: self.fail("runner must not be called"), task_id)

        queued = self._run(
            lambda *args, **kwargs: self.fail("queued task must not launch"),
            "task25",
        )
        self.assertEqual(queued["status"], "failed")
        self.assertEqual(queued["executionStatus"], "not_run")
        self.assertIn("queued task", queued["error"])

    def test_registered_task25_executes_only_its_fixed_script_and_records_raw_result(self):
        self._register_executable_task(25, "D11")
        seen = []
        def runner(argv, **kwargs):
            seen.append((argv, kwargs))
            return CompletedProcess(argv, 0, stdout="task25 ok\n", stderr="")

        result = self._run(runner, "task25")
        self.assertEqual(result["status"], "passed")
        self.assertEqual(seen[0][0], ["npm", "--prefix", "tools/site", "run", "test:d11"])
        self.assertIs(seen[0][1]["shell"], False)
        task_output = self.tasks_dir / "task25"
        latest = json.loads((task_output / "harness.json").read_text())
        self.assertEqual(latest["latestRun"], result["runDirectory"])
        raw = task_output / result["runDirectory"]
        self.assertEqual((raw / "stdout.log").read_text(), "task25 ok\n")
        self.assertEqual(json.loads((raw / "result.json").read_text())["status"], "passed")

    def test_registered_task134_is_within_the_planned_execution_range(self):
        self._register_executable_task(134, "W26")
        result = self._run(
            lambda argv, **kwargs: CompletedProcess(argv, 0, stdout="last planned task\n", stderr=""),
            "task134",
        )
        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["argv"], ["npm", "--prefix", "tools/site", "run", "test:w26"])

    def test_task_above_plan_limit_is_rejected_even_when_registered(self):
        self._register_executable_task(135, "D11X")
        with self.assertRaises(harness.HarnessError):
            self._run(lambda *args, **kwargs: self.fail("runner must not be called"), "task135")

    def test_duplicate_task_id_is_rejected(self):
        duplicate = dict(self.registry["tasks"][0])
        duplicate["number"] = 99
        self.registry["tasks"].append(duplicate)
        (self.cycle / "tasks.json").write_text(json.dumps(self.registry))
        with self.assertRaises(harness.HarnessError):
            self._run(lambda *args, **kwargs: self.fail("runner must not be called"), "task1")

    def test_duplicate_task_number_is_rejected(self):
        duplicate = dict(self.registry["tasks"][0])
        duplicate["taskId"] = "task99"
        self.registry["tasks"].append(duplicate)
        (self.cycle / "tasks.json").write_text(json.dumps(self.registry))
        with self.assertRaises(harness.HarnessError):
            self._run(lambda *args, **kwargs: self.fail("runner must not be called"), "task1")

    def test_registry_command_must_match_fixed_npm_argv(self):
        self.registry["tasks"][0]["harnessCommand"] = ["sh", "-c", "echo unsafe"]
        (self.cycle / "tasks.json").write_text(json.dumps(self.registry))
        result = self._run(lambda *args, **kwargs: self.fail("runner must not be called"))
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["executionStatus"], "not_run")
        self.assertIn("허용된 npm argv", result["error"])

    def test_source_change_is_failure_even_when_command_passes(self):
        source = self.root / "docs/knowledge/P09.md"
        def runner(argv, **kwargs):
            source.write_text("changed during command\n")
            return CompletedProcess(argv, 0, stdout="", stderr="")
        result = self._run(runner)
        self.assertEqual(result["status"], "failed")
        self.assertTrue(result["sourceChangedDuringRun"])
        self.assertNotEqual(result["sourceSHA256Before"], result["sourceSHA256After"])

    def test_head_change_is_recorded_as_failure(self):
        observed = iter(("before", "after"))
        result = harness.run_task(
            "task1", repo_root=self.root, runner=lambda argv, **kwargs: CompletedProcess(argv, 0, stdout="", stderr=""),
            head_reader=lambda _: next(observed),
        )
        self.assertEqual(result["status"], "failed")
        self.assertTrue(result["headChangedDuringRun"])

    def test_missing_head_before_or_after_fails_closed(self):
        for observed in ((None, None), ("deadbeef", None)):
            with self.subTest(observed=observed):
                reads = iter(observed)
                launched = []
                def runner(argv, **kwargs):
                    launched.append(argv)
                    return CompletedProcess(argv, 0, stdout="", stderr="")
                result = harness.run_task(
                    "task1", repo_root=self.root,
                    runner=runner,
                    head_reader=lambda _: next(reads),
                )
                self.assertEqual(result["status"], "failed")
                self.assertFalse(result["headAvailableBeforeAndAfter"])
                self.assertEqual(bool(launched), observed[0] is not None)

    def test_stale_registry_source_hash_prevents_launch(self):
        task = self.registry["tasks"][0]
        task["sourceSHA256"] = "0" * 64
        (self.cycle / "tasks.json").write_text(json.dumps(self.registry))
        launched = []
        def runner(*args, **kwargs):
            launched.append(args)
            return CompletedProcess(args[0], 0, stdout="", stderr="")
        result = self._run(runner)
        self.assertEqual(launched, [])
        self.assertEqual(result["executionStatus"], "not_run")
        self.assertIn("stale", result["error"].lower())
        self.assertEqual(result["registrySourceSHA256"], "0" * 64)

    def test_tools_site_code_fingerprint_change_fails(self):
        code_file = self.site / "controller.mjs"
        code_file.write_text("export const value = 1;\n")
        def runner(argv, **kwargs):
            code_file.write_text("export const value = 2;\n")
            return CompletedProcess(argv, 0, stdout="", stderr="")
        result = self._run(runner)
        self.assertEqual(result["status"], "failed")
        self.assertNotEqual(
            result["codeFingerprintBefore"]["aggregateSHA256"],
            result["codeFingerprintAfter"]["aggregateSHA256"],
        )

    def test_missing_code_fingerprint_prevents_launch_and_fails(self):
        launched = []
        def runner(*args, **kwargs):
            launched.append(args)
            return CompletedProcess(args[0], 0, stdout="", stderr="")
        with patch.object(harness, "code_fingerprint", side_effect=[(None, "read denied"), (None, "read denied")]):
            result = self._run(runner)
        self.assertEqual(launched, [])
        self.assertEqual(result["status"], "failed")
        self.assertFalse(result["codeFingerprintAvailableBeforeAndAfter"])
        self.assertIn("fingerprint", result["error"])

    def test_logical_tasks_root_symlink_is_rejected(self):
        self.tasks_dir.rmdir()
        outside = self.root / "outside"
        outside.mkdir()
        self.tasks_dir.symlink_to(outside, target_is_directory=True)
        with self.assertRaises(harness.HarnessError):
            self._run(lambda *args, **kwargs: self.fail("runner must not be called"))
        self.assertFalse((outside / "task1").exists())

    def test_task_directory_symlink_cannot_overwrite_sibling_harness(self):
        task2 = self.tasks_dir / "task2"
        task2.mkdir()
        original = task2 / "harness.json"
        original.write_text('{"taskId":"task2"}\n')
        (self.tasks_dir / "task1").symlink_to(task2, target_is_directory=True)
        with self.assertRaises(harness.HarnessError):
            self._run(lambda *args, **kwargs: self.fail("runner must not be called"))
        self.assertEqual(json.loads(original.read_text())["taskId"], "task2")

    def test_launch_error_is_recorded_and_failure(self):
        def runner(argv, **kwargs):
            raise OSError("npm missing")
        result = self._run(runner)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["executionStatus"], "launch_error")
        self.assertIn("npm missing", result["error"])

    def test_timeout_is_recorded_and_failure(self):
        def runner(argv, **kwargs):
            raise TimeoutExpired(argv, 1, output="partial", stderr="timeout")
        result = self._run(runner)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["executionStatus"], "timeout")
        raw = self.tasks_dir / "task1" / result["runDirectory"]
        self.assertIn("partial", (raw / "stdout.log").read_text())

    def test_output_root_cannot_escape_audit_tasks_folder(self):
        outside = self.root / "elsewhere"
        with self.assertRaises(harness.HarnessError):
            self._run(lambda *args, **kwargs: self.fail("runner must not be called"), output_root=outside)

    def test_missing_npm_script_is_recorded_as_not_run(self):
        package_path = self.site / "package.json"
        package_path.write_text(json.dumps({"scripts": {}}))
        result = self._run(lambda *args, **kwargs: self.fail("runner must not be called"))
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["executionStatus"], "not_run")
        self.assertIn("test:p09", result["error"])

    def test_runs_directory_symlink_cannot_write_outside_audit_tasks(self):
        task_dir = self.tasks_dir / "task1"
        task_dir.mkdir()
        outside = self.root / "outside"
        outside.mkdir()
        (task_dir / "runs").symlink_to(outside, target_is_directory=True)
        with self.assertRaises(harness.HarnessError):
            self._run(lambda *args, **kwargs: self.fail("runner must not be called"))

    def test_runner_created_run_directory_symlink_is_rejected_before_raw_writes(self):
        outside = self.root / "outside-run"
        outside.mkdir()
        def runner(argv, **kwargs):
            run_dir = next((self.tasks_dir / "task1/runs").iterdir())
            run_dir.rmdir()
            run_dir.symlink_to(outside, target_is_directory=True)
            return CompletedProcess(argv, 0, stdout="would escape\n", stderr="")
        with self.assertRaises(harness.HarnessError):
            self._run(runner)
        self.assertEqual(list(outside.iterdir()), [])

    def test_predicted_pid_json_temp_symlink_cannot_overwrite_sentinel(self):
        task_dir = self.tasks_dir / "task1"
        sentinel = self.root / "sentinel.json"
        sentinel.write_text('{"preserve":"sentinel"}\n')
        predicted_temp = task_dir / f".harness.json.{os.getpid()}.tmp"
        def runner(argv, **kwargs):
            predicted_temp.symlink_to(sentinel)
            return CompletedProcess(argv, 0, stdout="", stderr="")
        result = self._run(runner)
        self.assertEqual(result["status"], "passed")
        self.assertEqual(sentinel.read_text(), '{"preserve":"sentinel"}\n')
        self.assertTrue(predicted_temp.is_symlink())

    def test_raw_log_and_result_entries_are_created_exclusively(self):
        for name in ("stdout.log", "stderr.log", "result.json"):
            with self.subTest(name=name):
                sentinel = self.root / f"{name}.sentinel"
                sentinel.write_text("keep me\n")
                def runner(argv, **kwargs):
                    runs = self.tasks_dir / "task1/runs"
                    run_dir = max(runs.iterdir(), key=lambda path: path.name)
                    (run_dir / name).symlink_to(sentinel)
                    return CompletedProcess(argv, 0, stdout="replace me\n", stderr="")
                with self.assertRaises(harness.HarnessError):
                    self._run(runner)
                self.assertEqual(sentinel.read_text(), "keep me\n")

    def test_existing24_continues_after_failure_and_returns_failure(self):
        # 실제 레지스트리 전체 24개를 흉내 내지 않고, 함수에 주입된 task 목록만 확인한다.
        calls = []
        def runner(argv, **kwargs):
            calls.append(argv)
            return CompletedProcess(argv, 2 if len(calls) == 1 else 0, stdout="", stderr="")
        results, exit_code = harness.run_existing24(repo_root=self.root, runner=runner, head_reader=lambda _: "deadbeef")
        self.assertEqual(len(results), 24)
        self.assertEqual(exit_code, 1)
        self.assertEqual(len(calls), 24)


if __name__ == "__main__":
    unittest.main()
