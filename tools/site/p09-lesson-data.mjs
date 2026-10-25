// P09 원문 기반 상태 명세. 그림은 설명용이며 서버 디버거·실행 결과를 흉내 내지 않는다.
const state = (id, title, image, lead, code, active, values, options = {}) => ({ id, title, image, lead, code, active, values, ...options });
const referenceCode = `Profile p = new Profile("Ada");
changeObject(p);
System.out.println("after field mutation=" + p.nickname);
replaceLocalReference(p);
System.out.println("after parameter reassignment=" + p.nickname);

private static void changeObject(Profile p) { p.nickname = "Grace"; }
private static void replaceLocalReference(Profile p) { p = new Profile("Local only"); }`;
const referenceState = (id, title, image, lead, active, reference) => ({
  ...state(id,title,image,lead,referenceCode,active,[
    ['호출자 p', 'A'],
    ['매개변수 p', reference.parameter || (reference.status === 'before' ? '아직 없음' : '호출 종료')],
    ['객체 A · nickname', reference.objectA],
    ...(reference.objectB ? [['객체 B · nickname', reference.objectB + (reference.unreachableB ? ' · 남은 접근 가능 참조 없음' : '')]] : []),
  ]),
  reference,
});

export const P09_LESSONS = [
  {
    id: 'file', question: '파일·패키지·import는 어떻게 연결될까요?', source: '§2.1 · 원문 13~23줄',
    note: '파일 기반 javac 예제입니다. 소스 루트 아래 경로와 패키지를 맞추고 공개 최상위 클래스명과 파일 basename을 맞춥니다.',
    stages: [
      state('package', '패키지와 위치', 'P09-01', 'package는 이 타입의 패키지를 선언합니다. src/main/java 아래 com/example/billing 경로에 둡니다.', 'package com.example.billing;\nimport java.math.BigDecimal;\npublic class Invoice { private BigDecimal total; }', [0], [['소스 경로','src/main/java/com/example/billing/Invoice.java'], ['패키지','com.example.billing'], ['타입의 전체 이름','com.example.billing.Invoice']]),
      state('import', '짧은 타입 이름', 'P09-01', 'import 뒤에는 java.math.BigDecimal이 있습니다. 필드 선언에서는 짧은 이름 BigDecimal을 사용합니다.', 'package com.example.billing;\nimport java.math.BigDecimal;\npublic class Invoice { private BigDecimal total; }', [1,2], [['import','java.math.BigDecimal'], ['필드 타입','BigDecimal'], ['필드 이름','total']]),
      state('filename', '공개 클래스와 파일명', 'P09-01', '공개 최상위 타입이 Invoice이므로 파일 basename은 Invoice.java입니다. 다른 이름은 컴파일 실패 예제로 확인했습니다.', 'public class Invoice { private BigDecimal total; }', [0], [['public 클래스','Invoice'], ['파일명','Invoice.java'], ['다른 파일명','javac 컴파일 오류']]),
    ],
  },
  {
    id:'constructor', question:'new와 생성자·this는 무엇을 바꿀까요?', source:'§2.2·§2.5 · 원문 25~36·67~74줄',
    note:'Invoice.number의 고정 입력값은 원문에 없습니다. 입력값을 만들어 원문의 실행 결과처럼 표시하지 않습니다.',
    stages:[
      state('constructor-declaration','생성자 선언','P09-02','생성자는 클래스와 이름이 같고 반환 타입이 없습니다. 직접 생성자를 선언하면 기본 no-arg 생성자는 자동 제공되지 않습니다.','public class Invoice {\n    private final String number;\n    public Invoice(String number) { this.number = number; }\n}',[2],[['클래스','Invoice'],['생성자','Invoice(String number)'],['반환 타입','선언하지 않음']]),
      state('constructor-parameter','호출 입력과 매개변수','P09-02','new로 만들 객체를 초기화하는 동안, number는 이번 생성자 호출의 입력값입니다. this는 초기화 중인 그 객체입니다.','public Invoice(String number) {\n    this.number = number;\n}',[0],[['입력','String number'],['this','초기화 중인 Invoice 객체'],['입력값','원문에 고정값 없음']]),
      state('constructor-assignment','객체 필드에 대입','P09-02','왼쪽 this.number는 객체의 필드이고 오른쪽 number는 매개변수입니다. 동명이어도 소유자와 수명이 다릅니다.','public Invoice(String number) {\n    this.number = number;\n}',[1],[['왼쪽 this.number','객체의 final 필드'],['오른쪽 number','호출의 매개변수'],['결과','입력 참조값을 필드에 대입']]),
    ],
  },
  {
    id:'variables', question:'필드와 지역 변수는 언제 생기고 사라질까요?', source:'§2.3·Q1 · 원문 38~55·445~449줄',
    note:'retryCount·issuedCount는 원문 선언을 사용합니다. 이 설명에서 객체 수를 늘리는 실험은 추가 예시로 구분합니다.',
    stages:[
      state('fields','필드의 기본값','P09-03','인스턴스 필드는 객체마다, static 필드는 클래스에 공유됩니다. 그림 왼쪽과 가운데의 int 필드는 초기값을 쓰지 않아도 0입니다.','private int retryCount;\nprivate static int issuedCount;\npublic void send() { int attempt = retryCount + 1; }',[0,1],[['객체의 retryCount','0'],['클래스의 issuedCount','0'],['지역 변수 attempt','호출마다 별도 · 그림 오른쪽은 send 실행 사례']]),
      state('local','호출 중의 지역 값','P09-03','send 호출에서 retryCount의 0을 읽고 1을 더해 지역 변수 attempt에 1을 대입합니다. retryCount 자체를 증가시키는 코드는 없습니다.','public void send() {\n    int attempt = retryCount + 1;\n}',[1],[['retryCount','0'],['issuedCount','0'],['호출 중 attempt','1']]),
      state('scope-end','호출이 끝난 뒤','P09-03','attempt는 메서드 블록의 지역 이름입니다. 호출이 끝난 뒤 다음 호출과 상태를 공유하는 필드가 되지 않습니다. 지역 변수는 읽기 전에 직접 대입해야 합니다.','public void send() {\n    int attempt = retryCount + 1;\n}',[2],[['retryCount','0'],['issuedCount','0'],['attempt','호출·블록 범위 종료'],['참조·boolean 필드 기본값','null · false']]),
      state('array-defaults','새 배열 원소의 기본값','P09-array-defaults','배열 참조 변수는 new 표현식으로 대입했지만 각 원소는 직접 대입하지 않아도 타입별 기본값을 갖습니다. 지역 변수 자체의 미초기화와 구별합니다.','int[] ints = new int[2];\nboolean[] flags = new boolean[2];\nString[] strings = new String[2];',[0,1,2],[['int 원소','0, 0'],['boolean 원소','false, false'],['String 원소','null, null'],['배열 참조 지역 변수','new 표현식으로 명시 대입']],{note:'배열 길이2는 원문 기본값 규칙을 실행으로 확인하는 추가 예시입니다. null은 문자열 "null"이 아닙니다.'}),
    ],
  },
  {
    id:'signature', question:'메서드 선언에서 입력과 반환을 어떻게 읽을까요?', source:'§2.4·§2.5 · 원문 57~74줄',
    note:'total과 rate의 고정 숫자는 원문에 없습니다. 이 예제는 선언 구조를 읽는 데 사용합니다.',
    stages:[
      state('signature-parts','이름·입력·결과','P09-04','public은 접근, BigDecimal은 반환 타입, totalWithTax는 메서드 이름입니다. BigDecimal rate가 입력 매개변수입니다.','public BigDecimal totalWithTax(BigDecimal rate) throws ArithmeticException {\n    return total.multiply(BigDecimal.ONE.add(rate));\n}',[0],[['접근','public'],['반환 타입','BigDecimal'],['메서드명','totalWithTax'],['매개변수','BigDecimal rate'],['선언 예외','ArithmeticException']]),
      state('return','반환값과 정상 종료','P09-04','return 식의 값이 호출식의 결과가 됩니다. 비void 메서드는 정상 종료하는 모든 경로에서 선언 타입에 맞는 값을 반환해야 합니다.','public BigDecimal totalWithTax(BigDecimal rate) throws ArithmeticException {\n    return total.multiply(BigDecimal.ONE.add(rate));\n}',[1],[['입력 식','BigDecimal.ONE.add(rate)'],['필드 total의 동작','multiply(...)'],['호출식 결과 타입','BigDecimal']]),
      state('void-early','void의 이른 종료','P09-void-return','paid가 true면 return;으로 즉시 끝납니다. false면 필드 paid를 true로 바꾼 뒤 끝납니다. 반환값은 없습니다.','public void markPaid() {\n    if (paid) return;\n    paid = true;\n}',[1,2],[['paid=true 경로','즉시 종료'],['paid=false 경로','paid를 true로 대입'],['반환값','없음 · void']]),
      state('overdue-return','boolean 값을 반환','P09-void-return','due.isBefore(LocalDate.now())의 boolean 결과를 반환합니다. 원문에는 고정 날짜나 true/false 결과가 주어지지 않았습니다.','public boolean overdue(LocalDate due) {\n    return due.isBefore(LocalDate.now());\n}',[1],[['입력','LocalDate due'],['반환 식','due.isBefore(LocalDate.now())'],['반환 타입','boolean'],['고정 결과','원문에 없음']]),
      state('instance-call','인스턴스 호출의 대상','P09-04A','invoice.total()은 변수 invoice가 가리키는 객체를 대상으로 하는 인스턴스 호출 문법입니다. 원문은 이 메서드의 구현과 반환값을 제시하지 않았습니다.','invoice.total()',[0],[['수신자','invoice가 가리키는 객체'],['호출 메서드','total'],['반환값','원문 구현 없음 · 값 미지정']]),
      state('class-qualified-call','클래스로 static 호출','P09-04A','Invoice.parse(...)는 클래스 이름을 한정자로 사용하는 static 호출 문법 설명입니다. 생략된 인자와 메서드 구현을 실제 코드로 실행한 예제가 아닙니다.','Invoice.parse(...)',[0],[['한정자','Invoice 클래스'],['소속','static 메서드'],['this','static 문맥에 없음']]),
      state('implicit-this','현재 객체의 내부 호출','P09-04A','인스턴스 메서드 안의 recalculate()는 this.recalculate()와 같은 현재 객체를 대상으로 합니다.','recalculate();\nthis.recalculate();',[0,1],[['호출 대상','같은 현재 객체'],['this','인스턴스의 현재 객체'],['다른 객체 생성','이 호출 문법 자체는 new가 아님']]),
    ],
  },
  {
    id:'greeting', question:'Ada가 필드와 반환값으로 어떻게 이어질까요?', source:'§3 단계2~4 · 원문 268~345줄',
    note:'Spring HTTP는 미실행입니다. 원문 Boot 4.1.1·Java25 예제의 예상 흐름이며 DB 저장은 없습니다. 홈의 다른 Greeting 예제와 혼합하지 않습니다.',
    stages:[
      state('greet-entry','메서드 입력','P09-05','GET /greetings/Ada에서 경로의 Ada가 greet의 name 인자로 준비되는 예상 장면입니다.','public Greeting greet(@PathVariable("name") String name) {\n    String normalizedName = name.trim();\n    return new Greeting("Hello, " + normalizedName);\n}',[0],[['요청','GET /greetings/Ada'],['매개변수 name','Ada'],['객체 Greeting','아직 만들기 전']]),
      state('normalized','호출 지역 변수','P09-05','trim()으로 얻은 문자열을 지역 변수 normalizedName에 둡니다. 이 입력 Ada에는 제거할 공백이 없어 값은 그대로입니다.','String normalizedName = name.trim();\nreturn new Greeting("Hello, " + normalizedName);',[0],[['name','Ada'],['normalizedName','Ada'],['연결한 문자열','Hello, Ada']]),
      state('greeting-constructor','새 객체와 this.message','P09-05','new Greeting의 생성자에 Hello, Ada를 전달합니다. this.message는 새 객체의 필드, message는 그 생성자 호출의 매개변수입니다.','return new Greeting("Hello, " + normalizedName);\n\npublic Greeting(String message) {\n    this.message = message;\n}',[0,3],[['생성자 매개변수 message','Hello, Ada'],['새 Greeting.message','Hello, Ada'],['필드 선언','private final String message']]),
      state('greeting-return','참조 반환과 getter','P09-05','greet는 새 Greeting의 참조값을 반환합니다. getMessage()는 그 객체의 message 값을 돌려줍니다.','public String getMessage() {\n    return message;\n}',[1],[['greet 반환 타입','Greeting'],['getMessage 반환 타입','String'],['getMessage 결과','Hello, Ada']]),
      state('greeting-json','예상 JSON','P09-05','원문이 제시한 예상 응답입니다. 이 화면이 서버를 실행해 받은 결과가 아닙니다.','{"message":"Hello, Ada"}',[0],[['응답 본문 예상','{"message":"Hello, Ada"}'],['확인 상태','HTTP 미실행'],['DB 저장','이 예제에 없음']]),
    ],
  },
  {
    id:'references', question:'필드 변경과 매개변수 재할당은 왜 결과가 다를까요?', source:'§2.9·§3 PassByValueDemo·Q2 · 원문 125~127·347~376·451~455줄',
    note:'A/B는 객체를 구별하는 설명용 기호이며 메모리 주소가 아닙니다. 원문 실행 순서대로 Ada → Grace → 재할당을 추적합니다.',
    stages:[
      referenceState('mutation-before','필드 변경 호출 전','P09-06','new Profile("Ada")로 객체 A를 만들었습니다. 호출자 p가 A를 가리키며 아직 changeObject의 매개변수는 없습니다.',[0],{method:'changeObject',status:'before',parameter:null,objectA:'Ada'}),
      referenceState('mutation-copy','참조값 복사','P09-reference-copy','호출자 p의 참조값 A를 매개변수 p에 복사합니다. 변수는 둘이지만 가리키는 Profile 객체는 하나입니다.',[1],{method:'changeObject',status:'active',parameter:'A',objectA:'Ada',copy:true}),
      referenceState('mutation-write','같은 객체의 필드 변경','P09-07','매개변수 p를 따라 같은 A의 nickname을 Grace로 바꿉니다. 호출자 p 역시 같은 객체를 가리키므로 변경이 보입니다.',[6],{method:'changeObject',status:'active',parameter:'A',objectA:'Grace',previousA:'Ada'}),
      referenceState('mutation-return','필드 변경 복귀 후','P09-08','changeObject 호출이 끝나도 객체 A의 nickname은 Grace입니다. 종료된 것은 매개변수의 호출 범위입니다.',[2],{method:'changeObject',status:'returned',parameter:null,objectA:'Grace'}),
      referenceState('reassignment-before','다음 호출 전 · Grace 유지','P09-reassignment-before','원문은 바로 replaceLocalReference(p)를 호출합니다. 앞서 바꾼 객체 A의 Grace에서 시작하며 Ada로 되돌아가지 않습니다.',[3],{method:'replaceLocalReference',status:'before',parameter:null,objectA:'Grace'}),
      referenceState('reassignment-local','매개변수만 새 객체로','P09-09','new로 B를 만들고 매개변수 p에만 참조 B를 대입합니다. 호출자의 p는 여전히 A를 가리키고 A.nickname은 Grace입니다.',[7],{method:'replaceLocalReference',status:'active',parameter:'B',objectA:'Grace',objectB:'Local only'}),
      referenceState('reassignment-return','재할당 복귀 후','P09-10','호출자 p는 계속 A의 Grace를 읽습니다. 이 예제에는 B에 접근 가능한 참조가 남지 않습니다. 실제 GC 수거 시점은 정하지 않습니다.',[4],{method:'replaceLocalReference',status:'returned',parameter:null,objectA:'Grace',objectB:'Local only',unreachableB:true}),
    ],
  },
  {
    id:'primitive', question:'매개변수 n을 99로 바꾸면 호출자의 1도 바뀔까요?', source:'§3 PassByValueDemo · 원문 347~376줄',
    note:'기본형은 숫자값 자체를 복사합니다. Profile 참조를 복사하는 예제와 같은 값 전달 규칙입니다.',
    stages:[
      state('primitive-before','호출 전','P09-11','main의 지역 변수 n에 1을 대입했습니다. changePrimitive가 이 변수를 직접 공유하지 않습니다.','int n = 1;\nchangePrimitive(n);\n\nprivate static void changePrimitive(int n) { n = 99; }',[0],[['호출자 n','1'],['매개변수 n','아직 호출 전']]),
      state('primitive-assignment','매개변수에 99 대입','P09-11','복사된 1을 받은 매개변수 n에만 99를 대입합니다. 호출자 n에는 대입하지 않았습니다.','int n = 1;\nchangePrimitive(n);\n\nprivate static void changePrimitive(int n) { n = 99; }',[3],[['호출자 n','1'],['매개변수 n','99']]),
      state('primitive-return','복귀 후','P09-11','매개변수의 호출 범위는 끝나고 main의 n은 1입니다. 원문 실행 출력과 일치합니다.','System.out.println("after primitive parameter assignment=" + n);',[0],[['호출자 n','1'],['매개변수 n','호출 종료'],['원문 실행 출력','after primitive parameter assignment=1']]),
    ],
  },
  {
    id:'methods', question:'객체 필드·static·오버로드·내부 호출을 함께 읽어볼까요?', source:'§3 MethodsDemo · 원문 378~411줄',
    note:'Hello, Hi! Hello, Hi! 뒤에는 공백이 하나 있습니다. Profile·Greeting 예제의 데이터와 섞지 않습니다.',
    stages:[
      state('methods-create','객체와 클래스 상태','P09-12','새 MethodsDemo의 prefix에 Hello, 공백 포함 문자열을 대입하고, 공유 static created를 0에서 1로 증가시킵니다.','private final String prefix;\nprivate static int created;\npublic MethodsDemo(String prefix) {\n    this.prefix = prefix;\n    created++;\n}',[3,4],[['객체의 prefix','"Hello, "'],['클래스의 created','1'],['생성 횟수','원문은 객체 한 번 생성']]),
      state('format-one','String 인자 하나','P09-format-one','format("Ada")는 format(String)을 선택합니다. 같은 대상 객체의 prefix와 name을 연결해 반환합니다.','demo.format("Ada");\npublic String format(String name) { return prefix + name; }',[0,1],[['this.prefix','"Hello, "'],['name','"Ada"'],['반환값','"Hello, Ada"']]),
      state('format-inner','두 인자와 내부 호출','P09-12-overload','format("Hi! ", 2)는 (String,int)를 선택합니다. 본문 format(name)은 같은 this의 (String)을 호출합니다.','public String format(String name, int count) {\n    return format(name).repeat(count);\n}',[1],[['name','"Hi! "'],['count','2'],['내부 format(name) 결과','"Hello, Hi! "']],{activeToken:'format(name)'}),
      state('format-repeat','repeat 뒤 반환','P09-12-overload','내부 호출의 결과 문자열을 두 번 반복해 바깥 호출의 결과로 반환합니다. 반환 타입만 바꾸거나 매개변수 이름만 바꾸면 오버로드가 아닙니다.','public String format(String name, int count) {\n    return format(name).repeat(count);\n}',[1],[['반복 입력','"Hello, Hi! "'],['반복 수','2'],['반환값','"Hello, Hi! Hello, Hi! "']],{activeToken:'.repeat(count)'}),
      state('static-call','클래스로 static 호출','P09-12','createdCount()는 특정 객체의 this 없이 클래스에 공유된 created를 읽어 1을 반환합니다.','public static int createdCount() { return created; }\nSystem.out.println("created=" + MethodsDemo.createdCount());',[0,1],[['호출 대상 표기','MethodsDemo.createdCount()'],['읽는 값','static created = 1'],['원문 출력','created=1'],['this','static 문맥에 없음']]),
    ],
  },
  {
    id:'varargs', question:'여러 인자가 메서드 안에서는 어떻게 보일까요?', source:'§2.8·MethodsDemo·Q7 · 원문 115~123·383~410·475~479줄',
    note:'one/two는 원문 값입니다. 배열 전달과 빈 입력은 원문 설명을 확인하는 추가 호출이며 별도로 표시합니다.',
    stages:[
      state('varargs-values','one·two 전달','P09-varargs','printAll("one", "two")의 messages는 메서드 안에서 길이 2인 String 배열처럼 반복됩니다.','demo.printAll("one", "two");\npublic void printAll(String... messages) {\n    for (String message : messages) System.out.println(message);\n}',[0,2],[['messages[0]','one'],['messages[1]','two'],['출력 순서','one → two']]),
      state('varargs-array','배열 하나 전달','P09-varargs','추가 확인 호출입니다. 같은 타입 배열 하나를 전달해도 메서드 본문에서는 인덱스와 반복으로 읽을 수 있습니다.','demo.printAll(new String[] { "one", "two" });',[0],[['입력 종류','설명용 추가 배열 호출'],['배열 길이','2'],['출력 순서','one → two']]),
      state('varargs-empty','입력 0개','P09-varargs','추가 확인 호출입니다. 인자가 없으면 길이 0 배열을 받아 반복 본문이 실행되지 않습니다. 가변 매개변수는 마지막 하나만 가능합니다.','demo.printAll();',[0],[['입력 종류','설명용 추가 빈 호출'],['배열 길이','0'],['출력','없음']]),
    ],
  },
  {
    id:'arithmetic', question:'연산식의 중간값과 결과를 읽어볼까요?', source:'§2 연산 보강·OperatorsDemo · 원문 137~212줄',
    note:'원문 실행값 quantity=3, unitPrice=1200을 유지합니다. int와 double의 경계는 별도 추가 실행으로 확인합니다.',
    stages:[
      state('subtotal','수량 × 단가','P09-14','3에 1200을 곱한 값 3600을 subtotal에 대입합니다.','int quantity = 3;\nint unitPrice = 1200;\nint subtotal = quantity * unitPrice;',[2],[['quantity','3'],['unitPrice','1200'],['subtotal','3600']]),
      state('discounted','나눗셈 다음 뺄셈','P09-14','subtotal / 10을 먼저 계산해 360을 얻고 3600에서 빼면 discounted는 3240입니다.','int discounted = subtotal - subtotal / 10;',[0],[['subtotal / 10','360'],['3600 - 360','3240'],['discounted','3240']]),
      state('precedence','곱셈 우선','P09-14','2 + 3 * 4는 2 + (3 * 4)로 묶입니다. 곱셈 결과 12에 2를 더합니다.','int precedence = 2 + 3 * 4;',[0],[['먼저 계산','3 * 4 = 12'],['다음 계산','2 + 12 = 14'],['precedence','14']]),
      state('left-to-right','같은 우선순위의 왼쪽 결합','P09-14','6 / 2 * 3은 (6 / 2) * 3입니다. 덧셈보다 먼저 계산해 10 + 9 = 19가 됩니다.','int leftToRight = 10 + 6 / 2 * 3;',[0],[['6 / 2','3'],['3 * 3','9'],['10 + 9','19']]),
      state('logical-grouping','논리식의 묶음 비교','P09-logical-precedence','a || b && c는 a || (b && c)입니다. 이 추가 값에서는 a가 true여서 오른쪽을 건너뛰고 true입니다. (a || b) && c로 묶으면 c를 읽어 false입니다.','boolean a = true, b = false, c = false;\nboolean result = a || b && c;\nboolean grouped = (a || b) && c;',[1,2],[['추가 입력 a / b / c','true / false / false'],['a || (b && c)','true · 오른쪽 미평가'],['(a || b) && c','false · c 평가']],{note:'a/b/c의 구체 값은 원문 기호식의 묶음 차이를 확인하는 별도 추가 예시입니다. 다른 OperatorsDemo 변수와 섞지 않습니다.'}),
    ],
  },
  {
    id:'shortcircuit', question:'조건식의 오른쪽은 언제 실행될까요?', source:'OperatorsDemo · 원문 185~212줄',
    note:'&& → || → boolean &는 원문 실행 순서입니다. calls는 앞 두 식에서 0을 유지하고 세 번째에서만 1로 바뀝니다.',
    stages:[
      state('and','false && 오른쪽 건너뛰기','P09-15-and','왼쪽 false만으로 전체 결과가 false입니다. ++calls를 평가하지 않아 calls는 0입니다.','int calls = 0;\nboolean skippedAnd = false && (++calls > 0);',[1],[['왼쪽','false'],['오른쪽 ++calls','건너뜀 · 미평가'],['calls','0'],['skippedAnd','false']]),
      state('or','true || 오른쪽 건너뛰기','P09-15-or','앞 식 뒤에도 calls는 0입니다. 왼쪽 true로 전체 결과가 true이므로 오른쪽을 건너뜁니다.','boolean skippedOr = true || (++calls > 0);',[0],[['왼쪽','true'],['오른쪽 ++calls','건너뜀 · 미평가'],['calls','0'],['skippedOr','true']]),
      state('boolean-and','boolean &는 양쪽 평가','P09-15','왼쪽 false여도 &는 오른쪽을 평가합니다. ++calls가 1을 만들고 오른쪽은 true이지만 false & true의 결과는 false입니다.','boolean evaluatedBitwise = false & (++calls > 0);',[0],[['왼쪽','false'],['오른쪽 ++calls','평가됨 · 0 → 1'],['calls','1'],['evaluatedBitwise','false']]),
      state('zero-guard','분모 0 가드','P09-15A','divisor != 0이 false여서 24 / divisor를 실행하지 않습니다. 이 식은 0 나눗셈 예외 없이 false가 됩니다.','int divisor = 0;\nboolean safe = divisor != 0 && 24 / divisor > 3;',[1],[['divisor','0'],['divisor != 0','false'],['24 / divisor > 3','건너뜀 · 미평가'],['safe','false']]),
      state('eligible','두 비교 결과 연결','P09-eligible','원문 quantity=3과 discounted=3240이면 두 비교가 모두 true여서 eligible은 true입니다. Java 조건은 boolean이어야 합니다.','boolean eligible = quantity >= 3 && discounted >= 3000;',[0],[['quantity >= 3','true'],['discounted >= 3000','true'],['eligible','true'],['0 < age < 100','불가 · age > 0 && age < 100 사용']]),
    ],
  },
];

