# Mermaid 브라우저 증거 아카이브 요약

## 아카이브

- 28개 top-level evidence 파일을 정리했다: JSON 13개는 byte-copy, JPG 13개는 sips JPEG quality 92로 변환했다.
- 역할은 MERMAID-BROWSER-ROLES.json의 basename 정의를 그대로 참조한다. 원본은 /tmp/d12-browser/에 남아 있다.
- captures.json에는 원본·목적 경로, 역할, magic, 크기, native dimensions, raw/output SHA-256 및 변환 명령이 있다.
- 기계적 검증 범위는 경로·형식·magic·해상도·바이트 복사·해시다. 이미지 눈검수는 이 작업에서 하지 않았다.

## 관측 단계

- mermaid-final-progress와 mermaid-anchor-post-1은 중간 관측이다.
- mermaid-final은 앵커 수정 전 19개 관측을 담는다. 마지막 direct-source-anchor-reload-after-render는 targetTop -602.836, SVG 오류 0, 도식별 SVG 수 [1, 1, 1]인 실패다. 이 묶음 전체를 성공 결과로 표시하지 않는다.
- anchor-final-cases의 최종 직접 링크 4건은 모두 통과했고 오류는 0, 도식별 SVG는 [1, 1, 1], targetTop 범위는 96.164–96.242다.
- 실제 Down과 Tab 입력은 모두 cancellationObserved=true였다. 입력 직후 렌더는 1/3, 완료 후 3/3 SVG와 오류 0을 기록했다. locator refocus가 포함된 anchor-native-page-down은 취소 flag가 false이므로 이 사실의 증거로 사용하지 않는다.
- 빈 hash 진입 전에는 scene mode·0/3 SVG, read 진입 후에도 hash는 빈 채 3/3 SVG·오류 0·제목 top 95.789을 기록했다.
- 콘솔 확장 로그 100건을 필터링한 결과는 도식 정상 렌더링의 증거로 취급하지 않는다.

## 수정 전 캡처 표기

main-browser/extra-captures.json의 width-1280-reader-pc-dark.jpg은 메인 브라우저에서 Mermaid Syntax error가 발견된 before-fix 캡처다. 이미지와 원본 해시는 유지하고 status/finding/supersededBy metadata만 추가했다. 대체 화면은 browser/mermaid-final-no-hash-reader.jpg다. 다른 extra capture record와 JPEG는 변경하지 않았다.


## 최종 helper 도식 수용 캡처

- 메인이 final helper v26fd의 D12 첫 14-node 원문 Mermaid 도식을 상단·하단 두 viewport로 나눠 실제 눈검수했고, 겹침이나 잘림이 없는 수용 캡처로 확인했다. AI 생성 시안이 아니다. 두 캡처 모두 sourceErrors=false이며 1672×941이다.
- browser/captures.json에 두 JPG의 source/output SHA-256, magic, 크기, 명령과 main acceptance를 추가했다. 원본은 /tmp/d12-browser/에 보존했다.
- acceptedVisuals 목록은 이 요약 JSON에 추가했다.
