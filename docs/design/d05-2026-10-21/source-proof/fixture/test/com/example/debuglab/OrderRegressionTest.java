package com.example.debuglab;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class OrderRegressionTest {
    @Test void sevenIsNormal() { assertEquals("OK", new OrderController().find(7).get("status")); }
    @Test void thirteenIsSimulatedFailure() {
        IllegalStateException failure = assertThrows(IllegalStateException.class, () -> new OrderController().find(13));
        assertInstanceOf(java.sql.SQLException.class, failure.getCause());
        assertEquals("simulated database timeout", failure.getCause().getMessage());
    }
}