P09_LESSONS.push(
  {
    id:'encapsulation',question:'setter는 어떤 변경을 허용하고 어디서 거부할까요?',source:'§2.7·Q5 · 원문 89~102·469~473줄',
    note:'quantity 초기 3, 음수 -1, 정상 2는 원문 setter를 실행해 보는 추가 예시입니다. 원문이 출력한 고정값으로 표시하지 않습니다.',
    stages:[
      state('quantity-read','getter로 현재 값 읽기','P09-13','private 필드는 객체 바깥에서 직접 쓰지 않고 공개한 메서드로 읽습니다. 추가 예시의 현재 quantity는 3입니다.','private int quantity;\npublic int getQuantity() { return quantity; }',[1],[['설명용 현재 quantity','3'],['getQuantity() 결과','3'],['허용된 읽기 경로','getter']]),
      state('quantity-reject','음수 입력 거부','P09-13','-1은 검사에서 IllegalArgumentException을 던집니다. this.quantity 대입에 도달하지 않아 기존 3이 유지됩니다.','public void setQuantity(int quantity) {\n    if (quantity < 0) throw new IllegalArgumentException();\n    this.quantity = quantity;\n}',[1],[['설명용 입력 quantity','-1'],['검사 quantity < 0','true'],['객체 필드 quantity','3 유지'],['결과','IllegalArgumentException']]),
      state('quantity-accept','허용한 변경','P09-13','2는 음수가 아니므로 검사를 지나 객체 필드에 대입합니다. getter/setter가 있다는 사실보다 허용할 상태를 통제하는 규칙이 핵심입니다.','public void setQuantity(int quantity) {\n    if (quantity < 0) throw new IllegalArgumentException();\n    this.quantity = quantity;\n}',[2],[['설명용 입력 quantity','2'],['검사 quantity < 0','false'],['객체 필드 quantity','3 → 2'],['getter 결과','2']]),
    ],
  },
  {
    id:'access',question:'접근 제어와 스코프는 무엇이 다를까요?',source:'§2.6 · 원문 76~87줄',
    note:'접근은 멤버를 사용할 수 있는 경계, 스코프는 이름이 유효한 범위입니다. 아래 접근 관계는 원문 표를 비교하며 실행 결과가 아닙니다.',
    stages:[
      state('access-private','같은 최상위 타입 내부','P09-access','private 접근은 같은 최상위 타입 안의 중첩 클래스 관계도 포함합니다. 원문 outer가 nested Profile.nickname을 쓰는 코드도 실행됩니다. 허용할 외부 동작만 공개합니다.','private int quantity;\npublic int getQuantity() { return quantity; }',[0],[['같은 최상위 타입 내부·중첩 포함','접근 가능'],['같은 패키지의 다른 최상위 클래스','private 접근 불가'],['그 밖의 클래스','private 접근 불가']]),
      state('access-package','같은 패키지','P09-access','접근 제어자를 생략한 package-private는 같은 패키지의 호출자에게 열립니다. 하위 클래스라는 이유만으로 다른 패키지에 열리지는 않습니다.','int quantity;',[0],[['같은 클래스','접근 가능'],['같은 패키지','접근 가능'],['타 패키지 하위 클래스','package-private 접근 불가']]),
      state('access-protected','상속 문맥의 protected','P09-access','protected는 같은 패키지에서 접근할 수 있습니다. 이 인스턴스 필드를 다른 패키지에서 사용하려면 하위 클래스 문맥과 상속 관계에 맞는 수신 객체 제약도 충족해야 합니다.','protected int quantity;',[0],[['같은 패키지','접근 가능'],['타 패키지 하위 클래스','하위 클래스 문맥·수신 객체 제약 확인'],['타 패키지의 일반 호출자','접근 불가']]),
      state('access-public','공개와 최상위 타입','P09-access','원문 접근 표에서 public 멤버는 모든 호출자 열에 O입니다. 최상위 클래스에는 public 또는 생략만 쓸 수 있습니다.','public int getQuantity() { return quantity; }',[0],[['public 멤버','원문 표의 모든 호출자 열에서 접근 가능'],['최상위 클래스 선언','public 또는 생략'],['지역 변수 스코프','접근 제어자와 별개의 이름 유효 범위']]),
    ],
  },
  {
    id:'final',question:'final 참조가 가리키는 객체도 바뀔 수 없을까요?',source:'§2.7 · 원문 102줄',
    note:'Quantity q와 3 → 2는 원문 설명을 확인하는 추가 실행 예시입니다. final 참조와 객체의 불변성은 별개입니다.',
    stages:[
      state('final-reference','참조 재대입 금지','P09-final','final 변수 q에는 처음 대입한 객체 참조 대신 다른 참조를 다시 넣을 수 없습니다. 재대입 컴파일 실패를 확인했습니다.','final Quantity q = new Quantity();\nq = new Quantity(); // 컴파일 오류',[1],[['변수 q','처음 대입한 참조 유지'],['q 재대입','컴파일 실패'],['객체 필드 변경','별도 규칙']]),
      state('final-mutable','객체의 허용된 변경','P09-final','q를 재대입하지 않고 q가 가리키는 객체의 setter를 호출할 수 있습니다. 추가 실행에서 quantity가 3에서 2로 바뀌었습니다.','final Quantity q = new Quantity();\nq.setQuantity(3);\nq.setQuantity(2);',[2],[['q의 대상 객체','같은 객체'],['quantity','3 → 2'],['허용 여부','setter의 검증 규칙에 따름']]),
      state('final-members','메서드와 클래스의 final','P09-final','final 메서드는 재정의를, final 클래스는 상속을 막습니다. final 변수의 재대입 금지와 적용 대상이 다릅니다.','final class LockedType {}\nclass Base { final void run() {} }',[0,1],[['final 변수','재대입 금지'],['final 메서드','재정의 금지'],['final 클래스','상속 금지']]),
    ],
  },
  {
    id:'return-reference',question:'새 객체를 호출자가 받으려면 무엇을 대입해야 할까요?',source:'Q2 꼬리질문 · 원문 455줄',
    note:'normalize와 객체 A/B의 값은 꼬리질문을 확인하는 별도 추가 예시입니다. 원문 PassByValueDemo의 실행 출력과 혼합하지 않습니다.',
    stages:[
      state('return-reference-before','새 객체를 반환','P09-return-reference','추가 예시의 normalize는 B를 만들어 참조값을 반환합니다. 이 장면은 같은 줄에서 호출식이 끝났지만 왼쪽 profile에 아직 대입하기 전을 나눈 것입니다.','profile = normalize(profile);\nprivate static Profile normalize(Profile original) {\n    return new Profile("Local only");\n}',[2],[['호출자 profile','A · Grace'],['호출식의 반환 참조','B · Local only'],['profile에 대입','아직 대입 전']]),
      state('return-reference-assignment','호출자 변수에 대입','P09-return-reference','호출자가 반환 참조를 profile에 대입해야 그 변수가 새 객체 B를 가리킵니다. 원문은 profile = normalize(profile) 형태를 제시합니다.','profile = normalize(profile);',[0],[['대입 전 profile','A · Grace'],['메서드 반환 참조','B · Local only'],['대입 후 profile','B · Local only']]),
    ],
  },
  {
    id:'main',question:'main의 static과 args, Spring 시작 호출을 읽어볼까요?',source:'§2.10·§3 단계1~2 · 원문 129~135·221~286줄',
    note:'원문은 Boot 4.1.1·Java25의 별도 syntax-demo 프로젝트입니다. 현재 학습자 서버를 실행하거나 설정을 바꾸지 않습니다. Spring 시작과 HTTP는 미실행입니다.',
    stages:[
      state('main-entry','실행 시작 메서드','P09-main','원문의 main은 public static void입니다. static 호출은 특정 GreetingApplication 인스턴스의 this를 대상으로 하지 않습니다.','public static void main(String[] args) {\n    SpringApplication.run(GreetingApplication.class, args);\n}',[0],[['메서드 이름','main'],['소속','static · 클래스'],['반환 타입','void'],['this','없음']]),
      state('main-args','명령행 인자 전달','P09-main','args는 String 배열 매개변수입니다. 런처가 전달한 명령행 인자를 SpringApplication.run의 인자로 넘깁니다. 원문에 고정된 인자 목록은 없습니다.','SpringApplication.run(GreetingApplication.class, args);',[0],[['args 타입','String[]'],['입력 출처','명령행 인자'],['run에 전달','GreetingApplication.class · args'],['고정 args 값','원문에 없음']]),
      state('main-setup','실행 전 파일과 의존성','P09-main','별도 syntax-demo의 패키지와 클래스 경로를 맞추고 Gradle 또는 Maven 의존성을 준비합니다. 원문의 설정·명령은 아래 원문 전체에서 보존합니다.','package com.example.syntax;\n@SpringBootApplication\npublic class GreetingApplication { /* 원문 전체에 main */ }',[0,1],[['원문 프로젝트','syntax-demo'],['원문 설정','Boot 4.1.1 · Java25'],['실행 확인 명령','./gradlew bootRun'],['현재 확인 범위','Spring 미실행']]),
    ],
  },
  {
    id:'comparison',question:'==와 equals, 숫자 조건의 결과는 어떻게 다를까요?',source:'§2 연산 보강 · 원문 137~173줄',
    note:'각 상태는 원문 규칙을 실행으로 확인한 별도 추가 예시입니다. 문자열 비교는 new String 두 개를 사용하며 리터럴 intern 여부에 기대지 않습니다.',
    stages:[
      state('string-identity','객체 동일성과 내용','P09-string-equality','각각 new로 만든 두 String은 별도 객체입니다. a == b는 false이지만 a.equals(b)는 true입니다.','String a = new String("Ada");\nString b = new String("Ada");\na == b\na.equals(b)',[2,3],[['a와 b의 참조','서로 다른 객체'],['a == b','false'],['a.equals(b)','true'],['양쪽 문자열 내용','Ada']]),
      state('boolean-condition','조건의 타입','P09-boolean-condition','Java는 숫자를 참·거짓으로 자동 변환하지 않습니다. 추가 count=1 예시에서 if(count)는 컴파일 불가이며 count>0은 boolean true입니다.','int count = 1;\n// 컴파일 실패: if (count)\nif (count > 0) { /* 조건을 만족할 때 */ }',[1,2],[['추가 count','1 · int'],['if가 요구하는 타입','boolean'],['count > 0 결과','true'],['범위 조건','age > 0 && age < 100']],{note:'count=1은 조건 타입을 확인하는 추가 입력입니다. 원문의 기호 age에는 고정값을 넣지 않습니다.'}),
      state('not-false','false를 부정하면','P09-not','!closed는 반대 boolean 값을 만듭니다. 원래 closed 변수에 재대입하는 연산은 아닙니다.','boolean closed = false;\nboolean negated = !closed;',[1],[['추가 입력 closed','false'],['negated 결과','true'],['표현식 뒤 closed','false 유지']],{note:'closed의 두 값은 서로 독립된 추가 예시입니다. ready의 값이나 전체 ready && !closed 결과는 원문에 고정되어 있지 않습니다.'}),
      state('not-true','true를 부정하면','P09-not','이번 독립 예시는 closed=true에서 시작합니다. !closed의 결과는 false지만 closed는 true를 유지합니다.','boolean closed = true;\nboolean negated = !closed;',[1],[['추가 입력 closed','true'],['negated 결과','false'],['표현식 뒤 closed','true 유지']],{note:'부정 결과를 negated에 대입했습니다. closed에 대입하지 않았습니다.'}),
      state('bitwise','정수 비트와 boolean','P09-bitwise','정수 &·|·^는 각 비트에 AND·OR·XOR를 적용합니다. boolean 도메인의 같은 기호와 단락 연산 &&·||를 구별합니다.','int andBits = 6 & 3;\nint orBits = 6 | 3;\nint xorBits = 6 ^ 3;',[0,1,2],[['추가 int 입력','6 (0110), 3 (0011)'],['6 & 3','2 (0010)'],['6 | 3','7 (0111)'],['6 ^ 3','5 (0101)']],{note:'6과3은 별도 추가 예시입니다. 그림은 하위4비트만 표시하며 int의 앞쪽0비트는 생략했습니다. boolean &와 |는 양쪽을 평가합니다.'}),
    ],
  },
  {
    id:'increments',question:'증감과 부호는 식의 값과 저장값을 어떻게 나눌까요?',source:'§2 연산 보강 · 원문 137~212줄',
    note:'서로 독립된 초기값 1의 추가 실행 예시입니다. OperatorsDemo의 calls 진행과 섞지 않습니다. 증감은 가능하면 별도 줄에 둡니다.',
    stages:[
      state('postfix','후위 ++ 결과','P09-increment','x++는 증감 전 1을 식의 결과로 사용합니다. 문장 뒤 x에 저장된 값은 2입니다.','int x = 1;\nint result = x++;',[1],[['증감 전 x','1'],['식의 결과 result','1'],['증감 후 x','2']]),
      state('prefix','전위 ++ 결과','P09-increment','++x는 먼저 2로 증가시킨 값을 식의 결과로 사용합니다. result와 문장 뒤 x가 모두 2입니다.','int x = 1;\nint result = ++x;',[1],[['증감 전 x','1'],['식의 결과 result','2'],['증감 후 x','2']]),
      state('postfix-decrement','후위 -- 결과','P09-increment','독립된 x=1에서 x--는 식의 결과로 이전 1을 사용하고 x에는 0을 저장합니다.','int x = 1;\nint result = x--;',[1],[['증감 전 x','1'],['식의 결과 result','1'],['증감 후 x','0']]),
      state('prefix-decrement','전위 -- 결과','P09-increment','독립된 x=1에서 --x는 먼저 0을 저장한 뒤 식의 결과로 그 0을 사용합니다.','int x = 1;\nint result = --x;',[1],[['증감 전 x','1'],['식의 결과 result','0'],['증감 후 x','0']]),
      state('unary-plus','단항 + 부호','P09-unary-sign','+x는 이 추가 예시에서 1을 값으로 만들고 원래 x 자체는 1을 유지합니다.','int x = 1;\nint signed = +x;',[1],[['입력 x','1'],['signed 결과','1'],['문장 뒤 x','1 유지']]),
      state('unary-minus','단항 - 부호','P09-unary-sign','-x의 결과 -1을 signed에 대입했습니다. x에 재대입한 것이 아니므로 x는 1입니다.','int x = 1;\nint signed = -x;',[1],[['입력 x','1'],['signed 결과','-1'],['문장 뒤 x','1 유지']]),
    ],
  },
  {
    id:'numeric-boundary',question:'정수와 금액 연산의 경계는 어디일까요?',source:'§2 연산 보강 · 원문 152줄',
    note:'아래 구체 수치는 원문 설명의 경계를 재현한 추가 순수 Java 실행입니다. 실습 API나 DB의 성능 측정값이 아닙니다.',
    stages:[
      state('division-mod','몫과 나머지','P09-division-mod','정수 나눗셈 7 / 3은 2, 나머지 연산 7 % 3은 1입니다. 정수 나눗셈은 소수 부분을 버립니다.','7 / 3\n7 % 3',[0,1],[['7 / 3','2'],['7 % 3','1'],['결과 타입','이 int 피연산자 예제는 int']]),
      state('zero-division','정수 0 나눗셈','P09-zero-division','분모 0으로 실제 정수 나눗셈을 실행하면 ArithmeticException이 납니다. 단락 평가 가드는 나눗셈 실행 자체를 건너뛰는 방식입니다.','int zero = 0;\nint value = 7 / zero;',[1],[['분모','0'],['나눗셈 실행 결과','ArithmeticException'],['앞선 divisor 가드 예제','나눗셈을 실행하지 않음']]),
      state('overflow','int 범위 넘김','P09-int-overflow','Integer.MAX_VALUE에 1을 더한 int 결과는 Integer.MIN_VALUE입니다. 일반 int 덧셈은 이 오버플로를 예외로 알리지 않습니다.','Integer.MAX_VALUE + 1',[0],[['Integer.MAX_VALUE','2147483647'],['1을 더한 int 결과','-2147483648'],['일반 int 덧셈 예외','오버플로 예외 없음']]),
      state('decimal','이진 근삿값과 십진수','P09-decimal-precision','double의 0.1 + 0.2는 0.3과 정확히 같지 않습니다. 문자열로 구성한 BigDecimal의 십진수 더하기는 이 예제에서 정확한 0.3입니다.','0.1 + 0.2 == 0.3\nnew BigDecimal("0.1").add(new BigDecimal("0.2"))',[0,1],[['double 합','0.30000000000000004'],['double 동등 비교','false'],['BigDecimal 문자열 입력 합','0.3'],['실제 금액 모델','정밀도·반올림 규칙도 정함']]),
    ],
  },
  {
    id:'errors',question:'컴파일 오류에서 어떤 선언과 호출을 대조할까요?',source:'§5 · 원문 428~435줄',
    note:'원문 오류를 별도 작은 코드로 재현해 javac 진단을 확인했습니다. 메서드 인자 타입 불일치 등 cannot find symbol의 다른 원인도 원문 전체에서 보존합니다.',
    stages:[
      state('error-local','지역 변수 초기화','P09-error-local','필드 기본값 규칙을 지역 변수에 적용할 수 없습니다. int x를 대입하지 않고 읽으면 컴파일이 거부됩니다.','int value() { int x; return x; }',[0],[['진단','variable x might not have been initialized'],['확인할 것','읽기 전 모든 경로의 대입'],['기본값 0 자동 적용','지역 변수에 적용 안 됨']]),
      state('error-static','static 문맥의 객체 상태','P09-04A','static 문맥에는 this가 없습니다. 필요한 객체를 인자로 받거나 인스턴스 메서드로 바꾸어 대상 객체에서 호출합니다.','static Object value() { return this; }',[0],[['진단','non-static ... cannot be referenced from a static context'],['확인할 것','객체 수신자 · 인스턴스 상태 필요 여부'],['해결 방향','obj.method() 또는 필요한 객체를 인자로 전달']]),
      state('error-return','빠진 반환과 중복 시그니처','P09-error-return','비void 메서드의 정상 종료 경로에 return이 필요합니다. 반환 타입만 다르거나 매개변수 이름만 다른 메서드는 중복 선언입니다.','int value(boolean enabled) {\n    if (enabled) return 1;\n}',[2],[['enabled=false 경로','반환값 없음 · 컴파일 실패'],['반환 타입만 바꾼 find(long)','중복 선언 · 컴파일 실패'],['매개변수 이름만 바꾼 find(long)','중복 선언 · 컴파일 실패']]),
      state('error-symbol','이름과 파일 위치','P09-01','cannot find symbol이면 오류 줄의 이름·import·패키지·인자 목록을 대조합니다. 공개 클래스 Invoice의 잘못된 파일명도 별도 재현에서 거부됐습니다.','package com.example.billing;\nimport java.math.BigDecimal;\npublic class Invoice { private BigDecimal total; }',[0,1,2],[['확인 순서','선언 이름 → import → 매개변수 시그니처'],['공개 클래스','Invoice'],['필요한 파일명','Invoice.java']]),
    ],
  },
);

