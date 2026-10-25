# 메모리 보강 문장의 공식 근거

확인일: 2026-10-25 Asia/Seoul. 직접 Codex CLI gpt-6-luna / OpenAI / high가 공식 본문을 조사했고, 메인이 같은 본문 MemAvailable 항목을 다시 열어 대조했다. LiteLLM 사용 없음.

공식 출처: https://docs.kernel.org/filesystems/proc.html#meminfo

커널 문서는 MemAvailable을 swap 없이 새 애플리케이션을 시작하는 데 쓸 수 있는 메모리의 추정치로 설명한다. MemFree와 회수 가능한 slab, file LRU, zone watermark를 고려하고 page cache와 실제 회수할 수 없는 부분을 감안한다. 이 근거는 SPEC의 available 보강 설명을 지지하며, 원문 D12에 cache 설명이 있었다는 뜻은 아니다.

연구 결과: LOCAL_HOME/research/javaexperience-d12-linux-terminal-20261025/free-claim-direct-addendum.md
원자료: LOCAL_HOME/research/javaexperience-d12-linux-terminal-20261025/_data/free-claim-direct-source.txt
실제 모델 확인: thread 01a16f7a-f810-7273-a131-d80745cf10b4의 session_meta provider=openai, turn_context model=gpt-6-luna / effort=high를 직접 확인했다.
앞선 조사 thread 01a16f78-ad0d-7163-9d94-5006461ba7f9 역시 외부 실행 자체는 같은 모델·제공자로 시작했다. 그 실행자가 금지된 중첩 CLI를 시도하다 Operation not permitted로 실패한 기록은 별도 보존했다. 모델 접근 실패나 저장 용량 문제로 확대하지 않는다.

한계: 실제 free 출력이나 사용자 메모리 상태를 조회하지 않았다. 커널 공식 문서의 정의 대조이며 특정 호스트의 여유량·OOM·성능 측정이 아니다.
