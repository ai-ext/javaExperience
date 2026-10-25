package com.example.orders;
import java.util.UUID;
import org.springframework.stereotype.Component;
@Component
class OrderIdGenerator { String next() { return UUID.randomUUID().toString(); } }
