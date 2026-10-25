# D12 Task26 UI 독립 검수 · attempt3

명세 **PASS** 후 품질 **PASS**. C0 / I0 / M0. 최초 4건과 후속 하네스 2건은 해결됐다.

45개 상태의 유형·값·코드·lead·focus·source 본문·DOM·복사를 원문, 정본 raw와 독립 기대표에 대조했다. 제품 소스 변이 19개를 모두 검출했고, 최초 생존했던 분리 raw의 port 변이도 격리 사본에서 실패했다. `npm run test:d12`, `npm run test:concept-reader`, `npm run test:concept-dark`는 직접 exit 0을 확인했다.

collector는 D12 import와 수집 tuple 두 줄만 추가됐다. 다른 133개 task는 deep 비교 결과가 같고, task 26은 harnessCommand만 바뀌었다. 원문 135개와 학습자 src 17개는 HEAD와 바이트가 같다. 입력 134개의 SHA는 검수 시작과 종료 사이에 변하지 않았다.

실제 PC 배치, 전체 이미지와 확대 판독, OS clipboard, 최종 장부와 커밋은 메인의 별도 관문이다. 이 검수에서 Docker, 외부 CLI, 리서치, 제품 수정, 커밋은 수행하지 않았다. 원문 전체와 134개 문서 전체의 완성을 판정하지 않는다.

첫 명세 FAIL과 후보 2의 품질 FAIL은 불변으로 보존했다. 상세 원출력은 같은 작업 폴더의 ui-sol-logs/attempt3에 있다. 제품 snapshot은 /Users/ds/research/javaexperience-d12-linux-terminal-20261025/_data/ui-sol-candidate3-source에 보관했다.
