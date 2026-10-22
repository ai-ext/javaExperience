package com.example.javatrack.j14;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * 주제 과제: null 처리 — null을 돌려주는 조회 메서드를 Optional과 빈 컬렉션으로 바꾸고 호출부의 NPE를 없앤다.
 * <p>
 * 특성화 테스트 3개는 값이 있는 경우의 동작이라 바꾸기 전(뼈대)에도 통과하고, 바꾼 뒤에도 그대로 통과해야 한다.
 * "없는 경우"의 테스트는 지금 NPE가 나므로 바꾸기 전에는 실패한다.
 * <p>
 * {@code findByEmail}은 반환 타입이 {@code Member}에서 {@code Optional<Member>}로 바뀐다. 이 테스트는 바꾸기 전 코드로
 * 컴파일되므로 직접 부르면 바꾼 뒤 {@code NoSuchMethodError}가 난다. 그래서 이 메서드만 이름으로 찾아(리플렉션) 부른다.
 */
class J14NullRefactorTest {

    private static final Member JAVA = new Member(1L, "java@example.com", "자바초보");
    private static final Member NEW = new Member(2L, "new@example.com", "새회원");

    private MemberRepository repository;
    private PointReportService service;

    @BeforeEach
    void setUp() {
        repository = new MemberRepository();
        repository.save(JAVA);
        repository.save(NEW); // 내역이 없는 회원
        repository.addHistory(new PointHistory(1L, 1000, "출석"));
        repository.addHistory(new PointHistory(1L, 800, "글쓰기"));
        repository.addHistory(new PointHistory(1L, -300, "아이템 구매"));
        service = new PointReportService(repository);
    }

    // ---- 특성화: 값이 있을 때 동작은 그대로 ----

    @Test
    void 특성화_내역이_있는_회원은_닉네임과_합계를_보여_준다() {
        assertThat(service.report("java@example.com")).isEqualTo("자바초보: 1500P");
    }

    @Test
    void 특성화_없는_회원이면_회원_없음이다() {
        assertThat(service.report("nobody@example.com")).isEqualTo("회원 없음");
    }

    @Test
    void 특성화_합계는_적립과_사용을_더한_값이다() {
        assertThat(service.totalPoints("java@example.com")).isEqualTo(1500);
    }

    // ---- 호출부: 없는 경우에도 NPE가 나지 않는다 ----

    @Test
    void 내역이_없는_회원도_NPE_없이_0P를_보여_준다() {
        assertThatCode(() -> service.report("new@example.com"))
                .as("findHistories가 빈 목록을 돌려주게 하고, report가 내역 없는 회원도 NPE 없이 0P로 보여 주게 하세요")
                .doesNotThrowAnyException();
        assertThat(service.report("new@example.com")).isEqualTo("새회원: 0P");
    }

    @Test
    void 없는_회원이나_내역이_없는_회원의_합계는_NPE_없이_0이다() {
        assertThatCode(() -> service.totalPoints("nobody@example.com"))
                .as("저장소가 Optional·빈 목록을 돌려주게 하고, totalPoints가 없는 회원과 내역 없는 회원을 NPE 없이 0으로 처리하게 하세요")
                .doesNotThrowAnyException();
        assertThat(service.totalPoints("nobody@example.com")).isZero();
        assertThat(service.totalPoints("new@example.com")).isZero();
    }

    // ---- 저장소: null을 돌려주지 않는다 ----

    @Test
    void findByEmail의_반환_타입은_Optional_Member다() throws NoSuchMethodException {
        Method method = MemberRepository.class.getMethod("findByEmail", String.class);
        Type returnType = method.getGenericReturnType();

        assertThat(method.getReturnType()).as("findByEmail의 반환 타입을 Optional<Member>로 바꾸세요").isEqualTo(Optional.class);
        assertThat(returnType).as("findByEmail의 반환 타입을 Optional<Member>로 바꾸세요").isInstanceOf(ParameterizedType.class);
        assertThat(((ParameterizedType) returnType).getActualTypeArguments())
                .as("findByEmail의 반환 타입을 Optional<Member>로 바꾸세요")
                .containsExactly(Member.class);
    }

    @Test
    void findByEmail은_있으면_값이_든_Optional_없으면_빈_Optional이다() throws Exception {
        Object found = findByEmail("java@example.com");
        Object missing = findByEmail("nobody@example.com");

        assertThat(found).as("findByEmail은 찾은 회원을 Optional로 감싸 돌려줘야 합니다").isEqualTo(Optional.of(JAVA));
        assertThat(missing).isNotNull().isEqualTo(Optional.empty());
    }

    @Test
    void findHistories는_내역이_없으면_null이_아니라_빈_목록이다() {
        assertThat(repository.findHistories(NEW.id()))
                .as("findHistories는 내역이 없으면 null 대신 빈 목록(List.of())을 돌려줘야 합니다")
                .isNotNull().isEmpty();
        assertThat(repository.findHistories(99L)).isNotNull().isEmpty();
        assertThat(repository.findHistories(JAVA.id())).hasSize(3);
    }

    /** 반환 타입이 바뀌는 메서드라 이름으로 찾아 부른다(클래스 설명 참고). */
    private Object findByEmail(String email) throws Exception {
        return MemberRepository.class.getMethod("findByEmail", String.class).invoke(repository, email);
    }
}
