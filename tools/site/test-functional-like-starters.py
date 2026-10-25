#!/usr/bin/env python3
"""확장 ZIP이 기존 CRUD를 덮어쓰지 않는지 실제 임시 프로젝트에서 검사한다."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('like_starters',Path(__file__).with_name('generate-functional-like-starters.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class LikeStarterChecks(unittest.TestCase):
    def test_additive_package_contains_no_root_src_and_preserves_learner_crud(self):
        with tempfile.TemporaryDirectory() as tmp:
            output=Path(tmp)/'packages';module.generate(output)
            with zipfile.ZipFile(output/'like-extension.zip') as archive:
                names=archive.namelist()
                self.assertEqual(len(names),9)
                self.assertFalse(any(name.startswith('src/') for name in names))
                additions=[n for n in names if n.startswith('additions/')]
                self.assertEqual(len(additions),6)
                self.assertTrue(all('/org/example/like/' in n for n in additions))
                patch=archive.read('post-like-support.patch')
                self.assertNotIn(b'PostService.java',patch)
                self.assertNotIn(b'PostQueryService.java',patch)
                service=archive.read('additions/src/main/java/org/example/like/LikeService.java').decode()
                self.assertEqual(service.count('throw new UnsupportedOperationException'),2)
                project=Path(tmp)/'learner';project.mkdir()
                old=module.read_snapshot('3-2')[1]
                for name,data in old.items():
                    destination=project/name;destination.parent.mkdir(parents=True,exist_ok=True);destination.write_bytes(data)
                post_service=project/'src/main/java/org/example/post/PostService.java'
                marker=b'// learner-owned implementation marker\n'+post_service.read_bytes();post_service.write_bytes(marker)
                patch_path=Path(tmp)/'post-like-support.patch';patch_path.write_bytes(patch)
                subprocess.run(['git','apply','--check',str(patch_path)],cwd=project,check=True,capture_output=True)
                subprocess.run(['git','apply',str(patch_path)],cwd=project,check=True,capture_output=True)
                self.assertEqual(post_service.read_bytes(),marker)
                reference=module.read_snapshot('4-1')[1]
                for name in module.PATCH_PATHS:self.assertEqual((project/name).read_bytes(),reference[name])
                retry=subprocess.run(['git','apply','--check',str(patch_path)],cwd=project,capture_output=True)
                self.assertNotEqual(retry.returncode,0,'이미 반영된 프로젝트를 중복 적용하지 않음')
    def test_midjoin_packages_only_stub_the_current_and_later_like_methods(self):
        with tempfile.TemporaryDirectory() as tmp:
            output=Path(tmp);module.generate(output)
            for name,stubs in [('like',['like','unlike']),('unlike',['unlike']),('reference',[])]:
                with zipfile.ZipFile(output/(name+'.zip')) as archive:
                    manifest=json.loads(archive.read('PACKAGE-MANIFEST.json'))
                    self.assertEqual(manifest['stubMethods'],stubs)
                    self.assertEqual(manifest['sourceSnapshot']['fileCount'],82)
                    self.assertEqual(len(manifest['files']),82)
                    original=module.read_snapshot('4-1')[1]
                    for entry in manifest['files']:
                        data=archive.read(entry['path'])
                        self.assertEqual(module.common.sha256(data),entry['sha256'])
                        if entry['path']!=module.SERVICE:self.assertEqual(data,original[entry['path']])
                    self.assertEqual(archive.read(module.SERVICE).decode().count('throw new UnsupportedOperationException'),len(stubs))
                    self.assertIn('새 폴더',archive.read('README-LEARNING.md').decode())
                    self.assertEqual(archive.getinfo('gradlew').external_attr>>16&0o777,0o755)
    def test_generation_is_reproducible_and_existing_crud_packages_are_unchanged(self):
        old={p.name:p.read_bytes() for p in (module.ROOT/'scenario/flow/packages').glob('*.zip')}
        with tempfile.TemporaryDirectory() as tmp:
            a=Path(tmp)/'a';b=Path(tmp)/'b';module.generate(a);module.generate(b)
            for p in a.rglob('*'):
                if p.is_file():self.assertEqual(p.read_bytes(),(b/p.relative_to(a)).read_bytes())
        self.assertEqual(old,{p.name:p.read_bytes() for p in (module.ROOT/'scenario/flow/packages').glob('*.zip')})

if __name__=='__main__':unittest.main()
