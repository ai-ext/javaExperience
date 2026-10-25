# P09 두 질문·9상태 구현 사양

메인 설계/원문489줄 전문 재독/추가Java21 proof13값 확인. 기존24 minor9 구현과 검토 관문이 끝난 뒤 제품 코드에 적용한다. 원문·기존proof/frozen/84상태의역사JSON·questions27개·기존이미지기록 보존.

## 범위

P09_LESSONS에 shared-state(3상태), varargs-selection(6상태)를 추가하고 기존 PC 선택기/포커스/확대/원문 경로를 재사용한다. 다른 페이지에 새 UI를 퍼뜨리지 않는다. 별도 프레임워크/컴포넌트/공통controller 리팩터링 없음. 기존 reference 기본 질문 유지.

### shared-state

질문: 객체 두 개를 만들면 static 상태도 두 개가 될까요?
출처: §2.3 원문38~55줄 + 추가 P09BoundariesProof.RequestState/main.
공통 note: 새 Java21 순수 추가 예시의 순차 관측입니다. a/b는 설명용 변수이며 메모리 주소가 아닙니다. HTTP·Spring·DB·동시 요청은 실행하지 않았습니다. 그림 화살표는 클래스 필드 접근을 나타내며 객체 내부에 저장된 참조 필드가 아닙니다. 요청별 상태를 shared static에 두지 않습니다.

- shared-before: title 두 객체의 인스턴스 필드는 각각0; code `RequestState a = new RequestState(), b = new RequestState();`; active[0]; values a.quantity=0,b.quantity=0,RequestState.latestName=null; proof initial0/0/null. lead: quantity는 객체별이며 static latestName은 클래스에 하나; null은 문자열이 아님.
- shared-after-a: title a만 바꾸면 b.quantity는0; code `a.record("Ada", 2);`; active[0]; values a.quantity=2,b.quantity=0,RequestState.latestName=Ada; proof afterA2/0/Ada. lead: record는 this.quantity와 공유 latestName을 바꿈. b.quantity는 별도 객체의 값이라 그대로.
- shared-after-b: title b 호출 뒤 공유 이름은Grace; code `b.record("Grace", 5);`; active[0]; values a.quantity=2,b.quantity=5,RequestState.latestName=Grace; proof afterB2/5/Grace. lead: a의 quantity2는 보존되지만 이전 Ada는 같은 공유 클래스 필드에서 Grace로 덮임. 순차호출만으로도 공유 상태를 구별하며 동시성 버그 재현이라고 하지 않음.

Asset P09-shared-dark-20261024.jpg(메인최종확정뒤등록),1672x941. focus 첫/중간/오른쪽3시점 각 `[1,17,33,52]`, `[34,17,32,52]`, `[67,17,32,52]`. 좌표는 실제 최종이미지대조후필요시조정.

### varargs-selection

질문: 가변 인자의 합계와 오버로드 선택은 어떻게 확인할까요?
출처: §2.8 원문113~123줄·Q7 475~479줄 + 추가 P09BoundariesProof.sum/choose/main.
공통 note: sum(int...values)는 원문 누적식과 같은 추가 실행이고 choose2개는 선택 확인용 추가 예제입니다. 배열을 전달하면 int[] 매개변수에 직접 맞출 수 있습니다. 이 두 선언의 결과를 다른 모든 overload집합에 일반화하지 않습니다. HTTP·Spring·DB·성능 미실행.

- sum-empty: 빈 배열 합계0; code `out("sumEmpty", sum());`; active[0]; values 입력[],배열길이0,합계0; proof sumEmpty0. lead: total0에서 반복0회 후0반환.
- sum-items: 개별 인자2·3 합계5; code `out("sumItems", sum(2, 3));`; active[0]; values 입력[2,3],배열길이2,합계5; proof sumItems5. lead: 전달인자2개를 배열원소로 받아 누적, 결과5.
- sum-array: 배열4·6 합계10; code `out("sumArray", sum(new int[]{4, 6}));`; active[0]; values 입력[4,6],배열길이2,합계10; proof sumArray10. lead: 이미 만든 int[]를 그대로 인자로전달할수있음.
- choose-fixed: 인자2개는fixed(int,int); code `out("chooseTwo", choose(2, 3));`; active[0]; values 호출choose(2,3),선택fixed(int,int); proof chooseTwo. lead: 이 두 선언에서는2int의고정개수메서드가선택됨. 반환문자열은합계아님.
- choose-array: int[]는varargs(int[]); code `out("chooseArray", choose(new int[]{2, 3}));`; active[0]; values 호출choose(new int[]{2,3}),선택varargs(int[]); proof chooseArray. lead: array가 int[] 매개변수에직접맞음, 고정개수choose(int,int)에array하나를넘길수없음.
- choose-empty: 빈인자도varargs(int[]); code `out("chooseEmpty", choose());`; active[0]; values 호출choose(),선택varargs(int[]); proof chooseEmpty. lead: 매개변수int[]에빈배열로맞춰호출. 메서드선택은컴파일시의 overload해결이며 runtime동적dispatch시뮬레이션아님.

