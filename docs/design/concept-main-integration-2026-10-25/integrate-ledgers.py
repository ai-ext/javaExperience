#!/usr/bin/env python3
"""기준(main) 우선 ID union 장부 도구. 기본은 계획만 만들고 장부는 --write-ledgers로만 쓴다."""
from __future__ import annotations
import argparse, hashlib, json, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
INPUT = json.loads((HERE / 'INPUT.json').read_text())
BASE = INPUT['base']
SOURCE = INPUT['sourceSnapshot']
VIRTUAL = INPUT['virtualTree']
LEDGERS = ('docs/design/visual-inventory.jsonl', 'docs/design/visual-parity.jsonl')
EXCLUDED = (
    'work/browser-qa/4-2-desktop-full',
    'work/browser-qa/4-2-p2-desktop-final-full',
    'work/browser-qa/4-2-p2-desktop-full',
)


def git(*args: str) -> bytes:
    return subprocess.check_output(['git', '-C', str(ROOT), *args])


def tree(ref: str) -> dict[str, str]:
    raw = git('ls-tree', '-r', '-z', ref)
    out = {}
    for item in raw.split(b'\0'):
        if not item:
            continue
        header, path = item.split(b'\t', 1)
        out[path.decode()] = header.split()[2].decode()
    return out


def blob(ref: str, path: str) -> bytes:
    return git('show', f'{ref}:{path}')


