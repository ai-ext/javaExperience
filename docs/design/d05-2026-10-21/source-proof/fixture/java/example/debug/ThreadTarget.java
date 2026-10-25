package example.debug;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.concurrent.CountDownLatch;

public class ThreadTarget {
    public static void main(String[] args) throws Exception {
        Object monitor = new Object();
        CountDownLatch held = new CountDownLatch(1), release = new CountDownLatch(1);
        Thread holder = new Thread(() -> { synchronized (monitor) { held.countDown(); try { release.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } } }, "d05-holder");
        holder.start(); held.await();
        Thread blocked = new Thread(() -> { synchronized (monitor) { System.out.println("BLOCKED_RELEASED"); } }, "d05-blocked");
        Thread waiting = new Thread(() -> { try { release.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } }, "d05-waiting");
        blocked.start(); waiting.start();
        while (blocked.getState() != Thread.State.BLOCKED || waiting.getState() != Thread.State.WAITING) Thread.onSpinWait();
        System.out.println("THREADS_READY");
        new BufferedReader(new InputStreamReader(System.in)).readLine();
        release.countDown(); holder.join(); blocked.join(); waiting.join();
        System.out.println("THREADS_DONE");
    }
}
