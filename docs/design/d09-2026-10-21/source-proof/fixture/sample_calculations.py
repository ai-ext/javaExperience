"""명시 샘플의 Decimal·nearest-rank 계산. 실제 트래픽·latency 측정이 아니다."""
from decimal import Decimal, ROUND_CEILING
import json

valid = Decimal('10000')
success = Decimal('9980')
failures = valid - success
target = Decimal('0.999')
allowed_failures = valid * (1 - target)
remaining = allowed_failures - failures
burn = (failures / valid) / (1 - target)
time_example_minutes = Decimal('30') * 24 * 60 * (1 - target)
def value(number):
    return format(number.normalize(), 'f')
vector = [10, 20, 30, 40, 50]
def nearest_rank(percentile):
    rank = int((Decimal(str(percentile)) * len(vector)).to_integral_value(rounding=ROUND_CEILING))
    return {'rank': rank, 'value': sorted(vector)[rank - 1]}
print(json.dumps({'budget': {'kind': 'explicit sample, not measured traffic',
    'valid': value(valid), 'success': value(success), 'failures': value(failures),
    'targetPercent': value(target * 100), 'allowedFailures': value(allowed_failures),
    'remaining': value(remaining), 'burn': value(burn),
    'successPercent': value(success / valid * 100),
    'timeOnlyExample': {'days': '30', 'minutes': value(time_example_minutes),
    'condition': 'only a time-based SLI example; never convert the request-count SLI to downtime'}},
    'percentile': {'kind': 'explicit vector, not measured latency', 'method': 'nearest-rank',
    'vector': vector, 'p50': nearest_rank('0.50'), 'p95': nearest_rank('0.95')}}))