def parse_rows(raw: bytes, path: str):
    rows = []
    by_id: dict[str, list[tuple[bytes, dict]]] = {}
    for line in raw.splitlines(keepends=True):
        content = line.rstrip(b'\r\n')
        if not content:
            continue
        row = json.loads(content)
        ident = row['id']
        rows.append((line, row))
        by_id.setdefault(ident, []).append((line, row))
    return rows, by_id


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--write-ledgers', action='store_true', help='두 JSONL 장부를 실제로 덮어쓴다 (적용 승인 후 사용)')
    args = ap.parse_args()

    base_tree, src_tree, virtual_tree = tree(BASE), tree(SOURCE), tree(VIRTUAL)
    plan = {
        'schema': 1,
        'inputs': {'base': BASE, 'sourceSnapshot': SOURCE, 'virtualTree': VIRTUAL},
        'policy': {
            'images': '56개 동일 JPG 경로 충돌은 main blob 유지; source 새 JPG만 이식 계획; source PNG 및 제외 캡처 PNG/JPG는 복사하지 않음.',
            'inventory': 'main 원문 바이트를 우선 보존하고 source-only ID 행만 추가. 같은 ID의 서로 다른 원문은 양쪽 모두 이 계획 파일에 보존.',
            'parity': 'main 원문 바이트를 prefix로 보존하고 source-only ID 행만 추가. 신규 행 mockup PNG만 같은 경로의 JPG가 존재할 때 mockup 값만 매핑하며 proof 필드는 보존.',
            'status': '상태를 승격하거나 verified를 새로 만들지 않음. 이 도구는 장부 실행 proof 값을 변경하지 않음.',
        },
    }

    image_conflicts = []
    merge_file = HERE / 'merge-tree-private.txt'
    stages: dict[str, dict[str, str]] = {}
    for line in merge_file.read_text().splitlines():
        if not line.startswith('100') or '\t' not in line:
            continue
        head, path = line.split('\t', 1)
        _, oid, stage = head.split()
        stages.setdefault(path, {})[stage] = oid
    for path, stage in sorted(stages.items()):
        if path.lower().endswith(('.jpg', '.jpeg', '.png')) and stage.get('2') and stage.get('3') and stage['2'] != stage['3']:
            image_conflicts.append({'path': path, 'baseBlob': stage.get('1'), 'mainBlobKeep': stage['2'], 'sourceBlobDrop': stage['3'], 'decision': 'main 바이트 유지'})

    new_jpg = [p for p in sorted(src_tree) if p.lower().endswith('.jpg') and p not in base_tree]
    source_png = [p for p in sorted(src_tree) if p.lower().endswith('.png')]
    excluded_png = [p for p in source_png if any(p == stem + '.png' for stem in EXCLUDED)]
    excluded_jpg = [p for p in src_tree if p.lower().endswith('.jpg') and any(p == stem + '.jpg' for stem in EXCLUDED)]
    virtual_png = [p for p in sorted(virtual_tree) if p.lower().endswith('.png')]
    png_map = [{'png': p, 'jpg': p[:-4] + '.jpg', 'jpgBlob': base_tree.get(p[:-4] + '.jpg'), 'decision': '기존 JPG 경로 대응'} for p in virtual_png if p[:-4] + '.jpg' in base_tree]
    png_unmapped = [p for p in virtual_png if p[:-4] + '.jpg' not in base_tree]
    plan['assets'] = {
        'baseImageCounts': {'png': sum(p.lower().endswith('.png') for p in base_tree), 'jpg': sum(p.lower().endswith('.jpg') for p in base_tree)},
        'sourceImageCounts': {'png': len(source_png), 'jpg': sum(p.lower().endswith('.jpg') for p in src_tree)},
        'imageConflicts': image_conflicts,
        'newConceptJpg': [{'path': p, 'sourceBlob': src_tree[p], 'decision': '이식 예정'} for p in new_jpg],
        'sourcePngNotCopied': [{'path': p, 'sourceBlob': src_tree[p]} for p in source_png],
        'excludedCapturePng': excluded_png,
        'excludedCaptureJpg': excluded_jpg,
        'virtualPngToExistingMainJpg': png_map,
        'virtualPngWithoutMainJpg': png_unmapped,
        'imageBytesOpened': False,
    }

    ledgers = {}
    for path in LEDGERS:
        base_raw, src_raw = blob(BASE, path), blob(SOURCE, path)
        base_rows, base_ids = parse_rows(base_raw, path)
        src_rows, src_ids = parse_rows(src_raw, path)
        base_keys, src_keys = set(base_ids), set(src_ids)
        common = base_keys & src_keys
        changed = []
        for ident in sorted(common):
            base_line, base_row = base_ids[ident][0]
            src_line, src_row = src_ids[ident][0]
            if base_line.rstrip(b'\r\n') != src_line.rstrip(b'\r\n'):
                changed.append({'id': ident, 'mainRaw': base_line.decode().rstrip('\r\n'), 'conceptRaw': src_line.decode().rstrip('\r\n'),
                                'mainStatus': base_row.get('status'), 'conceptStatus': src_row.get('status')})
        additions = []
        mockup_maps = []
        png_mockups_without_jpg = []
        for ident in sorted(src_keys - base_keys):
            line, row = src_ids[ident][0]
            if path.endswith('visual-parity.jsonl') and isinstance(row.get('mockup'), str) and row['mockup'].lower().endswith('.png'):
                jpg = row['mockup'][:-4] + '.jpg'
                if jpg in base_tree or jpg in src_tree:
                    row = dict(row)
                    original = row['mockup']
                    row['mockup'] = jpg
                    line = (json.dumps(row, ensure_ascii=False, separators=(',', ':')) + '\n').encode()
                    mockup_maps.append({'id': ident, 'from': original, 'to': jpg, 'jpgExistsIn': 'main' if jpg in base_tree else 'source'})
                else:
                    png_mockups_without_jpg.append({'id': ident, 'mockup': row['mockup']})
            additions.append((ident, line, row))
        merged = base_raw + b''.join(line if line.endswith(b'\n') else line + b'\n' for _, line, _ in additions)
        ledgers[path] = merged
        statuses = {}
        for _, _, row in additions:
            statuses[row.get('status', '(no status)')] = statuses.get(row.get('status', '(no status)'), 0) + 1
        plan.setdefault('ledgers', {})[path] = {
            'mainRows': len(base_rows), 'conceptRows': len(src_rows), 'mainUniqueIds': len(base_keys), 'conceptUniqueIds': len(src_keys),
            'commonIds': len(common), 'mainOnlyIds': sorted(base_keys - src_keys), 'conceptOnlyIds': sorted(src_keys - base_keys),
            'sharedIdRawConflicts': changed, 'appendedConceptIds': sorted(src_keys - base_keys),
            'appendedPngMockupsWithoutJpg': png_mockups_without_jpg,
            'appendedStatusCounts': statuses, 'mockupPngToJpgMappings': mockup_maps,
            'mainBytesSha256': sha(base_raw), 'conceptBytesSha256': sha(src_raw), 'mainPrefixBytePreserved': True,
            'expectedSeedRows': len(base_keys | src_keys), 'expectedCollectorAction': '결합 collector 재생성 후 ID·상태 변화를 다시 대조',
        }

    assert len(image_conflicts) == 56
    assert plan['assets']['baseImageCounts'] == {'png': 0, 'jpg': 602}
    assert len(source_png) == 517
    for path in LEDGERS:
        assert blob(BASE, path).endswith(b'\n'), f'{path}: main prefix must end at line boundary'

    plan_path = HERE / 'ASSET-LEDGER-PLAN.json'
    plan_bytes = (json.dumps(plan, ensure_ascii=False, indent=2) + '\n').encode()
    plan_path.write_bytes(plan_bytes)
    if args.write_ledgers:
        for path, data in ledgers.items():
            (ROOT / path).write_bytes(data)

    report = [
        '# 자산·장부 준비 보고서', '',
        f'- 고정 입력: base `{BASE}`, source snapshot `{SOURCE}`, virtual tree `{VIRTUAL}`.',
        f'- 기준 이미지 트리: JPG {plan["assets"]["baseImageCounts"]["jpg"]}개, PNG {plan["assets"]["baseImageCounts"]["png"]}개.',
        f'- 이미지 충돌: {len(image_conflicts)}개. 모두 main blob 유지 계획.',
        f'- 새 concept JPG: {len(new_jpg)}개 이식 후보. 파일 본문은 열지 않았고 Git blob ID를 기록.',
        f'- source PNG: {len(source_png)}개 복사 제외; 공개 제외 캡처 PNG {len(excluded_png)}개, JPG {len(excluded_jpg)}개.',
        f'- virtual tree PNG: {len(virtual_png)}개; main에 동일 basename JPG가 있는 경로 {len(png_map)}개, 없는 경로 {len(png_unmapped)}개.',
        '', '## 장부 대조', '',
    ]
    for path in LEDGERS:
        item = plan['ledgers'][path]
        report += [f'### `{path}`', '',
                   f'- main/source row: {item["mainRows"]}/{item["conceptRows"]}; ID 합집합 {item["expectedSeedRows"]}.',
                   f'- main-only {len(item["mainOnlyIds"])}개, concept-only 추가 {len(item["conceptOnlyIds"])}개, 공유 ID 원문 충돌 {len(item["sharedIdRawConflicts"])}개.',
                   f'- 공유 충돌은 양쪽 raw 행을 계획 JSON에 보존; 적용 시 main 행 유지.',
                   f'- main 바이트 SHA-256 `{item["mainBytesSha256"]}`; source 바이트 SHA-256 `{item["conceptBytesSha256"]}`.',
                   f'- 신규 mockup PNG→JPG 경로 매핑 {len(item["mockupPngToJpgMappings"])}개. proof 필드 값은 복사 원문 유지.', '']
    report += ['## 검사 요구사항 경고', '',
               '- main 기준 `tools/site/package.json`에는 `audit:images`가 있으나 `test:jpg`, `test:raster`는 없다. source snapshot에는 두 검사가 있다.',
               '- source `test:raster-size.mjs`는 `docs/design/mockups-2026-10-15-batch2/05-mvc-premium.png`와 `docs/design/d02-2026-10-20/captures/mobile-url.jpg`를 요구한다. PNG는 main에 없고 같은 basename JPG만 main에 있다. 이 검사는 PNG 바이트를 요구하므로 PNG 비복사 정책과 충돌하며, 검사 상수를 바꾸지 말라는 조건도 함께 root에 보고한다.',
               '- source `test:jpg-migration.mjs`는 `docs/design/jpg-2026-10-20/conversion-manifest.json`, P09 질문 원문, manifest의 419개 전환 destination 및 Git blob SHA 체인을 요구하며, PNG 56개 보존·363개 제거를 단언한다. 해당 manifest와 보조 파일은 main에 없다. source PNG 전체 비복사 정책과 56개 PNG 보존 assertion은 양립하지 않으므로 root가 검사 불가/정책 충돌로 기록해야 한다. 검사 상수는 변경하지 않는다.',
               '- main `audit-image-assets.mjs`는 common-jpg manifest의 602개 배포/원본 관계, 공개 제외 PNG/JPG 부재, asset-index 및 mockup-manifest 출처, 생성 HTML 이미지 링크를 검사한다. 실제 HTML은 root build 후 검사해야 하므로 여기서는 runtime PASS 판정을 하지 않는다.',
               '', '## 적용·검증 경계', '',
               f'- 고정 Git tree에서 장부와 자산 경로의 존재를 확인했다. 계획 JSON SHA-256 `{sha(plan_bytes)}`; 구현 스크립트 SHA-256 `{sha(Path(__file__).read_bytes())}`.',
               ('- 이번 실행에서 `--write-ledgers`로 두 장부 seed를 적용했다. collector 재생성은 아직 하지 않았다.' if args.write_ledgers else '- 기본 실행은 이 plan/report만 갱신한다. 실제 장부 쓰기는 `--write-ledgers`가 필요하며 이번 실행에서는 하지 않았다.'),
               '- 장부 seed는 main raw bytes + concept-only 행이다. root 결합 collector 재생성 뒤 main-only 구 ID 누락, concept-only 추가, status 변화를 확인해야 한다.',
               '- status 승격이나 새 `verified` 표시는 하지 않는다. 이미지 시각 검증·HTML 런타임 검증은 수행하지 않았다.', '']
    if args.write_ledgers:
        inv_path, parity_path = (ROOT / p for p in LEDGERS)
        inv_bytes, parity_bytes = inv_path.read_bytes(), parity_path.read_bytes()
        base_inv, base_parity = blob(BASE, LEDGERS[0]), blob(BASE, LEDGERS[1])
        inv_rows = [json.loads(line) for line in inv_bytes.splitlines() if line]
        parity_rows = [json.loads(line) for line in parity_bytes.splitlines() if line]
        inv_additions = inv_rows[len(parse_rows(base_inv, LEDGERS[0])[0]):]
        missing_mockups = sorted({row['mockup'] for row in parity_rows if isinstance(row.get('mockup'), str) and not (ROOT / row['mockup']).is_file()})
        missing_jpg = [p for p in new_jpg if not (ROOT / p).is_file()]
        missing_png_maps = [row['jpg'] for row in png_map if not (ROOT / row['jpg']).is_file()]
        promoted = sum(row.get('status') == 'verified' for row in inv_additions)
        assert inv_bytes.startswith(base_inv) and parity_bytes.startswith(base_parity)
        assert len({row['id'] for row in inv_rows}) == len(inv_rows)
        assert len({row['id'] for row in parity_rows}) == len(parity_rows)
        report += ['## 적용 결과 확인', '',
                   f'- inventory main prefix 바이트 동일: {len(base_inv)} bytes, SHA-256 `{sha(base_inv)}`; 총 {len(inv_rows)}행, 추가 `verified` {promoted}행.',
                   f'- parity main prefix 바이트 동일: {len(base_parity)} bytes, SHA-256 `{sha(base_parity)}`; 총 {len(parity_rows)}행; 실제 누락 mockup 경로 {len(missing_mockups)}개.',
                   f'- 새 concept JPG {len(new_jpg)}개 중 실제 누락 {len(missing_jpg)}개; 23개 PNG→main JPG 대응 경로 누락 {len(missing_png_maps)}개.',
                   f'- main JPG 대응이 없는 virtual PNG 세 경로는 공개 제외 캡처: {", ".join(png_unmapped)}.', '']
    report_path = HERE / 'ASSET-LEDGER-REPORT.md'
    report_path.write_text('\n'.join(report), encoding='utf-8')
    print(f'plan={plan_path}\nreport={report_path}\nimage_conflicts={len(image_conflicts)} new_jpg={len(new_jpg)}')
    print(f'ledger_write={args.write_ledgers}')

if __name__ == '__main__':
    main()