const sourceFragment = (start, end, startColumn, endColumn) => ({ start, end, ...(startColumn === undefined ? {} : { startColumn, endColumn }) });
const boundaryCode = (code, active, sourceFragments) => ({ code, active, sourceFragments });
P09_LESSONS.push(
  {
    id:'shared-state', question:'객체 두 개를 만들면 static 상태도 두 개가 될까요?', source:'§2.3 · 추가 P09BoundariesProof.RequestState/main',
    note:'Java 21 순수 추가 예시의 순차 관측입니다. a와 b는 설명용 변수이며 메모리 주소가 아닙니다. HTTP·Spring·DB·동시 요청은 실행하지 않았습니다. 화살표는 클래스 필드 접근이며 객체 안에 저장한 참조 필드가 아닙니다. 요청별 상태를 shared static에 두지 않습니다.',
    stages:[
      {
        id:'shared-before', title:'호출 전, 각 quantity는 0', image:'P09-shared-state-dark',
        lead:'quantity는 객체마다 생기고 static latestName은 클래스에 하나 있습니다. 호출 전 두 quantity는 0이고, String 필드의 기본값 null은 문자열이 아닙니다.',
        ...boundaryCode('    static class RequestState {\n        int quantity;\n        static String latestName;\n        void record(String name, int value) { quantity = value; latestName = name; }\n    }\n        RequestState a = new RequestState(), b = new RequestState();',[5],[sourceFragment(6,10),sourceFragment(20,20)]),
        values:[['a.quantity','0'],['b.quantity','0'],['RequestState.latestName','null'],['관찰','initial=0/0/null']],
      },
      {
        id:'shared-after-a', title:'a의 record 호출 뒤', image:'P09-shared-state-dark',
        lead:'a.record는 a.quantity와 클래스의 latestName을 바꿉니다. b.quantity는 별도 객체의 값이라 0을 유지합니다.',
        ...boundaryCode('    static class RequestState {\n        int quantity;\n        static String latestName;\n        void record(String name, int value) { quantity = value; latestName = name; }\n    }\n        RequestState a = new RequestState(), b = new RequestState();\n        a.record("Ada", 2);',[3,6],[sourceFragment(6,10),sourceFragment(20,20),sourceFragment(22,22)]),
        values:[['a.quantity','2'],['b.quantity','0'],['RequestState.latestName','Ada'],['관찰','afterA=2/0/Ada']],
      },
      {
        id:'shared-after-b', title:'b의 record 호출 뒤', image:'P09-shared-state-dark',
        lead:'b.quantity는 5가 되고, 같은 static latestName에는 Grace가 들어갑니다. 앞서 저장한 Ada가 유지되지 않습니다. 순차 호출만 확인했으며 동시성 재현은 아닙니다.',
        ...boundaryCode('    static class RequestState {\n        int quantity;\n        static String latestName;\n        void record(String name, int value) { quantity = value; latestName = name; }\n    }\n        RequestState a = new RequestState(), b = new RequestState();\n        a.record("Ada", 2);\n        b.record("Grace", 5);',[3,7],[sourceFragment(6,10),sourceFragment(20,20),sourceFragment(22,22),sourceFragment(24,24)]),
        values:[['a.quantity','2'],['b.quantity','5'],['RequestState.latestName','Grace'],['관찰','afterB=2/5/Grace']],
      },
    ],
  },
  {
    id:'varargs-selection', question:'가변 인자의 합계와 오버로드 선택은 어떻게 확인할까요?', source:'§2.8·Q7 · 추가 P09BoundariesProof.sum/choose/main',
    note:'out(key, value)는 관측 이름과 값을 한 줄로 출력하는 추가 helper입니다. sum은 원문의 누적식과 같은 추가 실행입니다. 배열 원소 표시는 호출 인자와 source를 읽어 설명하며 런타임 debugger 캡처가 아닙니다. choose의 반환 문자열은 선택 표시자이고, 아래 두 선언에 한정한 Java 21 컴파일 시 overload 선택입니다. HTTP·Spring·DB·성능은 미실행입니다.',
    stages:[
      {
        id:'sum-empty', title:'인자가 없는 호출', image:'P09-varargs-selection-dark',
        lead:'반복 전 total은 0입니다. 빈 호출은 길이 0인 배열을 전달하므로 반복하지 않고 0을 반환합니다.',
        ...boundaryCode('    static int sum(int... values) {\n        int total = 0;\n        for (int value : values) total += value;\n        return total;\n    }\n        out("sumEmpty", sum());',[5],[sourceFragment(11,15),sourceFragment(27,27,0,31)]),
        values:[['호출 인자','[]'],['배열 길이','0'],['sum 반환','0'],['실행 관측','sumEmpty=0']],
      },
      {
        id:'sum-items', title:'개별 인자 두 개', image:'P09-varargs-selection-dark',
        lead:'2와 3이 varargs 배열의 원소가 되고, 반복에서 total에 차례로 더해 합계 5를 반환합니다.',
        ...boundaryCode('    static int sum(int... values) {\n        int total = 0;\n        for (int value : values) total += value;\n        return total;\n    }\nout("sumItems", sum(2, 3));',[5],[sourceFragment(11,15),sourceFragment(27,27,32,59)]),
        values:[['호출 인자','2, 3'],['values 배열 원소','[2, 3]'],['배열 길이','2'],['sum 반환','5'],['실행 관측','sumItems=5']],
      },
      {
        id:'sum-array', title:'기존 int[] 전달', image:'P09-varargs-selection-dark',
        lead:'이미 만든 int[]를 varargs의 배열 매개변수로 바로 전달할 수 있습니다. 원소 4와 6의 합은 10입니다.',
        ...boundaryCode('    static int sum(int... values) {\n        int total = 0;\n        for (int value : values) total += value;\n        return total;\n    }\n        out("sumArray", sum(new int[]{4, 6}));',[5],[sourceFragment(11,15),sourceFragment(28,28)]),
        values:[['호출 인자','new int[]{4, 6}'],['values 배열 원소','[4, 6]'],['배열 길이','2'],['sum 반환','10'],['실행 관측','sumArray=10']],
      },
      {
        id:'choose-fixed', title:'두 int 인자 선택', image:'P09-varargs-selection-dark',
        lead:'이 두 선언에서는 인자 두 개와 맞는 고정 개수 choose(int, int)가 선택됩니다. 반환 문자열은 합계가 아니라 선택 결과를 구분하는 표시자입니다.',
        ...boundaryCode('    static String choose(int first, int second) { return "fixed(int,int)"; }\n    static String choose(int... values) { return "varargs(int[])"; }\n        out("chooseTwo", choose(2, 3));',[0,2],[sourceFragment(16,17),sourceFragment(29,29,0,39)]),
        values:[['호출','choose(2, 3)'],['선택','fixed(int,int)'],['실행 관측','chooseTwo=fixed(int,int)'],['표시자 의미','합계가 아님']],
      },
      {
        id:'choose-array', title:'int[] 인자 선택', image:'P09-varargs-selection-dark',
        lead:'배열 하나는 varargs의 int[] 매개변수에 직접 맞습니다. 이 두 선언 중 고정 메서드에는 int 두 개가 필요하므로 선택되지 않습니다.',
        ...boundaryCode('    static String choose(int first, int second) { return "fixed(int,int)"; }\n    static String choose(int... values) { return "varargs(int[])"; }\nout("chooseArray", choose(new int[]{2, 3}));',[1,2],[sourceFragment(16,17),sourceFragment(29,29,40,84)]),
        values:[['호출','choose(new int[]{2, 3})'],['선택','varargs(int[])'],['실행 관측','chooseArray=varargs(int[])'],['범위','표시된 두 선언에 한정']],
      },
      {
        id:'choose-empty', title:'인자가 없는 선택', image:'P09-varargs-selection-dark',
        lead:'인자가 없어도 가변 인자 선언은 길이 0인 int[]로 호출할 수 있습니다. 선택은 컴파일 때 결정되며 runtime 동적 dispatch 시연이 아닙니다.',
        ...boundaryCode('    static String choose(int first, int second) { return "fixed(int,int)"; }\n    static String choose(int... values) { return "varargs(int[])"; }\n        out("chooseEmpty", choose());',[1,2],[sourceFragment(16,17),sourceFragment(30,30)]),
        values:[['호출','choose()'],['varargs 배열 길이','0'],['선택','varargs(int[])'],['실행 관측','chooseEmpty=varargs(int[])']],
      },
    ],
  },
);
