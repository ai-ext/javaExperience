package com.example.debuglab;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import org.slf4j.LoggerFactory;

public class SourceProbe {
    public static void main(String[] args) {
        OrderController controller = new OrderController();
        System.out.println("SOURCE_7=" + controller.find(7));
        try { controller.find(13); }
        catch (IllegalStateException failure) {
            System.out.println("TOP=" + failure.getClass().getName() + ":" + failure.getMessage());
            System.out.println("TOP_FRAME=" + failure.getStackTrace()[0].getClassName() + "." + failure.getStackTrace()[0].getMethodName());
            System.out.println("CAUSE=" + failure.getCause().getClass().getName() + ":" + failure.getCause().getMessage());
            System.out.println("SOURCE_SUPPRESSED=" + failure.getSuppressed().length);
            failure.printStackTrace(System.out);
        }
        Logger log = (Logger) LoggerFactory.getLogger(OrderController.class);
        for (Level level : new Level[] {Level.INFO, Level.DEBUG}) {
            log.setLevel(level);
            System.out.println("LEVEL_BEGIN=" + level);
            log.debug("D05_DEBUG_MARKER");
            System.out.println("METHOD_RESULT=" + controller.find(7).get("status"));
            System.out.println("LEVEL_END=" + level);
        }
    }
}
