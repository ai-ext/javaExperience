package com.example.board.tickets;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.lang.annotation.Annotation;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.MethodParameter;
import org.springframework.core.ResolvableType;
import org.springframework.asm.ClassReader;
import org.springframework.asm.ClassVisitor;
import org.springframework.asm.Handle;
import org.springframework.asm.MethodVisitor;
import org.springframework.asm.Opcodes;
import org.springframework.asm.SpringAsmInfo;
import org.springframework.asm.Type;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.util.ClassUtils;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import org.springframework.web.util.ServletRequestPathUtils;

import com.example.board.ApiTestSupport;
import com.example.board.common.ForbiddenWordLoader;
import com.example.board.member.Member;
import com.example.board.member.Role;
import com.example.board.notification.NotificationChannel;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * B04 확인 테스트. 리팩터링 뒤에도 바깥 동작(알림 행·금칙어 400)은 그대로이고, 구조는 고쳐져 있어야 한다.
 * - 알림: notification 표에 쌓이는 (받는 사람, 채널, 종류, 제목, 본문, 대상 글)이 리팩터링 전과 같다.
 * - 구조: 애플리케이션 빈에 필드 주입이 없고, 빈 사이 의존에 순환이 없다(@Lazy로 기동만 되게 가린 순환도 순환이다).
 * - 채널 추가: 채널을 하나 더해도 글·댓글 쪽은 고칠 필요가 없다. 글 작성·댓글 작성·글 삭제 API를 처리하는 빈은 개별 채널을
 *   모르고, 채널별로 갈라지는 분기(채널 switch, 채널 값 여럿과의 비교)는 앱 전체에 한 곳을 넘지 않는다.
 *   클래스 이름·파일 수는 보지 않는다. 컴파일된 main 클래스의 바이트코드를 읽어 판정한다.
 */
class B04ConfirmTest extends ApiTestSupport {

    static final String EMAIL_PREFIX = "[게시판] ";
    static final String EMAIL_FOOTER = "\n\n이 메일은 발신 전용입니다. 알림 설정은 내 정보에서 바꿀 수 있습니다.";

    @Autowired
    ApplicationContext context;

    @Autowired
    ForbiddenWordLoader forbiddenWordLoader;

    String bannedWord;

    @AfterEach
    void removeBannedWord() {
        if (bannedWord != null) {
            jdbc.update("DELETE FROM banned_word WHERE word = ?", bannedWord);
            forbiddenWordLoader.load();
        }
    }

    record Row(String channel, String type, String title, String body, Long refId) {
    }