코드 out은 추가 관찰 출력 helper이며 숫자 계산/메서드선택본체를 숨기지 않도록 해당 질문 코드에 sum/choose 선언을 함께 짧게 노출하는 별도접기또는각stage.code의주변코드를 제공한다. 코드복사는실제표시한코드전체와일치하며 각발췌는 proof.source의정확한범위를근거로한다. 긴 raw13출력·전체Java는 이름명확한접기영역에서열람가능(기존P09보조source rendering연결또는새자료링크를재사용,핵심값은접기밖).

## 검증

- 기존27질문/84상태 역사검사는 원본자료의 대상ID에만 적용한다. 새로운9상태를 과거 browser-all-states.json에 가짜 추가하거나 새상태를모두통과한것처럼 skip하지 않는다. 초기84상태ID집합+새9ID집합을명확히대조하고새test-p09-boundaries.mjs에서9상태전체JSDOM/코드/값/원문/복사/history·활성인덱스검사와sourceSHA/actual13을대조한다. inventory는main재생성.
- 새proof는 Java21 환경·sourceSHA와raw/stdout/execution을보존; 독립Sol이새임시dir에서컴파일실행하고13관측값전문대조. 표기·UI의구현검사는Java재실행과구분.
- 새이미지는image-records.json의SHA/nativeJPG92·정확선택경로를검사,기존45이미지기록을고치지않는다.
- main npm24하네스+build/audit3+실제PC다크9상태관측·복사·확대/scroll·원문·source보존. fresh Sol spec→quality 승인 이후 이 두개공백의부분보강으로만기록한다. P09전체/전체24/전체134완료는금지.

## 최신 PC다크 지시로 확정한 이미지

- shared-state: docs/design/p09-2026-10-20/images/P09-shared-dark-20261024.jpg (528762bytes)
- varargs-selection: docs/design/p09-2026-10-20/images/P09-varargs-dark-20261024.jpg (515743bytes)
- 둘 다실제imagegenprecisepaletteedit/native1672×941/JPG92이며숫자·코드·의미불변. image-records.json에SHA/원본경로를기록. 이전white시안은미등록history/draft이고제품선정아님.
- 새모바일분기/라이트시안/모바일검증은작성하지않는다. PC다크1366이상폭에서9상태를검증한다. 기존84상태의예전모바일자료는역사증거이며새관문으로요구하지않는다.
- sum의배열원소표시는호출인자/source기반설명이고반환값은추가Java실행관측이다. 런타임배열내부디버거캡처라고하지않는다.

## 코드 패널의 가시성 확정

- shared-state 세 시점은 RequestState의필드2개와record대입본문을각stage.code에짧게노출한다(실제proof소스block발췌). 그다음a/b생성과현재시점까지의호출만이어붙인다. before에는a/b생성까지,after-a는A호출까지,after-b는A/B호출까지다. 미래B호출을before/after-a에서이미실행한코드처럼강조하지않는다. 강조는현재호출/대입줄로한다.
- sum세상태에는실제sum메서드전체5줄과해당out관찰호출1줄을기본노출한다. choose세상태에는두overload선언과해당out관찰호출을기본노출한다. 핵심판단/누적식을긴원문접기안에만숨기지않는다.
- out(key,value)는관찰값을한줄출력하는추가helper라고짧게설명한다. 그림/values의배열원소는호출코드기반설명,반환/선택마커는추가실행관측으로구분한다. 선택마커fixed/varargs가계산합계가아님을명확히한다.
- 각코드가source의비연속부분을발췌·들여쓰기정돈했다면sourceFragments를명시하고실제source에서순서대로정합·표시code와토큰/공백정규화동일성을검사한다. 문자열리터럴의값을바꾸는정규화는금지한다. rawJava/check/log를고쳐검사를맞추지않는다.
- 각발췌는독립적으로컴파일되는전체파일이라고하지않는다. 추가Java전체소스와실행raw13관측은별도이름분명한details에서열람/수동복사가가능해야한다. 원문#p09-original밖에추가해기존sourceRoot해시를보존한다.
- 독립검수는 independent-proof-review.json/.md에서소스SHA527af7d57af199b72a6c83cd61a4de1771a98e32c7b6e1eafb39410ce2bfe95b, native13/stdout/javap/선택JPG2 quality92재인코딩동일을확인했다. UI추가구현spec/quality및실PC검증은여전히별도다.

## 추가되는 상태의 복사 피드백 경계

기존P09copy handler는복사완료중장면을바꾸면이전코드의성공/실패를새장면에표시할수있다. 새9상태연결시이controller범위에만W11과같은render세대+copy요청IDguard를적용한다. 복사요청문자열은시작시캡처,서로다른장면/A→B→A/연속요청역순resolve·reject에서낡은status/selection갱신을무시한다. 정상현재fragment exact copy와수동선택fallback은유지한다. 다른24controller를일괄리팩터링하지않는다. Node회귀는nativeOS clipboard자체의순서보장을입증하는것이아니며실PC정상복사는별도payload로대조한다.
