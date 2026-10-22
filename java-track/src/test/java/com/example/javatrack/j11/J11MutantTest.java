package com.example.javatrack.j11;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.platform.engine.discovery.DiscoverySelectors.selectClass;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Collectors;

import javax.tools.JavaCompiler;
import javax.tools.ToolProvider;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.platform.launcher.LauncherDiscoveryRequest;
import org.junit.platform.launcher.core.LauncherDiscoveryRequestBuilder;
import org.junit.platform.launcher.core.LauncherFactory;
import org.junit.platform.launcher.listeners.SummaryGeneratingListener;
import org.junit.platform.launcher.listeners.TestExecutionSummary;

/**
 * 주제 과제 확인: {@link J11CharacterizationTest}가 레거시 동작을 정말 고정했는지 본다. 이 파일은 고치지 않는다.
 * <ol>
 *   <li>원본 {@link LegacyPointCalculator}에서는 특성화 테스트가 모두 통과해야 한다</li>
 *   <li>원본에서 한 곳만 바꾼 변형({@link LegacyPointCalculatorMutant})에서는 하나 이상 실패해야 한다</li>
 * </ol>
 * 변형은 원본 소스를 읽어 한 곳을 바꾼 뒤 그 자리에서 컴파일한다. 특성화 테스트는 JUnit Platform Launcher로
 * 다시 실행하되, j11 패키지 클래스를 새 클래스 로더에 다시 올려 {@code LegacyPointCalculator}만 변형으로 바꿔 끼운다.
 */
class J11MutantTest {

    private static final String CHARACTERIZATION_TEST = "com.example.javatrack.j11.J11CharacterizationTest";
    // Gradle은 테스트를 모듈 디렉터리(java-track)에서 실행한다
    private static final Path LEGACY_SOURCE =
            Path.of("src/main/java/com/example/javatrack/j11/LegacyPointCalculator.java");

    @Test
    void 원본_레거시에서는_특성화_테스트가_모두_통과한다() throws Exception {
        assertAllPassOnOriginal();
    }

    @ParameterizedTest
    @EnumSource(LegacyPointCalculatorMutant.class)
    void 한_곳을_바꾼_변형에서는_특성화_테스트가_실패한다(LegacyPointCalculatorMutant mutant, @TempDir Path workDir)
            throws Exception {
        // 원본에서부터 실패하는 테스트는 어떤 변형이든 "잡는다". 원본 통과를 먼저 확인한다
        assertAllPassOnOriginal();

        Path mutantClasses = compile(mutant, workDir);
        TestExecutionSummary summary = run(new MutantClassLoader(mutantClasses, J11MutantTest.class.getClassLoader()));

        assertThat(summary.getTestsFoundCount()).isPositive();
        assertThat(summary.getTotalFailureCount())
                .as("변형 [%s]에서도 특성화 테스트가 모두 통과합니다. 이 변화를 잡는 입력과 단언을 더하세요", mutant)
                .isPositive();
        // 단언이 잡아야 한다. 클래스 로딩 오류 같은 다른 이유로 실패한 것은 잡은 것이 아니다
        assertThat(summary.getFailures()).allSatisfy(failure -> assertThat(failure.getException())
                .as("변형 [%s]에서 단언 실패가 아닌 예외: %s", mutant, failure.getException())
                .isInstanceOf(AssertionError.class));
    }

    private static void assertAllPassOnOriginal() throws ClassNotFoundException {
        TestExecutionSummary summary = run(J11MutantTest.class.getClassLoader());

        assertThat(summary.getTestsFoundCount())
                .as("J11CharacterizationTest에 실행할 테스트가 없습니다")
                .isPositive();
        assertThat(summary.getTestsSucceededCount())
                .as("원본 LegacyPointCalculator에서 특성화 테스트가 모두 통과해야 합니다."
                        + " 기대값은 옳은 값이 아니라 지금 나오는 값으로 적습니다.%n%s", failures(summary))
                .isEqualTo(summary.getTestsFoundCount());
    }

