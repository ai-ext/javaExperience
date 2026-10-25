#!/usr/bin/env python3
"""좋아요 추가 자료와 별도 중간 합류 ZIP. 학생 src와 기존 CRUD 패키지는 수정하지 않는다."""
import argparse
import difflib
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import zipfile
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('crud_starters',Path(__file__).with_name('generate-functional-starters.py'))
common=importlib.util.module_from_spec(spec);spec.loader.exec_module(common)
ROOT=common.ROOT
OUTPUT=ROOT/'scenario/flow/packages/like'
SERVICE='src/main/java/org/example/like/LikeService.java'
PATCH_PATHS=('src/main/java/org/example/post/Post.java','src/main/java/org/example/common/ApiExceptionHandler.java')

def read_snapshot(snapshot_id):
    if snapshot_id not in ('3-2','4-1'):raise ValueError('3-2 또는 4-1 정본이 필요합니다.')
    path=f'scenario/snapshots/{snapshot_id}.json';raw=(ROOT/path).read_bytes();snapshot=json.loads(raw)
    expected=75 if snapshot_id=='3-2' else 82
    if snapshot['id']!=snapshot_id or len(snapshot['files'])!=expected:raise ValueError('정본 파일 수 불일치')
    files={};records=[]
    for entry in snapshot['files']:
        name=common.safe_path(entry['path']);blob=entry['blob']
        if len(blob)!=40 or any(c not in '0123456789abcdef' for c in blob):raise ValueError('blob 형식 오류')
        data=(ROOT/'scenario/snapshots/blobs'/f'{blob}.txt').read_bytes()
        if hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest()!=blob or name in files:raise ValueError('blob 해시 또는 중복 경로 오류')
        files[name]=data;records.append({'path':name,'blob':blob,'sourceSha256':common.sha256(data)})
    source={'id':snapshot_id,'path':path,'fileCount':expected,'sha256':common.sha256(raw),'authority':'files[].blob; commit tree로 대체하지 않음'}
    return source,files,records

