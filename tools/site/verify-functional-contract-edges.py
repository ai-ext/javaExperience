#!/usr/bin/env python3
"""정본 참고 ZIP의 PATCH·rollback·페이지·연관 보존을 별도 MySQL에서 검증한다."""
import importlib.util
import json
from pathlib import Path
import sys

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('reference_runner', Path(__file__).with_name('verify-functional-reference.py'))
reference = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reference)
check, expect_http, sql_id = reference.check, reference.expect_http, reference.sql_id


class ContractEdgesRunner(reference.Runner):
    def flow(self):
        super().flow()
        self.report['scope'] += ' 추가: PATCH 값/실패 rollback, 실제 페이지, 비어 있지 않은 삭제 관계. 별도 SQL fixture와 fault injection 포함.'
        self.report['fixtureChanges'] = []
        self.verify_create_failure()
        self.verify_patch_and_delete()
        self.verify_pagination()

    def tag_count(self, name):
        # 이 도구가 만든 고정 접두사/UUID 이름만 SQL 문자열로 사용한다.
        check(name.startswith('edge-') and all(c.isascii() and (c.isalnum() or c == '-') for c in name), 'fixture 태그 이름 불일치')
        return int(self.sql("SELECT COUNT(*) FROM tag WHERE name='" + name + "'")[0])

    def verify_create_failure(self):
        tag = 'edge-create-rollback-' + self.run_id[:8]
        check(self.tag_count(tag) == 0, '새 rollback 태그 이름 충돌')
        self.check_container()
        # 정본 파일은 바꾸지 않는다. 이 소유 컨테이너 안에서만 INSERT 실패 조건을 추가한다.
        self.sql("ALTER TABLE post ADD CONSTRAINT crud_reference_reject_title CHECK (title <> 'edge-reject-create')")
        self.report['fixtureChanges'].append('owned disposable DB: temporary CHECK rejects only title=edge-reject-create')
        before = self.sql('SELECT COUNT(*) FROM post')[0]
        try:
            response = self.http('POST', '/api/posts', {'boardSlug': 'dev', 'title': 'edge-reject-create',
                                                       'content': '본문', 'tags': [tag]})
            check(500 <= response['status'] < 600, '주입한 DB 저장 실패가 5xx로 전달되지 않음')
            check(self.sql('SELECT COUNT(*) FROM post')[0] == before, '실패한 작성이 post 행을 남김')
            check(self.tag_count(tag) == 0, '작성 실패 뒤 같은 트랜잭션의 새 태그가 남음')
        finally:
            self.sql('ALTER TABLE post DROP CHECK crud_reference_reject_title')
        self.report['checks'].append('POST DB CHECK 실패 5xx 뒤 post 건수 불변·새 tag 없음; 임시 CHECK 제거. SQL 실행 순서/메모리 상태는 관찰하지 않음')

    def verify_patch_and_delete(self):
        tags = ['spring', 'edge-original-' + self.run_id[:8]]
        payload = {'boardSlug': 'dev', 'title': 'edge-original', 'content': '원래 본문', 'tags': tags}
        # 인증/입력 거절은 별도 연결에서 전체 행 수까지 비교한다.
        count = self.sql('SELECT COUNT(*) FROM post')[0]
        expect_http(self.http('POST', '/api/posts', payload, authenticated=False), 401)
        expect_http(self.http('POST', '/api/posts', dict(payload, title='')), 400)
        check(self.sql('SELECT COUNT(*) FROM post')[0] == count, '거절된 POST가 행을 남김')
        response = self.http('POST', '/api/posts', payload)
        expect_http(response, 201)
        post = json.loads(response['body'])
        number = sql_id(post['id'])
        path = '/api/posts/' + number
        check(post['visibility'] == 'PUBLIC', 'visibility 생략 기본값 불일치')
        before = self.observe(post['id'], 'edge-created')
        for label, body in [('empty-object', {}), ('explicit-null', {
                'title': None, 'content': None, 'tags': None, 'visibility': None})]:
            expect_http(self.http('PATCH', path, body), 200)
            after = self.observe(post['id'], 'edge-' + label)
            self.assert_same(before, after, ('updated_at',))
            before = after
        self.report['checks'].append('PATCH {} 및 명시 null: 입력 값/태그/조회수/createdAt/publishedAt 보존; updatedAt 저장 정밀도 구분')

        # title 변경 뒤 tags 검증 실패, 새 Tag 해석 뒤 visibility 검증 실패를 따로 확인한다.
        failed_tag = 'edge-patch-rollback-' + self.run_id[:8]
        for label, body in [
                ('invalid-tags', {'title': '바뀌면 안 되는 제목', 'tags': [' ']}),
                ('invalid-visibility', {'title': '다시 바뀌면 안 되는 제목', 'tags': [failed_tag], 'visibility': 'PRIVATE'})]:
            check(self.tag_count(failed_tag) == 0, 'rollback 비교 전 태그가 있음')
            expect_http(self.http('PATCH', path, body), 400)
            after = self.observe(post['id'], 'edge-' + label + '-rolled-back')
            self.assert_same(before, after)
            check(self.tag_count(failed_tag) == 0, '거절된 PATCH가 새 태그를 남김')
        self.report['checks'].append('PATCH 후행 검증400: 제목·태그 관계·모든 post 값 rollback, 실패 요청의 새 tag 없음')

        existing_tag_ids = [sql_id(tag['id']) for tag in before['tags']]
        expect_http(self.http('PATCH', path, {'tags': []}), 200)
        cleared = self.observe(post['id'], 'edge-tags-cleared')
        check(cleared['tags'] == [] and cleared['relations']['postTags'] == 0, 'tags=[] 연결 해제 실패')
        remaining = int(self.sql('SELECT COUNT(*) FROM tag WHERE id IN (' + ','.join(existing_tag_ids) + ')')[0])
        check(remaining == len(existing_tag_ids), 'tags=[]가 tag 원본을 삭제함')
        self.assert_same(before, cleared, ('tags', 'relations', 'updated_at'))
        check(all(cleared['relations'][key] == before['relations'][key] for key in ('likes', 'comments', 'bookmarks')), '태그 변경이 다른 관계를 바꿈')
        replacement = 'edge-replacement-' + self.run_id[:8]
        expect_http(self.http('PATCH', path, {'tags': ['spring', replacement, replacement]}), 200)
        replaced = self.observe(post['id'], 'edge-tags-replaced-deduplicated')
        check({tag['name'] for tag in replaced['tags']} == {'spring', replacement}
              and replaced['relations']['postTags'] == 2, '교체/중복 제거 실패')
        self.assert_same(cleared, replaced, ('tags', 'relations', 'updated_at'))
        self.report['checks'].append('PATCH tags=[]는 연결만 제거·원래 tag 행 유지; 값 배열은 중복 제거한 두 연결로 교체')

        # 삭제 전 비어 있지 않은 관계를 만든다. API 실행으로 만든 데이터라고 표시하지 않는다.
        actor = sql_id(self.report['actor']['id'])
        member = sql_id(int(self.sql('SELECT id FROM member WHERE id <> ' + actor + ' ORDER BY id LIMIT 1')[0]))
        self.sql(f'INSERT INTO post_like(post_id,member_id,created_at) VALUES ({number},{member},CURRENT_TIMESTAMP)')
        self.sql(f"INSERT INTO `comment`(post_id,member_id,content,created_at,updated_at) VALUES ({number},{member},'fixture-comment',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)")
        self.sql(f'INSERT INTO bookmark(post_id,member_id,created_at,updated_at) VALUES ({number},{member},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)')
        self.sql(f'UPDATE post SET like_count=1,comment_count=1 WHERE id={number}')
        self.report['fixtureChanges'].append({'postId': post['id'], 'source': 'direct SQL in owned disposable DB',
                                              'addedRows': {'post_like': 1, 'comment': 1, 'bookmark': 1},
                                              'setCounters': {'like_count': 1, 'comment_count': 1}})
        populated = self.observe(post['id'], 'edge-delete-populated-before')
        check(populated['relations'] == {'postTags': 2, 'likes': 1, 'comments': 1, 'bookmarks': 1}, '삭제 전 관계 fixture 누락')
        # 행 수만으로 보존을 단정하지 않도록 실제 관계 행 전체를 비교한다.
        relation_before = self.relation_rows(number)
        expect_http(self.http('DELETE', path), 204)
        deleted = self.observe(post['id'], 'edge-delete-populated-after')
        self.assert_same(populated, deleted, ('updated_at', 'deleted_at'))
        check(deleted['deleted_at'] is not None and deleted['updated_at'] == deleted['deleted_at'], '삭제 두 시각 불일치')
        check(self.relation_rows(number) == relation_before, 'DELETE가 관계 행 id/내용을 바꿈')
        expect_http(self.http('GET', path, authenticated=False), 404)
        self.assert_same(deleted, self.observe(post['id'], 'edge-delete-404-no-change'))
        self.report['checks'].append('DELETE204: 비어 있지 않은 tag/like/comment/bookmark의 행 id·전체 열과 카운터 유지; 익명 GET404 후 변화 없음')
        self.report['relationRows'] = {'postId': post['id'], 'before': relation_before,
                                       'after': self.relation_rows(number)}

    def relation_rows(self, number):
        number = sql_id(int(number))
        return {table: self.sql(f'SELECT * FROM `{table}` WHERE post_id={number} ORDER BY id')
                for table in ('post_like', 'comment', 'bookmark')} | {
                    'post_tag': self.sql('SELECT * FROM post_tag WHERE post_id=' + number + ' ORDER BY tag_id')}

    def verify_pagination(self):
        created = []
        for title in ('edge-page-a', 'edge-page-b'):
            response = self.http('POST', '/api/posts', {'boardSlug': 'dev', 'title': title, 'content': '페이지 비교'})
            expect_http(response, 201)
            post_id = json.loads(response['body'])['id']
            number = sql_id(post_id)
            # 동률인 publishedAt에서 id DESC를 독립적으로 확인할 fixture다.
            self.sql(f"UPDATE post SET published_at='2026-10-20 00:00:00' WHERE id={number}")
            created.append(self.observe(post_id, 'edge-page-fixture-before'))
        self.report['fixtureChanges'].append({'postIds': [post['id'] for post in created],
                                              'source': 'API POST followed by direct SQL in owned disposable DB',
                                              'set': {'published_at': '2026-10-20 00:00:00'}})
        pages = []
        for page in (0, 1):
            response = self.http('GET', f'/api/boards/dev/posts?page={page}&size=1')
            expect_http(response, 200)
            value = json.loads(response['body'])
            check(value['page'] == page and value['size'] == 1, '페이지/크기 불일치')
            check(value['totalPages'] == value['totalElements'], 'size1 페이지 총계 불일치')
            check(value['hasNext'] == (page + 1 < value['totalPages']), 'hasNext 불일치')
            check(len(value['items']) == min(1, max(0, value['totalElements'] - page)), '페이지 항목 수 불일치')
            check(all('content' not in item for item in value['items']), '목록에 본문 노출')
            pages.append(value)
        check(pages[0]['totalElements'] == pages[1]['totalElements'], '조용한 fixture의 전체 건수 불일치')
        check(pages[0]['totalElements'] >= 2, 'API로 추가한 두 fixture가 목록에서 누락')
        a, b = (value['items'][0] for value in pages)
        check((a['publishedAt'], a['id']) > (b['publishedAt'], b['id']), '페이지 경계 정렬/중복 불일치')
        check([a['id'], b['id']] == sorted([post['id'] for post in created], reverse=True), '같은 publishedAt의 id DESC 불일치')
        for value in created:
            self.assert_same(value, self.observe(value['id'], 'edge-page-fixture-after'))
        for suffix in ('page=-1&size=1', 'page=0&size=0'):
            expect_http(self.http('GET', '/api/boards/dev/posts?' + suffix), 400)
        self.report['checks'].append('실제 LIST page0/page1 size1: 동률 publishedAt의 id DESC·페이지/전체 건수/hasNext/본문 제외·글 불변; 음수 page/size0은400')
        self.verify_list_sql()

    def verify_list_sql(self):
        for authenticated in (False, True):
            viewer = sql_id(self.report['actor']['id']) if authenticated else 'NULL'
            # 학습자에게 제공한 SQL 검산 조건과 같은 의미를 별도 MySQL 연결에서 평가한다.
            where = f"""p.board_id=(SELECT id FROM board WHERE slug='dev')
                AND p.deleted_at IS NULL AND p.status='PUBLISHED'
                AND (p.visibility='PUBLIC' OR ({viewer} IS NOT NULL AND p.author_id={viewer})
                    OR ({viewer} IS NOT NULL AND EXISTS (SELECT 1 FROM follow f
                        WHERE f.follower_id={viewer} AND f.followee_id=p.author_id)))
                AND ({viewer} IS NULL OR NOT EXISTS (SELECT 1 FROM member_block b
                    WHERE (b.blocker_id={viewer} AND b.blocked_id=p.author_id)
                       OR (b.blocked_id={viewer} AND b.blocker_id=p.author_id)))"""
            total = int(self.sql('SELECT COUNT(*) FROM post p WHERE ' + where)[0])
            ids = [int(value) for value in self.sql('SELECT p.id FROM post p WHERE ' + where
                                                  + ' ORDER BY p.published_at DESC,p.id DESC LIMIT 50')]
            response = self.http('GET', '/api/boards/dev/posts?page=0&size=50', authenticated=authenticated)
            expect_http(response, 200)
            value = json.loads(response['body'])
            check(value['totalElements'] == total and [item['id'] for item in value['items']] == ids,
                  '목록 COUNT/정렬 id와 별도 SQL 조건이 일치하지 않음')
            self.report.setdefault('listSqlComparisons', []).append({'authenticated': authenticated,
                'viewerId': None if viewer == 'NULL' else int(viewer), 'total': total, 'ids': ids,
                'source': 'separate MySQL SELECT with same documented WHERE; no query count/performance measurement'})
        self.report['checks'].append('익명/인증 목록: 별도 SQL의 가시성·팔로우·양방향 차단 WHERE로 COUNT와 정렬 id 전체 대조')


if __name__ == '__main__':
    raise SystemExit(reference.main(runner_type=ContractEdgesRunner))
