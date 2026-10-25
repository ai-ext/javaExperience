# 새 인스턴스 재현 비교

첫 재현에서 35관측은 모두 통과했으나 frozen JSON 비교가 실패했다. 차이는 trace[0]의 새 임시 datadir/socket 두 경로뿐이었다. 실제 격리 검증 원본은 각 연구 runtime의 isolation.json에 남기고, 결정적 SQL 관측 trace에서는 setup 격리 조회를 제외했다. SQL 결과·오류·값을 정규화하거나 바꾸지 않았다. 이 변경 후 새 datadir로 기준 재작성 및 다시 재현한다.