    /** 특성화 테스트 클래스를 {@code loader}에서 읽어 새 Launcher로 실행하고 결과 요약을 돌려준다. */
    private static TestExecutionSummary run(ClassLoader loader) throws ClassNotFoundException {
        Class<?> testClass = Class.forName(CHARACTERIZATION_TEST, false, loader);
        LauncherDiscoveryRequest request = LauncherDiscoveryRequestBuilder.request()
                .selectors(selectClass(testClass))
                .build();
        SummaryGeneratingListener listener = new SummaryGeneratingListener();
        LauncherFactory.create().execute(request, listener);
        return listener.getSummary();
    }

    private static String failures(TestExecutionSummary summary) {
        return summary.getFailures().stream()
                .map(failure -> "  - " + failure.getTestIdentifier().getDisplayName() + ": "
                        + failure.getException().getMessage())
                .collect(Collectors.joining(System.lineSeparator()));
    }

    /** 원본 소스에 변형을 적용해 컴파일하고, 클래스 파일이 담긴 디렉터리를 돌려준다. */
    private static Path compile(LegacyPointCalculatorMutant mutant, Path workDir) throws IOException {
        assertThat(LEGACY_SOURCE).as("레거시 원본 소스를 찾을 수 없습니다(작업 디렉터리: %s)", Path.of("").toAbsolutePath())
                .exists();
        Path sourceFile = workDir.resolve("src").resolve("LegacyPointCalculator.java");
        Files.createDirectories(sourceFile.getParent());
        Files.writeString(sourceFile, mutant.applyTo(Files.readString(LEGACY_SOURCE)));
        Path classes = workDir.resolve("classes");

        JavaCompiler javac = ToolProvider.getSystemJavaCompiler();
        ByteArrayOutputStream log = new ByteArrayOutputStream();
        int exitCode = javac.run(null, log, log,
                "-encoding", "UTF-8", "-d", classes.toString(), sourceFile.toString());

        assertThat(exitCode).as("변형 [%s] 컴파일 실패:%n%s", mutant, log.toString(StandardCharsets.UTF_8)).isZero();
        return classes;
    }

    /**
     * j11 패키지 클래스를 부모에 맡기지 않고 이 로더가 직접 정의한다.
     * {@code LegacyPointCalculator}는 변형 클래스 파일로, 나머지는 부모가 쓰는 클래스 파일 그대로 올린다.
     * 그래서 특성화 테스트(와 그 테스트가 부르는 {@code PointTable} 같은 도우미)가 부르는 레거시가 변형으로 바뀐다.
     * JUnit·AssertJ 같은 다른 패키지는 부모 것을 그대로 쓴다.
     */
    private static final class MutantClassLoader extends ClassLoader {

        private static final String PACKAGE_PREFIX = "com.example.javatrack.j11.";

        private final Path mutantClasses;

        MutantClassLoader(Path mutantClasses, ClassLoader parent) {
            super(parent);
            this.mutantClasses = mutantClasses;
        }

        @Override
        protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
            if (!name.startsWith(PACKAGE_PREFIX)) {
                return super.loadClass(name, resolve);
            }
            synchronized (getClassLoadingLock(name)) {
                Class<?> loaded = findLoadedClass(name);
                if (loaded == null) {
                    byte[] bytes = readClassFile(name);
                    loaded = defineClass(name, bytes, 0, bytes.length);
                }
                if (resolve) {
                    resolveClass(loaded);
                }
                return loaded;
            }
        }

        private byte[] readClassFile(String name) throws ClassNotFoundException {
            String path = name.replace('.', '/') + ".class";
            try {
                Path mutant = mutantClasses.resolve(path);
                if (Files.exists(mutant)) {
                    return Files.readAllBytes(mutant);
                }
                try (InputStream in = getParent().getResourceAsStream(path)) {
                    if (in == null) {
                        throw new ClassNotFoundException(name);
                    }
                    return in.readAllBytes();
                }
            } catch (IOException e) {
                throw new ClassNotFoundException(name, e);
            }
        }
    }
}
