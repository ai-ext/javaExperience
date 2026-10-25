#!/usr/bin/env python3
"""정본 4-1 좋아요 API를 자체 tmpfs MySQL에서 검증한다. 학생 소스·기존 DB는 변경하지 않는다."""
import hashlib
import importlib.util
import json
from pathlib import Path, PurePosixPath
import sys
from urllib import error, request
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('reference_runner', Path(__file__).with_name('verify-functional-reference.py'))
reference = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reference)
check, expect_http, sql_id = reference.check, reference.expect_http, reference.sql_id
ACTORS = {'liker':'tok-kimjava','author':'tok-park','inactive':'tok-choi','anonymous':None}

class LikeRunner(reference.Runner):
    def load_reference(self, folder):
        # 먼저 기존 3-2 ZIP·wrapper·보충 파일의 보존된 해시를 전수 확인한다.
        super().load_reference(folder)
        baseline = json.loads((reference.ROOT/'scenario/snapshots/3-2.json').read_text())
        source_bytes=(reference.ROOT/'scenario/snapshots/4-1.json').read_bytes()
        snapshot=json.loads(source_bytes)
        old={item['path']:item['blob'] for item in baseline['files']}
        new={item['path']:item['blob'] for item in snapshot['files']}
        check(len(new)==len(snapshot['files'])==82,'정본 4-1 파일 수 불일치')
        check(not set(old)-set(new),'3-2 파일 삭제가 발생함')
        added=[p for p in new if p not in old]
        changed=[p for p in old if old[p]!=new[p]]
        check(len(added)==7 and set(changed)=={
            'src/main/java/org/example/post/Post.java','src/main/java/org/example/common/ApiExceptionHandler.java'},'예상하지 않은 정본 변화')
        records=[]
        for item in snapshot['files']:
            p=PurePosixPath(item['path'])
            check(not p.is_absolute() and '..' not in p.parts and '\\' not in str(p) and str(p)==item['path'],'안전하지 않은 정본 경로')
            blob=item['blob']
            check(len(blob)==40 and all(c in '0123456789abcdef' for c in blob),'blob 형식 오류')
            content=(reference.ROOT/'scenario/snapshots/blobs'/f'{blob}.txt').read_bytes()
            check(hashlib.sha1(f'blob {len(content)}\0'.encode()+content).hexdigest()==blob,'정본 Git blob 해시 오류')
            destination=folder.joinpath(*p.parts)
            destination.parent.mkdir(parents=True,exist_ok=True)
            destination.write_bytes(content)
            records.append({'path':str(p),'blob':blob,'sha256':reference.digest(content)})
        self.report['likeSource']={'manifest':'scenario/snapshots/4-1.json','manifestSha256':reference.digest(source_bytes),'files':82,
            'addedFiles':7,'changedFiles':2,'changes':[{'path':p,'previousBlob':old.get(p),'blob':new[p]} for p in added+changed],
            'records':records,'note':'임시 프로젝트만 4-1로 재구성. 학생 src와 CRUD ZIP은 미수정.'}
        self.report['scope']='정본 4-1의 순차 PUT/DELETE·오류·실패 rollback을 일회용 MySQL/API에서 검증. 브라우저·동시성·SQL 발행 시점 계측은 아님.'

    def like_http(self,method,path,body=None,*,actor='liker'):
        if actor not in ACTORS:raise ValueError('허용된 공개 fixture 회원만 선택할 수 있습니다.')
        headers={}
        if body is not None:headers['Content-Type']='application/json'
        if ACTORS[actor]:headers['Authorization']='Bearer '+ACTORS[actor]
        payload=json.dumps(body,ensure_ascii=False).encode() if body is not None else None
        req=request.Request(self.base_url+path,data=payload,headers=headers,method=method)
        opener=request.build_opener(request.ProxyHandler({}),reference.NoRedirect())
        try:response=opener.open(req,timeout=10)
        except error.HTTPError as exc:response=exc
        with response:
            result={'status':response.code,'body':response.read().decode('utf-8'),
                'location':response.headers.get('Location'),'wwwAuthenticate':response.headers.get('WWW-Authenticate')}
        self.report['requests'].append({'method':method,'path':path,'actor':actor,'json':body,'response':result})
        return result

    def relations(self,post_id):
        number=sql_id(post_id)
        return [json.loads(row) for row in self.sql("SELECT JSON_OBJECT('id',id,'post_id',post_id,'member_id',member_id,'created_at',created_at) FROM post_like WHERE post_id="+number+' ORDER BY member_id')]

    def counter_check_sql(self,direction):
        # MySQL CHECK는 AUTO_INCREMENT id를 참조할 수 없어 자체 fixture 제목으로 범위를 제한한다.
        if direction not in ('upper','lower'):raise ValueError('알 수 없는 실패 주입 방향입니다.')
        condition='like_count <= 2' if direction=='upper' else 'like_count >= 3'
        return "ALTER TABLE post ADD CONSTRAINT like_reference_reject_count CHECK (title <> '좋아요 확장 검증' OR "+condition+')'

    def capture_like(self,post_id,stage):
        post=self.observe(post_id,stage)
        rows=self.relations(post_id)
        self.report['likeObservations'].append({'stage':stage,'post':post,'post_like':rows})
        check(post['like_count']==len(rows),'카운터와 실제 관계 수 불일치')
        return post,rows

    def expect_like(self,post_id,method,liked,count,stage):
        response=self.like_http(method,'/api/posts/'+sql_id(post_id)+'/like')
        expect_http(response,200)
        check(json.loads(response['body'])=={'postId':post_id,'liked':liked,'likeCount':count},'응답 필드 또는 값 불일치')
        return self.capture_like(post_id,stage)

    def flow(self):
        self.report['fixtureChanges']=[];self.report['likeObservations']=[]
        response=self.like_http('POST','/api/posts',{'boardSlug':'dev','title':'좋아요 확장 검증','content':'같은 글에 설정·취소를 반복합니다.','tags':[],'visibility':'PUBLIC'},actor='author')
        expect_http(response,201)
        post_id=json.loads(response['body'])['id'];number=sql_id(post_id);path='/api/posts/'+number+'/like'
        check(response['location']=='/api/posts/'+number,'생성 id와 Location 불일치')
        original,_=self.capture_like(post_id,'created-by-other-member')
        check(original['author_id']==4 and original['like_count']==0,'글 작성자·초기 카운터 불일치')
        # 다른 두 회원의 관계는 이 소유 일회용 DB에만 직접 준비한다. API 관측과 구분해 기록한다.
        self.check_container()
        self.sql(f'INSERT INTO post_like(post_id,member_id,created_at) VALUES({number},3,NOW()),({number},6,NOW())')
        self.sql(f'UPDATE post SET like_count=2 WHERE id={number}')
        self.report['fixtureChanges'].append('owned disposable DB only: captured post에 회원 3·6의 관계 두 행과 카운터 2 준비')
        baseline,others=self.capture_like(post_id,'two-other-members-fixture')
        put,put_rows=self.expect_like(post_id,'PUT',True,3,'first-put')
        again,again_rows=self.expect_like(post_id,'PUT',True,3,'repeated-put')
        check(put_rows==again_rows,'반복 PUT이 관계 id/생성 시각/행을 변경함')
        self.assert_same(baseline,put,excluded=('like_count','relations'))
        self.assert_same(put,again)
        deleted,delete_rows=self.expect_like(post_id,'DELETE',False,2,'first-delete')
        absent,absent_rows=self.expect_like(post_id,'DELETE',False,2,'repeated-delete')
        check(delete_rows==absent_rows==others,'다른 회원의 관계를 지우거나 재요청에서 변경함')
        self.assert_same(baseline,deleted);self.assert_same(deleted,absent)
        self.report['checks'].append('다른 회원 작성의 실제 POST id → PUT/PUT/DELETE/DELETE 200; 전체 2→3→3→2→2; 타회원 행·시각/글 원본 보존')

        own=self.like_http('POST','/api/posts',{'boardSlug':'dev','title':'본인 글 조건','content':'PUT과 DELETE의 차이','tags':[]})
        expect_http(own,201);own_id=json.loads(own['body'])['id'];own_path='/api/posts/'+sql_id(own_id)+'/like'
        expect_http(self.like_http('PUT',own_path),400)
        owner_delete=self.like_http('DELETE',own_path);expect_http(owner_delete,200)
        check(json.loads(owner_delete['body'])=={'postId':own_id,'liked':False,'likeCount':0},'본인 글 DELETE를 잘못 거절함')
        self.report['checks'].append('본인 글 PUT 400 / 관계 없는 본인 글 DELETE 200·false·0')
        for method in ['PUT','DELETE']:
            anon=self.like_http(method,path,actor='anonymous');expect_http(anon,401)
            check(anon['wwwAuthenticate']=='Bearer','401 인증 헤더 누락')
            expect_http(self.like_http(method,path,actor='inactive'),403)
            expect_http(self.like_http(method,'/api/posts/0/like'),404)
            expect_http(self.like_http(method,'/api/posts/abc/like'),400)
        self.report['checks'].append('두 메서드 각각 비인증401+Bearer/정지403/없는글404/비숫자400')
        for status in ['DRAFT','HIDDEN']:
            self.sql(f"UPDATE post SET status='{status}' WHERE id={number}")
            for method in ['PUT','DELETE']:expect_http(self.like_http(method,path),404)
        self.sql(f"UPDATE post SET status='PUBLISHED',deleted_at=NOW() WHERE id={number}")
        for method in ['PUT','DELETE']:expect_http(self.like_http(method,path),404)
        self.sql(f'UPDATE post SET deleted_at=NULL WHERE id={number}')
        after_errors,_=self.capture_like(post_id,'after-rejected-requests')
        self.assert_same(baseline,after_errors)
        self.report['checks'].append('DRAFT/HIDDEN/삭제 글 두 메서드404; fixture 상태 복원 뒤 글/관계/카운터 불변')

        # IDENTITY 관계 저장 후 게시글 UPDATE가 실패해도 둘 다 확정되지 않아야 한다.
        self.sql(self.counter_check_sql('upper'))
        try:
            failed=self.like_http('PUT',path);check(failed['status']>=500,'주입한 카운터 제약 실패가 오류로 나오지 않음')
            rolled,rows=self.capture_like(post_id,'put-counter-failure-rollback')
            self.assert_same(baseline,rolled);check(rows==others,'실패 PUT의 새 관계가 남음')
        finally:self.sql('ALTER TABLE post DROP CHECK like_reference_reject_count')
        committed,committed_rows=self.expect_like(post_id,'PUT',True,3,'before-delete-rollback')
        self.sql(self.counter_check_sql('lower'))
        try:
            failed=self.like_http('DELETE',path);check(failed['status']>=500,'주입한 감소 제약 실패가 오류로 나오지 않음')
            rolled,rows=self.capture_like(post_id,'delete-counter-failure-rollback')
            self.assert_same(committed,rolled);check(rows==committed_rows,'실패 DELETE의 관계가 사라짐')
        finally:self.sql('ALTER TABLE post DROP CHECK like_reference_reject_count')
        self.expect_like(post_id,'DELETE',False,2,'final-clean-state')
        self.report['checks'].append('일회용 DB CHECK로 PUT 증가/DELETE 감소 동기화 실패 주입: 5xx 뒤 관계와 카운터 함께 rollback; 임시 CHECK 제거')
        self.report['capturedPostId']=post_id
        self.report['limitations']=['순차 요청만 검증. 4-2의 동시성·잠금·원자 카운터는 검증하지 않음.',
            'HTTP 완료 뒤 새 별도 SQL로 비교. 요청 중 Java 메모리·flush 시점·모든 SQL 순서는 미계측.',
            '테스트 전용 CHECK 실패 응답의 5xx는 화면의 일반 API 계약에 추가하지 않음.']

if __name__=='__main__':raise SystemExit(reference.main(runner_type=LikeRunner))
