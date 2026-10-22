package com.example.javatrack.j10;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.Method;
import java.util.List;

import org.junit.jupiter.api.Test;

/**
 * 주제 과제: 어노테이션과 리플렉션, JDK 동적 프록시 — @Timed 메서드만 실행 시간을 기록하는 프록시(AOP의 원리).
 * 실행 시간 값 자체는 단언하지 않는다(실행할 때마다 다르다). 기록이 남았는지, 어떤 메서드 이름인지를 본다.
 */
class J10TimedProxyTest {

    private final FakeAdminActions target = new FakeAdminActions();
    private final TimingLog log = new TimingLog();

    @Test
    void Timed가_붙은_메서드만_기록된다() {
        AdminActions proxy = TimedProxy.wrap(AdminActions.class, target, log);

        proxy.hidePost(1L);      // @Timed
        proxy.countReports();    // 어노테이션 없음

        assertThat(log.methodNames()).containsExactly("hidePost");
        // 걸린 시간은 값을 단언하지 않고 음수가 아닌 Duration으로 남았는지만 본다
        assertThat(log.entries().get(0).elapsed().isNegative()).isFalse();
    }

    @Test
    void 프록시를_거쳐도_인자와_반환값은_그대로_전달된다() {
        AdminActions proxy = TimedProxy.wrap(AdminActions.class, target, log);

        String result = proxy.hidePost(3L);
        int reports = proxy.countReports();

        assertThat(result).isEqualTo("HIDDEN:3");
        assertThat(reports).isEqualTo(3);
        assertThat(target.calls()).containsExactly("hidePost:3", "countReports");
    }

    @Test
    void 여러_번_부르면_부른_순서대로_기록된다() {
        AdminActions proxy = TimedProxy.wrap(AdminActions.class, target, log);

        proxy.hidePost(1L);
        proxy.bulkIssueCoupon(10L, List.of(1L, 2L));
        proxy.hidePost(2L);

        assertThat(log.methodNames()).containsExactly("hidePost", "bulkIssueCoupon", "hidePost");
    }

    @Test
    void 인터페이스_메서드에_붙은_Timed도_기록된다() {
        AdminActions proxy = TimedProxy.wrap(AdminActions.class, target, log);

        int issued = proxy.bulkIssueCoupon(10L, List.of(1L, 2L, 3L));

        assertThat(issued).isEqualTo(3);
        assertThat(log.methodNames()).containsExactly("bulkIssueCoupon");
    }

    @Test
    void 대상이_던진_예외는_포장되지_않고_그대로_나오며_실패한_호출도_기록된다() {
        AdminActions proxy = TimedProxy.wrap(AdminActions.class, target, log);

        // 리플렉션 호출(method.invoke)은 대상의 예외를 InvocationTargetException으로 감싼다.
        // 벗기지 않으면 호출한 쪽은 UndeclaredThrowableException을 받는다
        assertThatThrownBy(() -> proxy.hidePost(-1L))
                .isInstanceOf(PostNotFoundException.class);
        assertThat(log.methodNames()).containsExactly("hidePost");
    }

    @Test
    void 같은_객체_안에서_this로_부르면_프록시를_거치지_않아_기록되지_않는다() {
        AdminActions proxy = TimedProxy.wrap(AdminActions.class, target, log);

        // hideAll(어노테이션 없음)은 프록시를 거쳐 target에 도착한 뒤, target 안에서 this.hidePost를 부른다.
        // this는 프록시가 아니라 target 자신이다
        proxy.hideAll(List.of(1L, 2L));

        assertThat(target.calls()).containsExactly("hideAll:[1, 2]", "hidePost:1", "hidePost:2");
        assertThat(log.methodNames()).isEmpty();

        // 같은 hidePost라도 밖에서 프록시로 부르면 기록된다
        proxy.hidePost(3L);
        assertThat(log.methodNames()).containsExactly("hidePost");
    }

    @Test
    void 리텐션이_CLASS인_어노테이션은_실행_중에_보이지_않아_기록되지_않는다() throws Exception {
        Method resolveReport = FakeAdminActions.class.getMethod("resolveReport", Long.class);
        // 소스에는 @ClassRetainedTimed가 있지만 리플렉션으로는 없다
        assertThat(resolveReport.getAnnotations()).isEmpty();

        AdminActions proxy = TimedProxy.wrap(AdminActions.class, target, log);
        proxy.resolveReport(1L);

        assertThat(target.calls()).containsExactly("resolveReport:1");
        assertThat(log.methodNames()).isEmpty();
    }

    @Test
    void 프록시가_받는_Method는_인터페이스_메서드라_구현_클래스의_어노테이션은_따로_찾아야_한다() throws Exception {
        Method hidePost = AdminActions.class.getMethod("hidePost", Long.class);
        Method countReports = AdminActions.class.getMethod("countReports");
        Method bulkIssueCoupon = AdminActions.class.getMethod("bulkIssueCoupon", Long.class, List.class);

        // InvocationHandler.invoke가 받는 것은 이 인터페이스 Method다. @Timed는 구현 클래스 쪽에 붙어 있다
        assertThat(hidePost.isAnnotationPresent(Timed.class)).isFalse();

        assertThat(TimedProxy.isTimed(hidePost, FakeAdminActions.class)).isTrue();
        assertThat(TimedProxy.isTimed(bulkIssueCoupon, FakeAdminActions.class)).isTrue();
        assertThat(TimedProxy.isTimed(countReports, FakeAdminActions.class)).isFalse();
    }
}
