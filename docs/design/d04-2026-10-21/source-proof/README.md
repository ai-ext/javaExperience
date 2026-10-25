# D04 추가 빌드 관찰

원문의 Kotlin Java25 설정과9개fence는original/에byte보존했다. 기존설치Java21.0.6으로실험하므로추가build.gradle.kts는원문한줄JavaLanguageVersion25→21변형과import·명시BootBOM/리소스/JUnit/계측태스크를더한별도구성이다. 원문Java25전체설정실행으로표시하지않는다. Java원문은D04에없으며추가Java3파일/리소스1파일·settings/build총6파일은명시fixture다.

새0700run아래projectcopy만사용한다. Wrapper9.8.0/Bootplugin4.1.1/offline/no-daemon으로프로젝트별.task-cache를사용하며기존글로벌의존성캐시는읽고일반실행범위에서만갱신가능하다. 기존캐시삭제·사용자서비스중지·실제CI/컨테이너/registrypush는하지않는다. BootJAR실행은추가non-web앱의resource/policy출력후자체context를닫는다.

초기tasks--all/recordProof오프라인이통과해29runtime/testartifact(플러그인해결파일전체가아님)/Boot4.1.1/Jupiter·launcher6.0.3와build→assemble/check직접의존을확인했다. 첫fullfreeze는체크섬메타데이터생성시pluginclasspath의io.spring.gradle:dependency-management-plugin:1.1.7이오프라인캐시에없어20CHECK뒤실패했다. 같은고정버전/선언저장소에서일반online메타데이터확보후새폴더전체offlinefreeze가21CHECK3모델로통과했다. 별도새폴더mainfresh와독립temp도전체frozen이같았다. 실패와같은원인의Gradle중복2메시지는attempt-notes.json/attempt-01-*에남겼다.

dryrun의산출물없음/classmajor65·별도resourcescopy/JUnit2성공및2중1실패/compileJava·compileTestJava실패/BootJAR·plain구조/별도nonwebJARresource출력후exit0/UPTODATE·privateFROMCACHE·NOSOURCE·SKIPPED/기존JAR와현재테스트실패/lock버전선택·private예상체크섬불일치거부를관찰했다. 자체두cleanbuild의실물JAR9103378bytes/SHA19be540e7682740e6d04d338fde021222c0c6e3a83dbaeb0935c3a85d928d16e가같았다. 첫비교baseline은emptyprivatecache에서--build-cache,다른workspace의twin은--no-build-cache였고양쪽cacheoff라고표시하지않는다. 같은fixture/JDK/Gradle/dependency조건의관측이지일반재현성보장이나속도측정이아니다.

재현: 추가관찰기run-proof.py를--runtime-root /Users/ds/research/javaexperience-d04-20261021/_data/runtime로실행한다. 기존frozen을다시작성하지않는일반실행이전체대조를수행한다. 실제UI/JPG/브라우저·Docker/CI/registry·원문Java25설정전체는별도미실행범위다. 원문Markdown/학습자서버소스는수정하지않았다.
