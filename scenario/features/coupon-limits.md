<!-- Generated from service/catalog.json and service/features/coupon-limits.json. Do not edit. -->
# 동시에 받아도 쿠폰 수량 지키기

> 기획 원본 · 상세 기획 원본은 service/features/coupon-limits.json입니다.

쿠폰 10장을 100명이 동시에 요청해도 정확히 10명만 받게 하세요. 실패 요청 뒤 DB 발급량과 Redis 잔여가 맞고 500이 없어야 합니다.
