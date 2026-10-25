#!/usr/bin/env python3
"""좋아요 검증기의 정본 구성과 입력 경계를 DB 없이 검사한다."""
import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('like_runner', Path(__file__).with_name('verify-functional-like-reference.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class LikeRunnerGuards(unittest.TestCase):
    def test_materialize_4_1_exact_files_and_keep_3_2_reference_unchanged(self):
        original = (module.reference.ROOT / 'scenario/flow/packages/reference.zip').read_bytes()
        with tempfile.TemporaryDirectory() as folder:
            runner = module.LikeRunner(Path(folder))
            runner.load_reference(Path(folder)/'project')
            self.assertEqual(runner.report['likeSource']['files'],82)
            self.assertEqual(runner.report['likeSource']['addedFiles'],7)
            self.assertEqual(runner.report['likeSource']['changedFiles'],2)
            service=(runner.project/'src/main/java/org/example/like/LikeService.java').read_text()
            self.assertIn('public LikeResponse like(',service)
            self.assertIn('public LikeResponse unlike(',service)
            self.assertEqual(original,(module.reference.ROOT/'scenario/flow/packages/reference.zip').read_bytes())
            self.assertIsNone(runner.container_id)
    def test_actor_allowlist_rejects_unknown_token_before_network(self):
        with tempfile.TemporaryDirectory() as folder:
            runner=module.LikeRunner(Path(folder))
            with self.assertRaises(ValueError):runner.like_http('PUT','/api/posts/42/like',actor='foreign')
    def test_relation_sql_only_uses_captured_positive_numeric_id(self):
        with tempfile.TemporaryDirectory() as folder:
            runner=module.LikeRunner(Path(folder))
            for value in [True,'42','1 OR 1=1',0,-1]:
                with self.assertRaises(ValueError):runner.relations(value)
    def test_failure_check_uses_title_not_mysql_auto_increment_id(self):
        with tempfile.TemporaryDirectory() as folder:
            runner=module.LikeRunner(Path(folder))
            for direction,condition in [('upper','like_count <= 2'),('lower','like_count >= 3')]:
                sql=runner.counter_check_sql(direction)
                self.assertIn("title <> '좋아요 확장 검증'",sql)
                self.assertIn(condition,sql)
                self.assertNotIn(' id ',sql)
            with self.assertRaises(ValueError):runner.counter_check_sql('unexpected')

if __name__=='__main__':unittest.main()
