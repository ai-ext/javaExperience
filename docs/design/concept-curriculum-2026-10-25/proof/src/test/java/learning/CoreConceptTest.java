package learning;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.UnsatisfiedDependencyException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.SpringBootVersion;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.web.server.context.WebServerApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.SpringVersion;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

class CoreConceptTest {
    @TempDir Path temporary;

    static void fact(String unit, String key, Object value) {
        System.out.println("PROOF|" + unit + "|" + key + "|" + value);
    }

    @Test void C01_objectsConstructorAndReferences() {
        var first = new PlainValue("민수");
        var alias = first;
        var second = new PlainValue("민수");
        assertSame(first, alias);
        assertNotSame(first, second);
        assertEquals(first.getName(), second.getName());
        assertEquals("민수", first.getName());
        fact("C01", "reference", "alias=same;second=different;name=민수");
    }

    @Test void C02_realBootHttpAndClose() throws Exception {
        var application = new SpringApplication(MinimalApp.class);
        int port;
        try (ConfigurableApplicationContext context = application.run(
                "--server.address=127.0.0.1", "--server.port=0",
                "--spring.main.banner-mode=off", "--logging.level.root=ERROR")) {
            port = ((WebServerApplicationContext) context).getWebServer().getPort();
            assertTrue(port > 0);
            try (HttpClient client = HttpClient.newHttpClient()) {
                var request = HttpRequest.newBuilder(URI.create(
                        "http://127.0.0.1:" + port + "/api/concepts/greeting?name=Min"))
                        .timeout(Duration.ofSeconds(5)).build();
                var response = client.send(request, HttpResponse.BodyHandlers.ofString());
                assertEquals(200, response.statusCode());
                assertEquals("Hello, Min", response.body());
                fact("C02", "http", response.statusCode() + " " + response.body());
                fact("C02", "loopbackPort", port);
            }
            fact("runtime", "java", System.getProperty("java.version"));
            fact("runtime", "boot", SpringBootVersion.getVersion());
            fact("runtime", "framework", SpringVersion.getVersion());
        }
        try (var socket = new Socket()) {
            assertThrows(IOException.class, () -> socket.connect(
                    new InetSocketAddress("127.0.0.1", port), 500));
        }
        fact("C02", "closed", true);
    }

    @Test void C03_annotationsAreMetadataAndRetentionControlsLookup() throws Exception {
        var instance = new MarkedMethod();
        var method = MarkedMethod.class.getDeclaredMethod("run");
        assertTrue(method.isAnnotationPresent(RuntimeMark.class));
        assertFalse(method.isAnnotationPresent(ClassMark.class));
        assertEquals(0, instance.calls);
        method.invoke(instance);
        assertEquals(1, instance.calls);
        fact("C03", "retention", "RUNTIME=visible;CLASS=not-visible;calls-before=0;after=1");
    }

    @Test void C04_manualAndSpringConstructorInjection() {
        var manual = new GreetingService(new GreetingRepository());
        try (var context = new AnnotationConfigApplicationContext()) {
            context.registerBean(GreetingRepository.class);
            context.registerBean(GreetingService.class);
            context.refresh();
            var injected = context.getBean(GreetingService.class);
            assertEquals(manual.greet("Min"), injected.greet("Min"));
            assertSame(context.getBean(GreetingRepository.class), injected.repository);
            assertSame(injected, context.getBean(GreetingService.class));
            fact("C04", "injection", "manual=spring;repository=same-bean;service=singleton");
        }
    }

    @Test void C04_missingDependencyFailsDuringRefresh() {
        try (var context = new AnnotationConfigApplicationContext()) {
            context.registerBean(GreetingService.class);
            assertThrows(UnsatisfiedDependencyException.class, context::refresh);
            fact("C04", "missing", "UnsatisfiedDependencyException during refresh");
        }
    }

    @Test void C05_generatedConstructorAndGetterMatchExplicitCode() {
        var generated = new GeneratedValue("민수");
        var explicit = new PlainValue("민수");
        assertEquals(explicit.getName(), generated.getName());
        assertEquals(0, generated.getCount());
        assertEquals(1, GeneratedValue.class.getDeclaredConstructors().length);
        assertArrayEquals(new Class<?>[]{String.class}, GeneratedValue.class.getDeclaredConstructors()[0].getParameterTypes());
        fact("C05", "generated", "constructor(String);getName=민수;getCount=0");
    }

