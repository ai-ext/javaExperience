"""D38의 유한 GET 표본 수집기. 도메인 부하·정합성 검증은 별도로 수행한다."""
import argparse
import concurrent.futures
import datetime
import http.client
import json
import math
import pathlib
import signal
import time
import urllib.error
import urllib.request


def positive(value):
    number = int(value)
    if number < 1:
        raise argparse.ArgumentTypeError('1 이상이어야 합니다')
    return number


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def deadline_exceeded(signum, frame):
    raise TimeoutError('request deadline exceeded')


def sample(task):
    index, url, timeout = task
    started_at, started = now(), time.perf_counter()
    status, error = 0, None
    # 각 프로세스의 주 스레드에서 연결·헤더·본문 전체에 같은 마감 시간을 적용한다.
    signal.signal(signal.SIGALRM, deadline_exceeded)
    signal.setitimer(signal.ITIMER_REAL, timeout)
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            status = response.status
            response.read()
    except urllib.error.HTTPError as exc:
        status, error = exc.code, str(exc)
        exc.close()
    except (urllib.error.URLError, TimeoutError, OSError, http.client.HTTPException) as exc:
        error = f'{type(exc).__name__}: {exc}'
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)
    return dict(index=index, url=url, startedAt=started_at, finishedAt=now(),
                status=status, error=error, latencyMs=(time.perf_counter()-started)*1000)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('urls', nargs='+', help='실험 앱의 GET URL을 번갈아 호출')
    parser.add_argument('--requests', type=positive, default=100)
    parser.add_argument('--concurrency', type=positive, default=4)
    parser.add_argument('--timeout', type=positive, default=2,
                        help='연결부터 본문 수신 완료까지의 전체 deadline(초, macOS/Linux)')
    parser.add_argument('--output', required=True, type=pathlib.Path)
    args = parser.parse_args()

    # future를 한꺼번에 만들지 않고 동시 실행 수만큼 묶어 유한 요청을 보낸다.
    started_at, started = now(), time.perf_counter()
    rows = []
    with args.output.open('w') as output, concurrent.futures.ProcessPoolExecutor(args.concurrency) as pool:
        for begin in range(0, args.requests, args.concurrency):
            tasks = ((i, args.urls[i % len(args.urls)], args.timeout)
                     for i in range(begin, min(begin+args.concurrency, args.requests)))
            for row in pool.map(sample, tasks):
                rows.append(row)
                output.write(json.dumps(row, ensure_ascii=False)+'\n')
            output.flush()
    seconds = time.perf_counter()-started
    latency = sorted(row['latencyMs'] for row in rows)
    errors = sum(row['error'] is not None or not 200 <= row['status'] < 300 for row in rows)
    percentile = lambda p: latency[math.ceil(len(latency)*p)-1]
    print(json.dumps(dict(startedAt=started_at, finishedAt=now(), requests=len(rows), errors=errors,
                          errorRate=errors/len(rows), elapsedSeconds=seconds,
                          throughputPerSecond=len(rows)/seconds, percentileMethod='nearest-rank, all attempts',
                          p50Ms=percentile(.50), p95Ms=percentile(.95), p99Ms=percentile(.99))))


if __name__ == '__main__':
    main()