def write_zip(path,content):
    with zipfile.ZipFile(path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
        for name,data in sorted(content.items()):
            info=zipfile.ZipInfo(common.safe_path(name),common.ZIP_DATE);info.create_system=3
            mode=0o755 if name in ('gradlew','docker/cloudbeaver/start.sh') else 0o644
            info.external_attr=(0o100000|mode)<<16;info.compress_type=zipfile.ZIP_DEFLATED
            archive.writestr(info,data,compresslevel=9)

def addon_readme():
    return '''# 같은 프로젝트에 좋아요 기능 추가하기

이 ZIP은 기존 CRUD 프로젝트를 완성 코드로 교체하지 않습니다. 새 폴더 `like-extension`에
풀어 자료를 확인합니다. 압축 안에는 루트 src 경로가 없고 additions 아래 새 파일 6개와
기존 두 파일에 적용할 작은 patch만 있습니다. 자동 설치·복사·DB 초기화를 실행하지 않습니다.

## 준비 상태

앞의 작성·상세·목록·수정·삭제를 같은 프로젝트에서 직접 구현한 상태입니다.
PostService와 PostQueryService는 이 자료에 들어 있지 않으며 사용자의 구현을 유지합니다.
같은 community DB를 사용합니다. post_like 테이블·UNIQUE(post_id,member_id)는 기존 3-2 DDL에
이미 있으므로 SQL dump를 다시 넣거나 DB를 지우지 않습니다.

## 한 번만 추가할 파일

기존 앱만 종료합니다. 기존 프로젝트의 org/example/like 패키지에 같은 이름의 파일이
하나라도 있으면 전체 복사를 중단하고 기존 파일과 직접 대조합니다. 없을 때만 additions의
LikeController.java, LikeResponse.java, LikeService.java, PostLike.java,
PostLikeRepository.java, SelfLikeNotAllowedException.java를 같은 경로에 추가합니다.
원본 파일을 덮어쓰지 않습니다. LikeService의 like·unlike 본문은 둘 다 미구현입니다.

post-like-support.patch는 Post.java에 increaseLikeCount·decreaseLikeCount를 추가하고,
ApiExceptionHandler.java에 자기 글 좋아요 400 handler를 추가합니다.
기존 CRUD 메서드는 바꾸지 않습니다. 기존 프로젝트 터미널에서 먼저
`git apply --check ../like-extension/post-like-support.patch`로 전체 적용 가능 여부를 확인하고,
성공한 경우에만 `git apply ../like-extension/post-like-support.patch`를 실행합니다.
이 명령은 프로젝트와 like-extension을 같은 상위 폴더에 둔 경우입니다.
확인 실패는 이미 적용했거나 코드 문맥이 다른 경우이므로 강제 적용하지 않습니다.
patch의 두 작은 추가 내용을 IDE에서 대조해 직접 반영합니다. 정본 파일 전체로 교체하지 않습니다.

## 구현 순서

1. LikeService.java#like: PUT /api/posts/{id}/like. 현재 관계가 없을 때만 추가하고 숫자를 늘립니다.
2. LikeService.java#unlike: DELETE /api/posts/{id}/like. 현재 관계가 있을 때만 제거하고 숫자를 줄입니다.

두 메서드의 @Transactional·Controller·DTO·helper는 제공됩니다. 요청 본문은 없고 두 API 모두
200과 postId/liked/likeCount를 응답합니다. like를 구현하는 동안 아직 unlike를 호출하면
미구현 오류가 나며, 이것을 PUT 과제의 실패로 보지 않습니다.
코드를 저장한 뒤 `./gradlew compileJava`, `./gradlew bootRun`으로 앱만 다시 실행합니다.
DB 포트를 바꿨다면 앞 과제에서 사용한 SPRING_DATASOURCE_URL을 그대로 사용합니다.

## 삭제한 글이나 본인 글을 성공 예제로 사용하지 않기

마지막 CRUD에서 삭제한 id는 좋아요에 사용하면 404입니다. 같은 프로젝트의 기존 POST를
다시 사용해 다른 회원이 dev에 새 PUBLIC 글을 만들고 응답 id를 기록합니다.
공개 교육용 seed에서는 작성 tok-park(회원4), 좋아요 요청 tok-kimjava(회원2) 조합을 씁니다.
서로 다른 회원임을 실제 응답 author와 DB에서 확인합니다. 토큰은 수동 입력하며 자동 저장하지 않습니다.
고정 3이나 시각화의 42를 실제 생성 id 대신 사용하지 않습니다.
PUT 자기 글은400이지만 관계 없는 본인 글 DELETE는200·liked=false입니다.

같은 id·같은 회원으로 PUT→PUT→DELETE→DELETE를 보내 전체 카운트와 내 관계 수를 확인합니다.
다른 회원의 좋아요가 있으면 그 행은 남아야 합니다. 상태는 뒤집는 toggle이 아닙니다.
존재 확인+카운터 변경만으로 모든 동시 요청의 정합성이 해결되지는 않습니다. 동시성은 다음4-2입니다.
정답·원문은 scenario/ch4-like/4-1-like-toggle에 보존되어 있으며 직접 구현한 뒤 비교합니다.
'''.encode()

def midjoin_readme(task,stubs):
    kind='완성 참고 답안' if task=='reference' else '별도 중간 합류 starter'
    provided='like·unlike 모두 제공' if task=='reference' else 'like만 제공' if task=='unlike' else '아직 없음'
    return f'''# 좋아요 {kind} · {task}

이 ZIP은 정본4-1의 파일별 blob82개로 재구성한 별도 프로젝트입니다.
현재 미구현 메서드: {', '.join(stubs) or '없음'}
좋아요 제공 메서드: {provided}
앞 CRUD 다섯 기능은 정본 구현입니다. 기존 프로젝트 위에 풀면 사용자 구현을 덮어쓰므로,
중간 합류가 필요한 경우에만 반드시 새 폴더에 풉니다. 기존 프로젝트에서 이어가려면
like-extension.zip의 새 파일과 작은 patch만 추가합니다.

DB는 앞 과제의 community를 계속 사용합니다. 새 폴더에서 Compose를 다시 만들거나 DB를
초기화하지 않습니다. 기존 앱만 종료하고 새 폴더에서 chmod +x gradlew 후
./gradlew compileJava, ./gradlew bootRun으로 실행합니다. JDK21·Gradle9.8.0이며
기본 DB는 localhost:13308/community입니다. 다른 DB 포트였다면 기존
SPRING_DATASOURCE_URL을 유지합니다. 원래 starter의 상세 준비 안내도 참고합니다.

원문 snapshot의 commit tree가 아닌 files[].blob이 출처입니다. 추가 wrapper/Compose 파일의
출처는 PACKAGE-MANIFEST.json의 supplementalFiles에 별도 기록합니다.
미구현 메서드를 호출하는 테스트는 완성 전 실패합니다. compile 성공은 기능 완료가 아닙니다.
완성 참고 답안은 직접 구현한 뒤 비교합니다.

같은 서버에서 다른 회원이 새 PUBLIC 글을 POST한 실제 id를 기록합니다.
교육용 작성 tok-park, 좋아요 tok-kimjava를 각 화면에 수동 입력합니다.
삭제한 CRUD id나 고정 예시42를 이어받지 않습니다. PUT·DELETE 본문 없음/200,
순차 PUT→PUT→DELETE→DELETE의 상태·관계·카운터를 확인합니다.
'''.encode()

def generate(output):
    baseline,old,_=read_snapshot('3-2');source,originals,records=read_snapshot('4-1')
    added=sorted(set(originals)-set(old));changed=sorted(p for p in old if old[p]!=originals[p])
    if set(changed)!=set(PATCH_PATHS) or len(added)!=7:raise ValueError('예상과 다른 4-1 확장 범위')
    patches=[]
    for name in PATCH_PATHS:
        patches.extend(difflib.unified_diff(old[name].decode().splitlines(True),originals[name].decode().splitlines(True),fromfile='a/'+name,tofile='b/'+name))
    service=originals[SERVICE].decode()
    stubbed=common.stub_method(common.stub_method(service,'like'),'unlike').encode()
    output.mkdir(parents=True,exist_ok=True)
    addon={};addon_records=[]
    for name in added:
        if not name.startswith('src/main/java/org/example/like/'):continue
        data=stubbed if name==SERVICE else originals[name];zip_name='additions/'+name
        addon[zip_name]=data;addon_records.append({'path':zip_name,'targetPath':name,'sourceBlob':next(r['blob'] for r in records if r['path']==name),'sha256':common.sha256(data),'stubMethods':['like','unlike'] if name==SERVICE else []})
    if len(addon)!=6:raise ValueError('추가 운영 코드 6개 필요')
    addon['post-like-support.patch']=''.join(patches).encode();addon['README-LEARNING.md']=addon_readme()
    provenance={'schemaVersion':1,'kind':'additive-extension','sourceSnapshot':source,'baselineSnapshot':baseline,'includesCrudAnswers':False,'stubMethods':['like','unlike'],'files':addon_records,'patchTargets':list(PATCH_PATHS),'patchSha256':common.sha256(addon['post-like-support.patch']),'databaseResetRequired':False}
    addon['PACKAGE-MANIFEST.json']=common.json_bytes(provenance)
    write_zip(output/'like-extension.zip',addon)
    manifest={'schemaVersion':1,'sourceSnapshot':source,'baselineSnapshot':baseline,'packages':[]}
    manifest['packages'].append({'taskId':'extension','kind':'additive-extension','url':'scenario/flow/packages/like/like-extension.zip','bytes':(output/'like-extension.zip').stat().st_size,'sha256':common.sha256((output/'like-extension.zip').read_bytes()),'stubMethods':['like','unlike']})
    supplements={name:(ROOT/name).read_bytes() for name in common.SUPPLEMENTS}
    extra_records=[{'path':name,'source':name,'sha256':common.sha256(data)} for name,data in supplements.items()]
    for task,stubs in [('like',['like','unlike']),('unlike',['unlike']),('reference',[])]:
        content=dict(originals);code=service
        for method in stubs:code=common.stub_method(code,method)
        content[SERVICE]=code.encode()
        pkg_records=[dict(r,sha256=common.sha256(content[r['path']]),stubMethods=stubs if r['path']==SERVICE else []) for r in records]
        content.update(supplements)
        content['README-LEARNING.md']=midjoin_readme(task,stubs)
        content['PACKAGE-MANIFEST.json']=common.json_bytes({'schemaVersion':1,'taskId':task,'kind':'answer' if task=='reference' else 'midjoin-starter','sourceSnapshot':source,'stubMethods':stubs,'files':pkg_records,'supplementalFiles':extra_records})
        write_zip(output/(task+'.zip'),content)
        code_path=output/'code'/task/'LikeService.java';code_path.parent.mkdir(parents=True,exist_ok=True);code_path.write_bytes(content[SERVICE])
        p=output/(task+'.zip');manifest['packages'].append({'taskId':task,'kind':'answer' if task=='reference' else 'midjoin-starter','url':'scenario/flow/packages/like/'+task+'.zip','bytes':p.stat().st_size,'sha256':common.sha256(p.read_bytes()),'stubMethods':stubs})
    (output/'manifest.json').write_bytes(common.json_bytes(manifest))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output-dir',type=Path,default=OUTPUT)
    target=parser.parse_args().output_dir.resolve();generate(target);print(f'좋아요 추가 자료1 + 중간합류2 + 참고답안1 생성: {target}')