    @Test void C05_processorPresentAbsentAndDelombok() throws Exception {
        Path source = temporary.resolve("LombokCompile.java");
        Files.writeString(source, """
                import lombok.Getter;
                import lombok.RequiredArgsConstructor;
                public class LombokCompile {
                    @Getter @RequiredArgsConstructor
                    static class Value { private final String name; }
                    public static void main(String[] args) {
                        System.out.println(new Value("Min").getName());
                    }
                }
                """, StandardCharsets.UTF_8);
        Path jar = Path.of(System.getProperty("proof.lombok.jar"));
        Path success = Files.createDirectory(temporary.resolve("success"));
        Path failure = Files.createDirectory(temporary.resolve("failure"));
        var good = command("javac", "--release", "21", "-cp", jar.toString(),
                "-processorpath", jar.toString(), "-d", success.toString(), source.toString());
        assertEquals(0, good.exit(), good.output());
        var executed = command("java", "-cp", success.toString(), "LombokCompile");
        assertEquals(0, executed.exit(), executed.output());
        assertEquals("Min", executed.output().strip());
        var bad = command("javac", "--release", "21", "-proc:none", "-cp", jar.toString(),
                "-d", failure.toString(), source.toString());
        assertNotEquals(0, bad.exit());
        assertTrue(bad.output().contains("getName") || bad.output().contains("constructor Value"), bad.output());
        Path expanded = temporary.resolve("expanded");
        var delombok = command("java", "-jar", jar.toString(), "delombok", source.toString(), "-d", expanded.toString());
        assertEquals(0, delombok.exit(), delombok.output());
        String output = Files.readString(expanded.resolve("LombokCompile.java"));
        assertTrue(output.contains("Value(final String name)"), output);
        assertTrue(output.contains("getName()"), output);
        Path raw = Path.of(System.getProperty("proof.output"));
        Files.createDirectories(raw);
        Files.writeString(raw.resolve("LombokCompile.java"), Files.readString(source));
        Files.writeString(raw.resolve("delombok-output.java.txt"), output);
        Files.writeString(raw.resolve("processor-enabled.txt"), good.output() + executed.output());
        Files.writeString(raw.resolve("processor-disabled.txt"), bad.output());
        fact("C05", "processor", "enabled-exit=0;run=Min;disabled-exit=" + bad.exit());
        fact("C05", "delombok", "constructor and getter confirmed");
        fact("runtime", "lombokJar", jar.getFileName());
    }

    @Test void C06_lifecycleOnNormalContextClose() {
        var events = new Events();
        var context = new AnnotationConfigApplicationContext();
        context.registerBean(Events.class, () -> events);
        context.registerBean(GreetingRepository.class);
        context.registerBean(ObservedLifecycle.class);
        context.refresh();
        var bean = context.getBean(ObservedLifecycle.class);
        bean.use();
        assertEquals(List.of("constructor", "setter-injection", "postConstruct", "use"), events.values);
        context.close();
        assertEquals(List.of("constructor", "setter-injection", "postConstruct", "use", "preDestroy"), events.values);
        fact("C06", "order", String.join(" -> ", events.values));
        fact("C06", "scope", "setter injection observation; normal close only; no forced-kill guarantee tested");
    }

    record CommandResult(int exit, String output) {}
    CommandResult command(String program, String... arguments) throws Exception {
        var args = new ArrayList<String>();
        args.add(Path.of(System.getProperty("java.home"), "bin", program).toString());
        args.addAll(List.of(arguments));
        Path log = Files.createTempFile(temporary, "command-", ".log");
        var process = new ProcessBuilder(args).redirectErrorStream(true).redirectOutput(log.toFile()).start();
        if (!process.waitFor(45, TimeUnit.SECONDS)) {
            process.destroyForcibly();
            assertTrue(process.waitFor(5, TimeUnit.SECONDS));
            fail("Own proof subprocess timed out: " + program);
        }
        return new CommandResult(process.exitValue(), Files.readString(log));
    }

    static class PlainValue {
        final String name;
        PlainValue(String name) { this.name = name; }
        String getName() { return name; }
    }
    @Getter @RequiredArgsConstructor
    static class GeneratedValue { private final String name; private int count; }
    @Retention(RetentionPolicy.RUNTIME) @interface RuntimeMark {}
    @Retention(RetentionPolicy.CLASS) @interface ClassMark {}
    static class MarkedMethod {
        int calls;
        @RuntimeMark @ClassMark void run() { calls++; }
    }
    static class GreetingRepository { String prefix() { return "Hello, "; } }
    static class GreetingService {
        final GreetingRepository repository;
        GreetingService(GreetingRepository repository) { this.repository = repository; }
        String greet(String name) { return repository.prefix() + name; }
    }
    @Configuration(proxyBeanMethods = false) @EnableAutoConfiguration
    static class MinimalApp {
        @Bean GreetingRepository repository() { return new GreetingRepository(); }
        @Bean GreetingService service(GreetingRepository repository) { return new GreetingService(repository); }
        @Bean GreetingController controller(GreetingService service) { return new GreetingController(service); }
    }
    @RestController
    static class GreetingController {
        final GreetingService service;
        GreetingController(GreetingService service) { this.service = service; }
        @GetMapping("/api/concepts/greeting") String greet(@RequestParam(name = "name") String name) { return service.greet(name); }
    }
    static class Events { final List<String> values = new ArrayList<>(); }
    static class ObservedLifecycle {
        final Events events;
        GreetingRepository repository;
        ObservedLifecycle(Events events) { this.events = events; events.values.add("constructor"); }
        @Autowired void setRepository(GreetingRepository repository) { this.repository = repository; events.values.add("setter-injection"); }
        @PostConstruct void initialize() { assertNotNull(repository); events.values.add("postConstruct"); }
        void use() { assertNotNull(repository); events.values.add("use"); }
        @PreDestroy void destroy() { events.values.add("preDestroy"); }
    }
}