    Set<Row> notificationsOf(Member m) {
        return new HashSet<>(jdbc.query("SELECT channel, type, title, body, ref_id FROM notification WHERE member_id = ?",
                (rs, i) -> new Row(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4),
                        rs.getObject(5, Long.class)),
                m.getId()));
    }

    Long createPost(Member author, String title) throws Exception {
        String location = mockMvc.perform(post("/api/posts").header("Authorization", bearer(author))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"content\":\"본문입니다\",\"tags\":[]}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getHeader("Location");
        return Long.valueOf(location.substring(location.lastIndexOf('/') + 1));
    }

    void comment(Member who, Long postId, String content) throws Exception {
        mockMvc.perform(post("/api/posts/{id}/comments", postId).header("Authorization", bearer(who))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"" + content + "\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    void 글을_쓰면_작성자에게_알림함과_푸시로_등록_알림이_간다() throws Exception {
        Member author = newMember(Role.USER);

        Long postId = createPost(author, "알림 확인 글");

        String body = "'알림 확인 글' 글이 등록되어 10포인트가 적립되었습니다.";
        assertThat(notificationsOf(author)).containsExactlyInAnyOrder(
                new Row("IN_APP", "POST_CREATED", "글이 등록되었습니다", body, postId),
                new Row("PUSH", "POST_CREATED", "글이 등록되었습니다", body, postId));
        mockMvc.perform(get("/api/me/notifications").header("Authorization", bearer(author)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].type").value("POST_CREATED"))
                .andExpect(jsonPath("$[0].refId").value(postId));
    }

    @Test
    void 남의_글에_댓글을_달면_글쓴이에게_세_채널로_가고_내_글에_단_댓글은_알리지_않는다() throws Exception {
        Member author = newMember(Role.USER);
        Member commenter = newMember(Role.USER);
        Long postId = newPost(author);
        String content = "댓글 본문은 푸시에서 잘릴 만큼 충분히 길게 씁니다 1234567890 가나다라마바사";

        comment(commenter, postId, content);
        comment(author, postId, "내 글에 내가 단 댓글");

        String body = commenter.getNickname() + "님: " + content;
        String pushBody = body.substring(0, body.offsetByCodePoints(0, 39)) + "…";
        String title = "내 글에 새 댓글이 달렸습니다";
        assertThat(notificationsOf(author)).containsExactlyInAnyOrder(
                new Row("IN_APP", "COMMENT_ADDED", title, body, postId),
                new Row("PUSH", "COMMENT_ADDED", title, pushBody, postId),
                new Row("EMAIL", "COMMENT_ADDED", EMAIL_PREFIX + title, body + EMAIL_FOOTER, postId));
        assertThat(notificationsOf(commenter)).isEmpty();
    }

    @Test
    void 글을_지우면_댓글을_단_다른_회원에게만_알림함과_메일로_간다() throws Exception {
        Member author = newMember(Role.USER);
        Member c1 = newMember(Role.USER);
        Member c2 = newMember(Role.USER);
        Member bystander = newMember(Role.USER);
        Long postId = newPost(author);
        comment(c1, postId, "첫 댓글");
        comment(c1, postId, "같은 사람 두 번째 댓글");
        comment(c2, postId, "다른 사람 댓글");
        comment(author, postId, "작성자 댓글");
        jdbc.update("DELETE FROM notification WHERE member_id = ?", author.getId());

        mockMvc.perform(delete("/api/posts/{id}", postId).header("Authorization", bearer(author)))
                .andExpect(status().isNoContent());

        String title = "댓글을 단 글이 삭제되었습니다";
        String body = "댓글을 단 글 '제목'이(가) 작성자에 의해 삭제되었습니다.";
        Set<Row> expected = Set.of(
                new Row("IN_APP", "POST_DELETED", title, body, postId),
                new Row("EMAIL", "POST_DELETED", EMAIL_PREFIX + title, body + EMAIL_FOOTER, postId));
        assertThat(notificationsOf(c1)).isEqualTo(expected);
        assertThat(notificationsOf(c2)).isEqualTo(expected);
        assertThat(notificationsOf(author)).isEmpty();
        assertThat(notificationsOf(bystander)).isEmpty();
    }

    @Test
    void 제목이나_본문에_금칙어가_있으면_작성_수정_모두_400이다() throws Exception {
        bannedWord = "금칙" + UUID.randomUUID().toString().substring(0, 8);
        jdbc.update("INSERT INTO banned_word (word) VALUES (?)", bannedWord);
        forbiddenWordLoader.load();
        Member author = newMember(Role.USER);
        Long postId = createPost(author, "멀쩡한 글");

        mockMvc.perform(post("/api/posts").header("Authorization", bearer(author))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"제목 " + bannedWord + "\",\"content\":\"본문\",\"tags\":[]}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.type").value("/errors/validation"));
        mockMvc.perform(put("/api/posts/{id}", postId).header("Authorization", bearer(author))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"제목\",\"content\":\"본문 " + bannedWord + "\",\"tags\":[]}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.type").value("/errors/validation"));
        mockMvc.perform(patch("/api/posts/{id}", postId).header("Authorization", bearer(author))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"" + bannedWord + "\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.type").value("/errors/validation"));
        Integer posts = jdbc.queryForObject("SELECT COUNT(*) FROM post WHERE member_id = ?", Integer.class,
                author.getId());
        assertThat(posts).isEqualTo(1);
    }

    // ---- 구조 ----

    /** main 소스(build/classes/java/main)에서 온 com.example.board 빈의 실제 클래스. 테스트 설정 빈은 뺀다. */
    Map<String, Class<?>> applicationBeans() {
        Map<String, Class<?>> beans = new LinkedHashMap<>();
        for (String name : context.getBeanDefinitionNames()) {
            Class<?> type = context.getType(name);
            if (type == null) {
                continue;
            }
            Class<?> user = ClassUtils.getUserClass(type);
            if (user.getName().startsWith("com.example.board.") && isMainClass(user)) {
                beans.put(name, user);
            }
        }
        return beans;
    }

    static boolean isMainClass(Class<?> c) {
        var source = c.getProtectionDomain().getCodeSource();
        return source != null && !source.getLocation().toString().contains("/test/");
    }

    @Test
    void 애플리케이션_빈에_필드_주입이_없다() {
        List<String> injected = new ArrayList<>();
        for (Class<?> bean : new LinkedHashSet<>(applicationBeans().values())) {
            for (Class<?> c = bean; c != null && c != Object.class; c = c.getSuperclass()) {
                for (Field f : c.getDeclaredFields()) {
                    for (Annotation a : f.getAnnotations()) {
                        String n = a.annotationType().getSimpleName();
                        if (n.equals("Autowired") || n.equals("Inject") || n.equals("Resource") || n.equals("Lazy")) {
                            injected.add(c.getSimpleName() + "." + f.getName() + " @" + n);
                        }
                    }
                }
            }
        }
        assertThat(injected).as("필드 주입").isEmpty();
    }

    @Test
    void 애플리케이션_빈_사이_의존에_순환이_없다() {
        Map<String, Class<?>> beans = applicationBeans();
        Map<String, Set<String>> edges = new HashMap<>();
        for (Map.Entry<String, Class<?>> e : beans.entrySet()) {
            Set<String> deps = new LinkedHashSet<>();
            for (ResolvableType t : dependencyTypes(e.getValue())) {
                for (String target : context.getBeanNamesForType(t, true, false)) {
                    if (beans.containsKey(target) && !target.equals(e.getKey())) {
                        deps.add(target);
                    }
                }
            }
            edges.put(e.getKey(), deps);
        }

        assertThat(findCycle(edges)).as("빈 의존 순환(이름 → 이름)").isEmpty();
    }

    /** 생성자 매개변수와 인스턴스 필드의 타입. List<X>·ObjectProvider<X>·Optional<X>는 X로 본다. */
    static List<ResolvableType> dependencyTypes(Class<?> bean) {
        List<ResolvableType> types = new ArrayList<>();
        for (Constructor<?> ctor : bean.getDeclaredConstructors()) {
            for (int i = 0; i < ctor.getParameterCount(); i++) {
                types.add(unwrap(ResolvableType.forMethodParameter(new MethodParameter(ctor, i))));
            }
        }
        for (Class<?> c = bean; c != null && c != Object.class; c = c.getSuperclass()) {
            for (Field f : c.getDeclaredFields()) {
                if (!Modifier.isStatic(f.getModifiers())) {
                    types.add(unwrap(ResolvableType.forField(f)));
                }
            }
        }
        types.removeIf(t -> t.resolve() == null || !t.resolve().getName().startsWith("com.example.board."));
        return types;
    }

    static ResolvableType unwrap(ResolvableType t) {
        Class<?> raw = t.resolve();
        if (raw != null && (Iterable.class.isAssignableFrom(raw) || raw.getName().startsWith("java.util.Optional")
                || raw.getName().endsWith("ObjectProvider") || raw.getName().endsWith("ObjectFactory")
                || raw.getName().endsWith("Provider"))) {
            return t.getGeneric(0);
        }
        return t;
    }

    static List<String> findCycle(Map<String, Set<String>> edges) {
        Set<String> done = new HashSet<>();
        for (String start : edges.keySet()) {
            Deque<String> path = new ArrayDeque<>();
            List<String> cycle = dfs(start, edges, path, new HashSet<>(), done);
            if (!cycle.isEmpty()) {
                return cycle;
            }
        }
        return List.of();
    }

    static List<String> dfs(String node, Map<String, Set<String>> edges, Deque<String> path, Set<String> onPath,
            Set<String> done) {
        if (onPath.contains(node)) {
            List<String> cycle = new ArrayList<>();
            boolean in = false;
            for (String p : path) {
                in |= p.equals(node);
                if (in) {
                    cycle.add(p);
                }
            }
            cycle.add(node);
            return cycle;
        }
        if (done.contains(node)) {
            return List.of();
        }
        path.addLast(node);
        onPath.add(node);
        for (String next : edges.getOrDefault(node, Set.of())) {
            List<String> cycle = dfs(next, edges, path, onPath, done);
            if (!cycle.isEmpty()) {
                return cycle;
            }
        }
        path.removeLast();
        onPath.remove(node);
        done.add(node);
        return List.of();
    }

    // ---- 채널 추가 ----

    static final String CHANNEL = Type.getInternalName(NotificationChannel.class);
    static final String SWITCH_MAP = "$SwitchMap$" + NotificationChannel.class.getName().replace('.', '$');

    /** 이 요청을 처리하는 컨트롤러 클래스. */
    Class<?> controllerOf(String method, String uri) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        ServletRequestPathUtils.parseAndCache(request);
        // MVC 요청 처리기(액추에이터용 처리기 매핑도 같은 타입이라 이름으로 고른다)
        HandlerExecutionChain chain = context.getBean("requestMappingHandlerMapping",
                RequestMappingHandlerMapping.class).getHandler(request);
        assertThat(chain).as(method + " " + uri + " 처리기").isNotNull();
        return ClassUtils.getUserClass(((HandlerMethod) chain.getHandler()).getBeanType());
    }

    @Test
    void 글_댓글_API를_처리하는_빈은_개별_알림_채널을_모른다() throws Exception {
        Map<String, Class<?>> beans = applicationBeans();
        Set<Class<?>> handling = new LinkedHashSet<>();
        for (String[] api : new String[][] {{"POST", "/api/posts"}, {"POST", "/api/posts/1/comments"},
                {"DELETE", "/api/posts/1"}}) {
            Class<?> controller = controllerOf(api[0], api[1]);
            handling.add(controller);
            // 컨트롤러가 직접 받는 애플리케이션 빈(글·댓글 서비스)
            for (ResolvableType t : dependencyTypes(controller)) {
                for (String target : context.getBeanNamesForType(t, true, false)) {
                    if (beans.containsKey(target)) {
                        handling.add(beans.get(target));
                    }
                }
            }
        }

        Set<String> offenders = new TreeSet<>();
        for (Class<?> c : handling) {
            for (Path file : classFilesOf(c)) {
                String bytes = new String(Files.readAllBytes(file), StandardCharsets.ISO_8859_1);
                if (bytes.contains(CHANNEL) || bytes.contains(SWITCH_MAP)) {
                    offenders.add(file.getFileName().toString());
                }
            }
        }
        assertThat(offenders)
                .as("글 작성·댓글 작성·글 삭제를 처리하는 클래스 %s 중 NotificationChannel을 직접 다루는 것"
                        + "(채널을 더할 때마다 이 클래스를 고쳐야 한다)", handling.stream().map(Class::getSimpleName).toList())
                .isEmpty();
    }

    @Test
    void 알림_채널별로_갈라지는_분기는_한_곳을_넘지_않는다() throws Exception {
        Set<String> sites = new TreeSet<>();
        try (Stream<Path> files = Files.walk(mainClassesDir())) {
            for (Path file : files.filter(f -> f.toString().endsWith(".class")).toList()) {
                sites.addAll(channelBranchSites(file));
            }
        }
        assertThat(sites).as("채널별 분기(채널 switch, 채널 값 둘 이상과 비교)가 있는 메서드 — 채널을 더할 때 고칠 곳")
                .hasSizeLessThanOrEqualTo(1);
    }

    static Path mainClassesDir() throws URISyntaxException {
        return Path.of(NotificationChannel.class.getProtectionDomain().getCodeSource().getLocation().toURI());
    }

    /** 클래스와 그 안쪽 클래스(익명·switch 보조 클래스 포함)의 .class 파일. */
    static List<Path> classFilesOf(Class<?> c) throws Exception {
        Path dir = mainClassesDir().resolve(c.getPackageName().replace('.', '/'));
        String simple = c.getName().substring(c.getName().lastIndexOf('.') + 1);
        try (Stream<Path> files = Files.list(dir)) {
            return files.filter(f -> {
                String n = f.getFileName().toString();
                return n.equals(simple + ".class") || (n.startsWith(simple + "$") && n.endsWith(".class"));
            }).toList();
        }
    }

    /** 이 클래스 파일에서 채널별로 갈라지는 메서드("클래스#메서드"). 정적 초기화(종류별 채널 표 등)와 채널 enum 자신은 뺀다. */
    static Set<String> channelBranchSites(Path file) {
        ClassReader reader;
        try (InputStream in = Files.newInputStream(file)) {
            reader = new ClassReader(in);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        Set<String> sites = new TreeSet<>();
        if (reader.getClassName().equals(CHANNEL)) {
            return sites;
        }
        String owner = reader.getClassName().substring(reader.getClassName().lastIndexOf('/') + 1);
        reader.accept(new ClassVisitor(SpringAsmInfo.ASM_VERSION) {
            @Override
            public MethodVisitor visitMethod(int access, String name, String descriptor, String signature,
                    String[] exceptions) {
                if (name.equals("<clinit>")) {
                    return null;
                }
                return new MethodVisitor(SpringAsmInfo.ASM_VERSION) {
                    final Set<String> compared = new HashSet<>();
                    String lastConstant;
                    int sinceConstant = 99;
                    boolean switches;

                    void step() {
                        sinceConstant++;
                    }

                    @Override
                    public void visitFieldInsn(int opcode, String fieldOwner, String field, String desc) {
                        step();
                        if (field.equals(SWITCH_MAP)) {
                            switches = true; // switch (channel) — javac가 만든 보조 클래스의 표를 읽는다
                        } else if (opcode == Opcodes.GETSTATIC && fieldOwner.equals(CHANNEL)
                                && desc.equals("L" + CHANNEL + ";")) {
                            lastConstant = field;
                            sinceConstant = 0;
                        }
                    }

                    @Override
                    public void visitInvokeDynamicInsn(String n, String desc, Handle bsm, Object... args) {
                        step();
                        if (bsm.getOwner().equals("java/lang/runtime/SwitchBootstraps")
                                && (desc.contains(CHANNEL) || List.of(args).toString().contains(CHANNEL))) {
                            switches = true; // 패턴 switch
                        }
                    }

                    @Override
                    public void visitJumpInsn(int opcode, org.springframework.asm.Label label) {
                        if ((opcode == Opcodes.IF_ACMPEQ || opcode == Opcodes.IF_ACMPNE) && sinceConstant <= 1) {
                            compared.add(lastConstant); // channel == NotificationChannel.X
                        }
                        step();
                    }

                    @Override
                    public void visitMethodInsn(int opcode, String o, String n, String d, boolean itf) {
                        if (n.equals("equals") && sinceConstant <= 1) {
                            compared.add(lastConstant); // X.equals(channel) / Objects.equals(channel, X)
                        }
                        step();
                    }

                    @Override
                    public void visitVarInsn(int opcode, int var) {
                        // channel == X 와 X == channel 둘 다 잡도록 변수 읽기 한 번은 건너뛴다
                    }

                    @Override
                    public void visitInsn(int opcode) {
                        step();
                    }

                    @Override
                    public void visitTypeInsn(int opcode, String type) {
                        step();
                    }

                    @Override
                    public void visitLdcInsn(Object value) {
                        step();
                    }

                    @Override
                    public void visitIntInsn(int opcode, int operand) {
                        step();
                    }

                    @Override
                    public void visitEnd() {
                        if (switches || compared.size() >= 2) {
                            sites.add(owner + "#" + name);
                        }
                    }
                };
            }
        }, ClassReader.SKIP_DEBUG | ClassReader.SKIP_FRAMES);
        return sites;
    }
}
