// 원문 P04와 source-proof 실행 증거를 바탕으로 한 설명용 상태다. 실제 서버 계측이 아니다.
export const p04AssetRoot = '../design/p04-2026-10-20/images/';
// ready는 실제 파일·그림의 기술 검수를 마친 뒤에만 true로 올린다. focus는 검수자가 확정한다.
export const P04_ASSETS = {
  "initialization": {
    "id": "initialization",
    "file": "P04-initialization-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "한 Child 객체의 7개 초기화 동작 완료 뒤 Parent.marker와 Child.marker 값을 비교한다. stdout 발생 순간과 필드 대입 완료를 구별한다.",
    "focus": {
      "init-1": [
        18,
        42,
        80,
        6
      ],
      "init-2": [
        18,
        48,
        80,
        6
      ],
      "init-3": [
        18,
        54,
        80,
        6
      ],
      "init-4": [
        18,
        62,
        80,
        6
      ],
      "init-5": [
        18,
        68,
        80,
        6
      ],
      "init-6": [
        18,
        75,
        80,
        6
      ],
      "init-7": [
        18,
        81,
        80,
        7
      ]
    }
  },
  "factory": {
    "id": "factory",
    "file": "P04-factory-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "Order.of(ORD-1, 2)가 private 생성자의 검증을 거쳐 id ORD-1·quantity 2·빈 tags의 Order를 반환한다. List.copyOf는 새 인스턴스 할당을 보장한다고 쓰지 않는다.",
    "focus": {
      "factory-call": [
        2,
        18,
        69,
        17
      ],
      "factory-validated": [
        33,
        61,
        38,
        11
      ],
      "factory-return": [
        74,
        22,
        24,
        28
      ]
    }
  },
  "builder": {
    "id": "builder",
    "file": "P04-builder.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "같은 Builder의 초기 null·0·빈 목록에서 id ORD-2·quantity 3·gift로 설정한다. build 뒤에야 별도 Order가 정상 반환된다.",
    "focus": {
      "builder-empty": [
        2,
        32,
        15,
        35
      ],
      "builder-id": [
        19,
        32,
        13,
        35
      ],
      "builder-quantity": [
        34,
        32,
        14,
        35
      ],
      "builder-tag": [
        49,
        32,
        14,
        35
      ],
      "builder-built": [
        77,
        24,
        21,
        44
      ]
    }
  },
  "builder-invalid": {
    "id": "builder-invalid",
    "file": "P04-builder-invalid-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "독립된 새 빈 Builder의 build는 id null 검사에서 id is required 예외를 던진다. id.isBlank·수량 검사·필드 대입·목록 복사는 도달하지 않는다.",
    "focus": {
      "builder-invalid": [
        2,
        72,
        96,
        15
      ]
    }
  },
  "copy": {
    "id": "copy",
    "file": "P04-copy-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "추가 실행: Builder에 late를 추가해도 기존 Order.tags는 gift다. 다음 build의 별도 Order는 gift와 late를 가진다. List.copyOf는 구조의 얕은 복사다.",
    "focus": {
      "copy-before": [
        2,
        44,
        33,
        39
      ],
      "copy-late": [
        35,
        44,
        31,
        39
      ],
      "copy-rebuild": [
        67,
        44,
        31,
        39
      ]
    }
  },
  "record": {
    "id": "record",
    "file": "P04-record-v5.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "SignupRequest 입력 email 앞뒤 공백을 제거한 매개변수로 본문 종료 뒤 필드를 초기화한다. bad 입력은 첫 검증에서 예외가 나며 displayName 검사는 미실행이다.",
    "focus": {
      "record-input": [
        2,
        21,
        20,
        30
      ],
      "record-email": [
        24,
        28,
        18,
        9
      ],
      "record-name": [
        24,
        38,
        18,
        12
      ],
      "record-validated": [
        44,
        21,
        17,
        30
      ],
      "record-fields": [
        62,
        21,
        36,
        30
      ],
      "record-bad": [
        2,
        59,
        96,
        24
      ]
    }
  },
  "default-constructor": {
    "id": "default-constructor",
    "file": "P04-default-constructor.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "서로 독립된 User 선언 세 개를 비교한다. 생성자가 없으면 기본 생성자가 제공되고, String 생성자만 선언하면 무인자 호출은 컴파일 거부된다. 명시한 무인자 생성자는 this로 guest를 전달한다.",
    "focus": {
      "default-implicit": [
        2,
        12,
        31,
        78
      ],
      "default-missing": [
        35,
        12,
        31,
        78
      ],
      "default-explicit": [
        67,
        12,
        31,
        78
      ]
    }
  },
  "override-constructor": {
    "id": "override-constructor",
    "file": "P04-override-constructor.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "독립 추가 예제 P04ConstructorProof의 Parent 생성자가 Child.inspect를 호출할 때 Child.label은 null이다. 자식 필드 초기화까지 완료한 뒤에는 ready다. 원문 marker 예제와 다르다.",
    "focus": {
      "override-parent": [
        2,
        21,
        53,
        52
      ],
      "override-ready": [
        56,
        21,
        42,
        52
      ]
    }
  },
  "lombok-fields": {
    "id": "lombok-fields",
    "file": "P04-lombok-fields.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "추가 Fields 예제의 Required 생성자 인자는 Gateway와 String이고 AllArgs에는 int retries가 더해진다. 초기화한 final fixed와 static shared는 제외된다. final gateway의 null은 허용되고 NonNull name의 null은 거부된다.",
    "focus": {
      "lombok-required": [
        62,
        20,
        35,
        19
      ],
      "lombok-allargs": [
        62,
        41,
        35,
        23
      ],
      "lombok-null": [
        2,
        67,
        96,
        30
      ]
    }
  },
  "builder-default": {
    "id": "builder-default",
    "file": "P04-builder-default-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "추가 PlainConfig는 limit 초기식 20이 있어도 builder에서 생략하면 0이다. 별도 DefaultConfig의 Builder.Default는 생략 시 20, 명시 입력 시 7이다.",
    "focus": {
      "builder-default-plain": [
        1,
        11,
        32,
        77
      ],
      "builder-default-omitted": [
        35,
        11,
        31,
        77
      ],
      "builder-default-explicit": [
        67,
        11,
        32,
        77
      ]
    }
  },
  "builder-target": {
    "id": "builder-target",
    "file": "P04-builder-target-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "추가 ExplicitBuilder는 클래스 Builder와 명시 무인자 생성자의 불일치로 컴파일 거부된다. 별도 Targeted의 String 생성자에 Builder를 붙이면 Mina가 저장되고 누락된 이름은 생성자 검증으로 거부된다.",
    "focus": {
      "builder-target-mismatch": [
        1,
        13,
        46,
        64
      ],
      "builder-target-constructor": [
        48,
        13,
        50,
        64
      ]
    }
  },
  "noargs-force": {
    "id": "noargs-force",
    "file": "P04-noargs-force.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "추가 Forced의 NoArgsConstructor force는 NonNull final String name과 final int retries를 각각 null과 0으로 둘 수 있다. 생성 성공이 도메인 유효성을 보장하지 않는다.",
    "focus": {
      "force-definition": [
        2,
        14,
        30,
        67
      ],
      "force-result": [
        67,
        14,
        31,
        67
      ]
    }
  },
  "constructor-injection": {
    "id": "constructor-injection",
    "file": "P04-constructor-injection-v4.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "독립 Spring 7.0.9 컨텍스트 추가 실험. 세 Bean을 명시 등록해 같은 generator와 service를 생성자 주입한다. 직접 Java 호출은 Mina와 수량 2, UUID 형식의 id를 반환한다. 별도 컨텍스트의 generator 누락은 실패한다. HTTP 실행이 아니다.",
    "focus": {
      "injection-generator": [
        40,
        21,
        58,
        37
      ],
      "injection-service": [
        2,
        21,
        65,
        37
      ],
      "injection-direct-call": [
        2,
        60,
        96,
        21
      ]
    }
  },
  "dto-entity": {
    "id": "dto-entity",
    "file": "P04-dto-entity-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문 OrderRequest record는 입력을 정규화하고 검증한다. JPA Entity의 public 또는 protected 무인자 생성자 규칙은 별도 원문 설명이다. JPA·DB는 실행하지 않았다.",
    "focus": {
      "entity-rule": [
        52,
        17,
        46,
        75
      ]
    }
  },
  "java25-boundary": {
    "id": "java25-boundary",
    "file": "P04-java25-boundary-v2.jpg",
    "width": 1673,
    "height": 940,
    "ready": true,
    "alt": "추가 BeforeSuper21의 super 앞 인자 검증은 JDK21에서 컴파일 거부됐다. Java25의 제한된 생성자 전처리 허용은 원문 설명이며 이 환경에서는 실행하지 않았다.",
    "focus": {
      "java21-reject": [
        2,
        22,
        47,
        66
      ],
      "java25-described": [
        51,
        22,
        47,
        66
      ]
    }
  },
  "injection-missing": {
    "id": "injection-missing",
    "alt": "독립 컨텍스트에 OrderService만 등록하면 필수 OrderIdGenerator를 찾지 못한다. 바깥 UnsatisfiedDependencyException과 원인 NoSuchBeanDefinitionException을 구분한다.",
    "file": "P04-injection-missing-v3.jpg",
    "focus": {
      "injection-missing": [
        71,
        22,
        27,
        57
      ]
    },
    "width": 1672,
    "height": 941,
    "ready": true
  },
  "dto-invalid": {
    "id": "dto-invalid",
    "alt": "원문 OrderRequest의 독립 입력 Mina·0과 공백·2가 invalid order 예외로 거부된다. 공백 이름에서는 OR 단락으로 수량 검사가 미평가이며 정상 record 필드 초기화에 도달하지 않는다.",
    "file": "P04-dto-invalid-v2.jpg",
    "focus": {
      "dto-record": [
        2,
        42,
        96,
        40
      ]
    },
    "width": 1672,
    "height": 941,
    "ready": true
  }
};
export const P04_INITIALIZATION_STDOUT = ['Parent field', 'Parent initializer block', 'Parent constructor', 'Child field', 'Child initializer block', 'Child constructor body: delegated', 'Child no-arg constructor body'];
const stage = (id, title, lead, image, code, values, extra = {}) => ({ id, title, lead, image, code, values, active: [0], stdout: '', ...extra });
const source = '원문 §3 · 순수 Java 예제 · JDK 21 실행 증거';
const initCode = [
  'private String marker = mark("Parent field");',
  '{ System.out.println("Parent initializer block"); }',
  'Parent() { System.out.println("Parent constructor"); }',
  'private String marker = Parent.mark("Child field");',
  '{ System.out.println("Child initializer block"); }',
  'Child(String value) { System.out.println("Child constructor body: " + value); }',
  'Child() { this("delegated"); System.out.println("Child no-arg constructor body"); }',
];
const initTitles = ['부모 필드 대입 완료', '부모 초기화 블록 완료', '부모 생성자 본문 완료', '자식 필드 대입 완료', '자식 초기화 블록 완료', '위임받은 자식 본문 완료', '무인자 자식 본문 완료'];
const initLeads = [
  'new Child()는 this("delegated")로 위임하고 부모 초기화부터 진행합니다. mark가 출력·반환한 다음 Parent.marker에 반환값을 대입했습니다.',
  '부모 필드 초기화 다음, 부모의 인스턴스 초기화 블록이 실행됐습니다. 자식 필드 초기화는 아직 시작하지 않았습니다.',
  'Parent() 본문까지 끝났습니다. 부모 부분의 초기화를 마쳐야 자식 필드 초기화로 넘어갑니다.',
  'Parent.mark가 Child field를 출력하고 반환한 뒤 Child.marker에 대입했습니다. 부모 marker는 덮어쓰지 않습니다.',
  '자식 필드 초기화 다음 자식의 인스턴스 초기화 블록이 실행됐습니다.',
  'this("delegated")의 대상인 Child(String value) 본문이 끝났습니다. 매개변수 value는 delegated입니다.',
  '위임 호출에서 돌아온 뒤 Child()의 나머지 본문이 실행됐습니다. 이제 new Child()가 정상 완료됩니다.',
];
const builderCode = 'Order.builder().id("ORD-2").quantity(3).tag("gift").build();';
const b = (id, quantity, tags, status = '같은 Builder · 설정 중') => [['Builder 상태', status], ['Builder.id', id], ['Builder.quantity', String(quantity)], ['Builder.tags', tags]];
const recordInput = 'new SignupRequest(" user@example.com ", "Mina")';
const recordNote = '매개변수와 record 필드는 다릅니다. compact constructor 본문이 정상 종료하면 정규화한 매개변수로 필드를 암시적으로 초기화합니다. 실패 시 생성 표현식이 정상 반환하지 않으며, 객체 할당 자체가 없었다는 뜻은 아닙니다.';
export const P04_LESSONS = [
  { id: 'initialization', question: 'new Child()는 어떤 순서로 필드를 준비할까?', source: source + ' · CreationDemo', note: '각 필드 초기화·블록·본문 동작 완료 뒤의 스냅샷입니다. mark는 println → return → 필드 대입 순서이므로 출력 발생 순간의 필드 값과 구분합니다. Parent.marker와 Child.marker는 한 Child 객체 안에 따로 있는 private 필드입니다.', stages: initTitles.map((title, i) => stage('init-' + (i + 1), title, initLeads[i], 'initialization', initCode[i], [['한 객체', 'Child · 부모 부분 + 자식 부분'], ['Parent.marker', 'Parent field'], ['Child.marker', i < 3 ? 'null' : 'Child field'], ['관찰 시점', '해당 동작 완료 뒤']], { stdout: P04_INITIALIZATION_STDOUT.slice(0, i + 1).join('\n'), snapshot: '각 필드 초기화·블록·본문 동작 완료 뒤의 스냅샷' })) },
  { id: 'factory', question: 'Order.of("ORD-1", 2)는 무엇을 만들어 돌려줄까?', source: source + ' · CreationDemo', note: 'of는 이 예제의 이름 있는 생성 경로입니다. 여기서는 새 Order를 만들며 모든 정적 팩토리가 언제나 새 객체를 만든다는 뜻은 아닙니다. tags의 입력은 List.of()인 빈 목록입니다.', stages: [
    stage('factory-call', '이름 있는 진입점', 'of에 id와 수량을 전달합니다. 메서드 내부가 private 생성자를 호출하므로 호출자가 tags까지 직접 넘길 필요는 없습니다.', 'factory', 'static Order of(String id, int quantity) {\n    return new Order(id, quantity, List.of());\n}', [['factory 매개변수 id', 'ORD-1'], ['factory 매개변수 quantity', '2'], ['생성자에 넘길 tags', '[]'], ['반환값', '아직 없음']], { active: [1] }),
    stage('factory-validated', 'private 생성자의 검증', 'id는 공백이 아니고 수량은 1 이상입니다. 두 검사를 통과했지만, 이 장면은 필드 대입 직전입니다.', 'factory', 'if (id == null || id.isBlank()) throw new IllegalArgumentException("id is required");\nif (quantity < 1) throw new IllegalArgumentException("quantity must be positive");', [['생성자 입력', 'ORD-1 / 2 / []'], ['검증', '두 조건 통과'], ['Order 필드', '대입 전 기본값: id=null / quantity=0 / tags=null']], { active: [0, 1] }),
    stage('factory-return', '필드를 채운 Order 반환', '생성자는 필드를 대입하고 tags를 방어 복사합니다. 생성이 정상 완료된 Order를 of가 반환하고 println이 아래 한 줄을 출력합니다.', 'factory', 'this.id = id;\nthis.quantity = quantity;\nthis.tags = List.copyOf(tags);', [['Order.id', 'ORD-1'], ['Order.quantity', '2'], ['Order.tags', '[]'], ['toString()', 'ORD-1 x 2 tags=[]']], { active: [0, 1, 2], stdout: 'ORD-1 x 2 tags=[]' }),
  ] },
  { id: 'builder', question: 'Builder의 연속 호출은 같은 객체를 바꿀까?', source: source + ' · CreationDemo / 추가 검증', note: '원문의 연속 호출을 한 단계씩 나눠 읽습니다. id·quantity·tag는 mutable Builder의 같은 this를 반환합니다. 일반 Builder가 컴파일 시점에 필수값을 보장하지 않으며, build가 호출하는 Order 생성자에서 검증합니다.', stages: [
    stage('builder-empty', '빈 Builder 생성', 'Order.builder()가 new Builder()를 반환했습니다. 아직 유효한 주문은 없고 설정용 Builder만 있습니다.', 'builder', 'static Builder builder() { return new Builder(); }', b('null', 0, '[]')),
    stage('builder-id', 'id 설정', '같은 Builder의 id 필드가 ORD-2가 됩니다. return this는 다음 quantity 호출의 대상을 같은 Builder로 이어 줍니다.', 'builder', 'Builder id(String value) { id = value; return this; }\n// 호출: .id("ORD-2")', b('ORD-2', 0, '[]')),
    stage('builder-quantity', 'quantity 설정', 'id는 유지되고 같은 Builder의 quantity만 3이 됩니다. 아직 Order 생성자를 호출하지 않았습니다.', 'builder', 'Builder quantity(int value) { quantity = value; return this; }\n// 호출: .quantity(3)', b('ORD-2', 3, '[]')),
    stage('builder-tag', 'tag 추가', '같은 Builder의 변경 가능한 목록에 gift를 추가합니다. 여기까지의 객체는 여전히 Builder입니다.', 'builder', 'Builder tag(String value) { tags.add(value); return this; }\n// 호출: .tag("gift")', b('ORD-2', 3, '[gift]')),
    stage('builder-built', 'build가 별도 Order 반환', 'build가 현재 Builder 값을 private 생성자에 전달합니다. 검증·필드 대입·방어 복사 후 별도 Order를 반환합니다.', 'builder', 'Order build() { return new Order(id, quantity, tags); }\n// 원문 연속 호출\n' + builderCode, [...b('ORD-2', 3, '[gift]', '같은 Builder · 남아 있음'), ['반환 객체', '별도 Order'], ['Order.toString()', 'ORD-2 x 3 tags=[gift]']], { stdout: 'ORD-2 x 3 tags=[gift]' }),
    stage('builder-invalid', '필수값 누락은 build에서 거부', '독립된 추가 실험입니다. 앞선 Builder를 이어 쓰는 것이 아니라 새 빈 Builder에서 곧바로 build를 호출합니다.', 'builder-invalid', 'Order.builder().build();\n// IllegalArgumentException: id is required', [['별도 새 Builder', 'id=null / quantity=0 / tags=[]'], ['실행 결과', 'IllegalArgumentException: id is required'], ['반환', '정상 Order 반환 없음']], { note: '추가 실험 P04StateProof로 확인했습니다. id 검사에서 먼저 예외가 나므로 quantity 검사는 이 호출에서 도달하지 않습니다. id만 채운 별도 Builder도 quantity=0이면 quantity must be positive로 거부됩니다.' }),
  ] },
  { id: 'copy', question: 'Builder의 목록을 바꾸면 이미 만든 Order도 바뀔까?', source: '추가 실험 · P04StateProof · JDK 21 실행 증거', note: '원문 Order 코드를 그대로 사용한 추가 실험입니다. List.copyOf는 컬렉션 구조를 변경할 수 없는 얕은 복사를 만듭니다. 요소 객체까지 복제하지 않습니다. 아래 문자열은 추가 검증의 toString() 확인값이며 원문 CreationDemo의 추가 stdout이 아닙니다. final만으로 입력 목록의 변경을 막는 것은 아닙니다.', stages: [
    stage('copy-before', '첫 build 완료', 'Builder에 ORD-2·3·gift를 넣어 첫 Order를 만들었습니다. 생성자는 전달받은 목록을 그대로 보관하지 않고 List.copyOf로 저장합니다.', 'copy', 'Order.Builder builder = Order.builder().id("ORD-2").quantity(3).tag("gift");\nOrder first = builder.build();\n// 생성자: this.tags = List.copyOf(tags);', [['Builder.tags', '[gift]'], ['기존 Order.tags', '[gift]'], ['생성 완료', '기존 Order = ORD-2 / 3']], { active: [1, 2] }),
    stage('copy-late', 'Builder에만 late 추가', '같은 Builder의 목록을 바꿨습니다. 기존 Order는 이미 복사한 목록을 가지므로 gift만 유지합니다.', 'copy', 'builder.tag("late");\nSystem.out.println(first);', [['Builder.tags', '[gift, late]'], ['기존 Order.tags', '[gift]'], ['기존 Order.toString()', 'ORD-2 x 3 tags=[gift]']], { stdout: 'ORD-2 x 3 tags=[gift]', outputLabel: '추가 실험 확인값 · toString()' }),
    stage('copy-rebuild', '다음 build는 현재 목록 사용', '다시 build하면 그때의 gift·late를 복사한 다른 Order가 생깁니다. 첫 Order는 변하지 않습니다.', 'copy', 'Order next = builder.build();\nSystem.out.println(next);', [['Builder.tags', '[gift, late]'], ['기존 Order.tags', '[gift]'], ['다음 Order.tags', '[gift, late]'], ['다음 Order.toString()', 'ORD-2 x 3 tags=[gift, late]']], { stdout: 'ORD-2 x 3 tags=[gift, late]', outputLabel: '추가 실험 확인값 · toString()' }),
  ] },
  { id: 'record', question: 'compact constructor의 trim은 언제 필드에 저장될까?', source: source + ' · RequestDemo', note: recordNote, stages: [
    stage('record-input', '공백 있는 인자 전달', '정상 입력의 시작입니다. compact constructor의 email·displayName은 생성자 매개변수이며 아직 최종 필드 값이 아닙니다.', 'record', recordInput + ';', [['매개변수 email', '" user@example.com "'], ['매개변수 displayName', '"Mina"'], ['record 필드', '아직 최종 값 저장 전']]),
    stage('record-email', 'email 매개변수 정규화', 'trim한 값을 email 매개변수에 다시 대입했습니다. 필드에 직접 대입한 것이 아닙니다.', 'record', 'email = email == null ? "" : email.trim();', [['매개변수 email', 'user@example.com'], ['매개변수 displayName', 'Mina'], ['record 필드', '아직 최종 값 저장 전']]),
    stage('record-name', 'displayName 매개변수 정규화', 'displayName도 매개변수 값을 정리합니다. 원문 입력 Mina에는 앞뒤 공백이 없어 결과가 같습니다.', 'record', 'displayName = displayName == null ? "" : displayName.trim();', [['매개변수 email', 'user@example.com'], ['매개변수 displayName', 'Mina'], ['record 필드', '아직 최종 값 저장 전']]),
    stage('record-validated', '본문의 검증 통과', '정규화한 매개변수를 검사합니다. email에 @가 있고 displayName이 비어 있지 않아 정상 종료로 진행합니다.', 'record', 'if (!email.contains("@")) throw new IllegalArgumentException("email is invalid");\nif (displayName.isBlank()) throw new IllegalArgumentException("displayName is required");', [['검증', '두 검사 통과'], ['매개변수 email', 'user@example.com'], ['record 필드', '본문 안 · 아직 최종 값 저장 전']], { active: [0, 1] }),
    stage('record-fields', '본문 정상 종료 후 필드 저장', '본문을 마친 뒤 Java가 정규화한 매개변수를 대응하는 final 필드에 저장합니다. 이제 생성 표현식이 정상 반환하고 println이 record를 출력합니다.', 'record', '// compact constructor 본문 정상 종료 후 암시적 필드 초기화\nSystem.out.println(' + recordInput + ');', [['필드 email', 'user@example.com'], ['필드 displayName', 'Mina'], ['반환·출력', 'SignupRequest[email=user@example.com, displayName=Mina]']], { active: [0], stdout: 'SignupRequest[email=user@example.com, displayName=Mina]' }),
    stage('record-bad', '다른 입력 bad는 예외', '정상 객체와 별개의 원문 호출입니다. email=bad에는 @가 없으므로 본문 검증이 예외로 끝나고 catch가 메시지를 출력합니다.', 'record', 'try { new SignupRequest("bad", "Mina"); }\ncatch (IllegalArgumentException e) { System.out.println(e.getMessage()); }', [['이번 매개변수 email', 'bad'], ['검증 결과', 'IllegalArgumentException: email is invalid'], ['필드 최종 초기화·정상 반환', '도달하지 않음'], ['displayName.isBlank() 검사', '도달하지 않음'], ['catch 출력', 'email is invalid']], { stdout: 'email is invalid', active: [0, 1] }),
  ] },
];

// 아래 주제는 원문을 보완하는 독립 추가 실험이다. 기존 CreationDemo와 객체·값을 섞지 않는다.
const lombokSource = '독립 추가 실험 · P04LombokProof · Lombok 1.18.46 / JDK 21 · 12개 확인';
const constructorSource = '독립 추가 실험 · Constructor.verification / P04ConstructorProof · JDK 21';
const springSource = '독립 추가 실험 · P04SpringProof · Spring 7.0.9 / JDK 21 · 직접 Java 호출';
const extraOutput = (stdout, extra = {}) => ({ stdout, outputLabel: '추가 실험 검증 출력 · 원문 실행 출력과 별개', ...extra });
const fieldsDeclaration = '@RequiredArgsConstructor @AllArgsConstructor\nstatic class Fields {\n    final Gateway gateway;\n    @NonNull String name;\n    int retries;\n    final int fixed = 20;\n    static int shared;\n}';
const beforeSuperCode = 'class Base { Base(int n) {} }\nclass BeforeSuper21 extends Base {\n    BeforeSuper21(int n) {\n        if (n < 0) throw new IllegalArgumentException();\n        super(n);\n    }\n}';
P04_LESSONS.push(
  { id: 'default-constructor', question: 'new User()는 언제 쓸 수 있을까?', source: constructorSource, note: '세 선언은 서로 독립된 추가 컴파일 실험입니다. 원문의 User에는 name 객체 필드가 없으며 guest는 생성자 호출의 매개변수 값입니다. 별도 MissingFinal 실험은 final String name을 대입하지 않는 생성자를 컴파일 거부했습니다. 이 필드를 User에 추가한 것은 아닙니다.', stages: [
    stage('default-implicit', '생성자 선언이 없을 때', '추가 실험의 빈 User에는 생성자가 선언돼 있지 않습니다. 컴파일러가 기본 무인자 생성자를 제공해 new User()가 컴파일됩니다.', 'default-constructor', 'class User {}\n// 별도 호출 코드\nnew User();', [['독립 선언', '생성자 선언 없음'], ['기본 생성자', '컴파일러 제공 User()'], ['JDK 21 확인', 'implicitNoArgCompiles = true'], ['객체 필드', '이 예제에 선언 없음']], { active: [0, 2] }),
    stage('default-missing', 'String 생성자만 있으면', '다른 독립 선언입니다. User(String name)을 직접 썼으므로 컴파일러가 User()를 추가하지 않습니다. 잘못된 호출은 실행 이전에 거부됩니다.', 'default-constructor', 'class User { User(String name) {} }\nclass MissingNoArg { User value = new User(); }', [['직접 선언', 'User(String name)'], ['호출 인자', '없음'], ['요구 인자', 'String'], ['JDK 21 결과', 'MissingNoArg 컴파일 거부 · 실행 아님']], { active: [1] }),
    stage('default-explicit', '무인자 경로를 직접 위임', '원문처럼 User()를 명시하고 this("guest")로 User(String name)에 위임합니다. 공통 생성 경로를 호출하며 name 필드를 저장했다는 뜻은 아닙니다.', 'default-constructor', 'class User {\n    User(String name) { /* 검증 */ }\n    User() { this("guest"); }\n}', [['호출 경로', 'new User() → User() → User(String name)'], ['위임 매개변수 name', 'guest'], ['JDK 21 확인', 'explicitThisDelegationCompiles = true'], ['객체 필드', '이 예제에 선언 없음']], { active: [2] }),
  ] },
  { id: 'override-constructor', question: '부모 생성자가 자식 메서드를 부르면 어떤 값일까?', source: constructorSource, note: '원문의 CreationDemo와 별개의 P04ConstructorProof입니다. 이 추가 Parent에는 inspect 호출이 있고 Child에는 label 필드가 있습니다. 원문의 Parent.marker·Child.marker 예제에 이 코드를 섞지 않습니다. 생성자에서 재정의 가능한 메서드를 부르면 아직 초기화되지 않은 자식 상태를 읽을 수 있습니다.', stages: [
    stage('override-parent', '부모 본문에서 재정의 호출', '추가 Parent()가 inspect()를 호출하면 실제 Child.inspect()가 실행됩니다. 자식의 label 초기식은 아직 실행 전이라 null을 읽었습니다.', 'override-constructor', 'static class Parent {\n    Parent() { inspect(); }\n    void inspect() {}\n}\n// 추가 Child.inspect() 내부\nseenDuringParent = label;', [['독립 추가 객체', 'P04ConstructorProof.Child'], ['실제 호출', 'Child.inspect() · 1회'], ['그때 Child.label', 'null'], ['기록한 seenDuringParent', 'null']], extraOutput('parent constructor called child override: true\nchild label during parent constructor: null', { active: [1, 5] })),
    stage('override-ready', '자식 초기화 완료 뒤', '부모 생성자가 돌아온 다음 자식의 label 초기식이 실행됩니다. new Child()가 완료된 뒤에는 label=ready이지만 앞서 기록한 seenDuringParent는 null입니다.', 'override-constructor', 'static class Child extends Parent {\n    String label = "ready";\n    @Override void inspect() {\n        invoked = true;\n        calls++;\n        seenDuringParent = label;\n    }\n}', [['생성 완료 Child.label', 'ready'], ['앞서 기록한 seenDuringParent', 'null'], ['inspect 호출 횟수', '1'], ['원문 marker 예제와 관계', '별도 예제']], extraOutput('child label after construction: ready', { active: [1] })),
  ] },
  { id: 'lombok-fields', question: 'Lombok 생성자는 어떤 필드를 인자로 받을까?', source: lombokSource, note: 'Fields는 독립 추가 fixture입니다. 원문의 AllArgs를 모든 필드라고 줄여 읽기 전에, 실제 생성자 시그니처를 확인합니다. 이 예제에서는 선언 시 초기화한 final fixed와 static shared가 두 생성자의 인자에서 제외됐습니다. final은 null 검증을 뜻하지 않습니다.', stages: [
    stage('lombok-required', 'required는 두 인자', '미초기화 final Gateway gateway와 @NonNull String name이 required 생성자 인자입니다. 일반 int retries는 required 인자에 들지 않습니다.', 'lombok-fields', fieldsDeclaration + '\n// 확인된 생성자 시그니처: Fields(Gateway, String)', [['추가 클래스', 'P04LombokProof.Fields'], ['required 인자', 'Gateway gateway / String name'], ['일반 필드 retries', 'required 인자 제외'], ['fixed / shared', '초기화 final / static · 인자 제외']], extraOutput('Required: 미초기화 final과 NonNull 두 인자', { active: [2, 3, 8] })),
    stage('lombok-allargs', 'allargs는 retries도 포함', 'allargs 시그니처에는 일반 int retries까지 들어갑니다. new Fields(gateway, "Mina", 3) 이후 retries는 3이고 선언에서 초기화한 final fixed는 20입니다.', 'lombok-fields', 'Fields all = new Fields(new Gateway(), "Mina", 3);\n// Fields(Gateway, String, int)\n// final int fixed = 20;\n// static int shared;', [['allargs 인자', 'Gateway gateway / String name / int retries'], ['all.retries', '3'], ['all.fixed', '20'], ['fixed / shared', 'allargs 인자 제외']], extraOutput('AllArgs: retries도 포함, 초기화 final과 static은 제외\nAllArgs 입력과 선언된 final 기본값 유지')),
    stage('lombok-null', 'final과 NonNull은 다르다', '서로 독립된 두 호출입니다. gateway에는 final만 있어 null을 받을 수 있습니다. name에는 @NonNull이 있어 null을 넘기면 NullPointerException으로 거부됩니다.', 'lombok-fields', 'Fields nullable = new Fields(null, "Mina");\n// 별도 호출: name에 null\nnew Fields(new Gateway(), null);', [['첫 호출 gateway', 'null 허용 · nullable.gateway == null'], ['첫 호출 name', 'Mina'], ['별도 둘째 호출 name', 'null → NullPointerException'], ['null 거부의 근거', '@NonNull name · final만으로는 거부하지 않음']], extraOutput('final만으로 null 인자를 거부하지 않음\nNonNull 이름은 생성자에서 null 거부', { active: [0, 2] })),
  ] },
  { id: 'builder-default', question: '필드 초기식 20이 Builder 기본값도 될까?', source: lombokSource, note: '원문 수동 Order.Builder와 별개의 PlainConfig·DefaultConfig 추가 실험입니다. 세 호출은 서로 독립된 생성입니다. Lombok 1.18.46 annotation processor로 생성한 코드를 JDK 21에서 실행했습니다.', stages: [
    stage('builder-default-plain', '초기식만 있으면 생략 값 0', 'PlainConfig에는 limit = 20이 선언돼 있지만 @Builder.Default는 없습니다. builder에서 limit를 생략한 결과의 limit는 0이었습니다.', 'builder-default', '@Builder static class PlainConfig { int limit = 20; }\nPlainConfig.builder().build();', [['별도 타입', 'PlainConfig'], ['선언 초기식', '20'], ['Builder 입력', 'limit 생략'], ['생성 결과 limit', '0']], extraOutput('Builder: Default 없는 선언 초기값20은 builder 기본값이 아님', { active: [0, 1] })),
    stage('builder-default-omitted', 'Default면 생략 값 20', '별도 DefaultConfig의 필드에 @Builder.Default를 붙였습니다. limit 입력을 생략하면 기본값 20이 적용됩니다.', 'builder-default', '@Builder static class DefaultConfig {\n    @Builder.Default int limit = 20;\n}\nDefaultConfig.builder().build();', [['별도 타입', 'DefaultConfig'], ['필드 설정', '@Builder.Default'], ['Builder 입력', 'limit 생략'], ['생성 결과 limit', '20']], extraOutput('Builder.Default: 생략 입력은20', { active: [1, 3] })),
    stage('builder-default-explicit', '명시한 값 7이 우선', '새 DefaultConfig builder에 limit(7)을 명시했습니다. 선언 기본값 20보다 이 호출의 명시 입력 7이 우선합니다.', 'builder-default', 'DefaultConfig.builder().limit(7).build();', [['별도 새 호출', 'DefaultConfig builder'], ['선언 기본값', '20'], ['명시 입력', '7'], ['생성 결과 limit', '7']], extraOutput('Builder.Default: 명시 입력7 우선')),
  ] },
  { id: 'builder-target', question: '@Builder를 어느 생성 경로에 붙여야 할까?', source: '독립 추가 실험 · Constructor.verification + P04LombokProof · Lombok 1.18.46 / JDK 21', note: 'ExplicitBuilder와 Targeted는 서로 다른 추가 클래스입니다. 기존 무인자 생성자가 있는 모든 클래스가 Builder를 쓸 수 없다는 뜻이 아닙니다. 생성 대상의 인자·검증 경로를 일치시켜야 합니다. 컴파일 실패와 실행 중 필수값 거부를 구분합니다.', stages: [
    stage('builder-target-mismatch', '클래스 대상과 생성자 불일치', '추가 ExplicitBuilder에는 클래스 수준 @Builder와 직접 작성한 무인자 생성자만 있습니다. builder가 요구하는 String 생성 경로가 없어 컴파일 거부됐습니다.', 'builder-target', '@lombok.Builder class ExplicitBuilder {\n    String name;\n    ExplicitBuilder() { name = "guest"; }\n}', [['실제 선언', 'ExplicitBuilder()'], ['Builder가 호출하려는 인자', 'String name'], ['JDK 21 결과', 'ExplicitBuilder 컴파일 거부'], ['객체 생성·실행', '수행되지 않음']], { active: [0, 2] }),
    stage('builder-target-constructor', '검증하는 생성자를 대상으로', '별도 Targeted(String name)에 @Builder를 붙였습니다. name("Mina")는 이 생성자를 거쳐 저장됩니다. 또 다른 새 builder에서 name을 생략하면 같은 생성자의 검증이 예외를 던집니다.', 'builder-target', '@Builder Targeted(String name) {\n    if (name == null) throw new IllegalArgumentException("name is required");\n    this.name = name;\n}\nTargeted.builder().name("Mina").build();\n// 독립 누락 호출: Targeted.builder().build();', [['생성 대상', 'Targeted(String name)'], ['정상 호출 결과 name', 'Mina'], ['독립 생략 호출', 'name=null → IllegalArgumentException: name is required'], ['검증 위치', '실제 Targeted 생성자']], extraOutput('생성자 대상 Builder가 실제 검증 경로 사용\n생성자 대상 Builder: 빠진 필수 이름 거부', { active: [0, 1, 4] })),
  ] },
  { id: 'noargs-force', question: 'force로 생성하면 final 필드도 유효할까?', source: lombokSource, note: 'Forced는 Entity가 아닌 독립 추가 fixture입니다. @NoArgsConstructor(force = true)가 생성 가능한 상태를 만들었어도 도메인 유효성을 보장하지 않습니다. 실제 JPA Entity 생성이나 저장을 실행한 실험이 아닙니다.', stages: [
    stage('force-definition', '인자 없이 만들 경로 생성', '추가 Forced에는 @NonNull final String name과 초기화되지 않은 final int retries가 있습니다. force=true가 무인자 생성 경로를 생성하도록 요청합니다.', 'noargs-force', '@NoArgsConstructor(force = true)\nstatic class Forced {\n    @NonNull final String name;\n    final int retries;\n}', [['추가 타입', 'P04LombokProof.Forced'], ['직접 선언한 필드', '@NonNull final String name / final int retries'], ['Lombok 생성 경로', 'Forced()'], ['현재 장면', '선언 확인 · 아직 호출 결과를 읽는 장면 아님']], { active: [0, 2, 3] }),
    stage('force-result', '생성 뒤 null과 0', 'new Forced()가 정상 완료됐지만 name은 null, retries는 0입니다. force 생성자는 @NonNull final 필드도 null로 둘 수 있으므로 생성 성공을 유효한 객체라는 뜻으로 읽지 않습니다.', 'noargs-force', 'Forced forced = new Forced();\n// 확인: forced.name == null\n// 확인: forced.retries == 0', [['생성 완료 forced.name', 'null'], ['생성 완료 forced.retries', '0'], ['@NonNull 위반 값', 'force 생성 경로에서 null 가능'], ['도메인 유효성', '보장하지 않음']], extraOutput('NoArgs force: NonNull final도 null 가능\nNoArgs force: final int는0')),
  ] },
  { id: 'constructor-injection', question: 'Spring은 생성자에 어떤 객체를 전달할까?', source: springSource, note: '원문 Java 소스 파일 네 개 OrderRequest·OrderIdGenerator·OrderService·OrderController를 컴파일하고 세 Bean을 AnnotationConfigApplicationContext에 명시 등록한 추가 실험입니다. G1·S1은 ==로 확인한 객체 동일성을 나타내는 설명용 기호이며 메모리 주소가 아닙니다. Boot 앱·HTTP·JPA·Java 25는 미실행입니다. 단일 생성자의 @Autowired 생략과 의존성 연결을 확인한 범위입니다.', stages: [
    stage('injection-generator', 'Service에 같은 generator 주입', 'context.refresh() 뒤 컨텍스트에서 얻은 generator와 Service의 idGenerator 필드를 ==로 비교했습니다. Lombok이 만든 단일 생성자로 같은 객체가 전달됐습니다.', 'constructor-injection', 'context.register(OrderIdGenerator.class, OrderService.class, OrderController.class);\ncontext.refresh();\n// 원문 OrderService\nprivate final OrderIdGenerator idGenerator;', [['컨텍스트 generator', 'G1 · 설명용 동일성 기호'], ['Service.idGenerator', '같은 G1'], ['동일성 검사', 'generatorField.get(service) == generator → true'], ['Service 생성자 개수', '1']], extraOutput('Lombok 단일 생성자: 컨텍스트의 같은 generator 주입\nOrderService 생성자 한 개', { active: [0, 1, 3] })),
    stage('injection-service', 'Controller에 같은 Service 주입', '같은 컨텍스트에서 얻은 Service와 Controller의 service 필드도 ==로 같았습니다. Controller는 원문에 직접 작성한 단일 생성자를 사용합니다.', 'constructor-injection', 'private final OrderService service;\nOrderController(OrderService service) { this.service = service; }', [['컨텍스트 Service', 'S1 · 설명용 동일성 기호'], ['Controller.service', '같은 S1'], ['S1.idGenerator', '앞서 확인한 G1'], ['동일성 검사', 'serviceField.get(controller) == service → true']], extraOutput('명시한 단일 생성자: 컨텍스트의 같은 service 주입', { active: [0, 1] })),
    stage('injection-direct-call', 'Java 메서드로 직접 호출', 'controller.create에 공백 있는 이름과 수량 2의 OrderRequest를 직접 전달했습니다. record가 이름을 Mina로 정리하고 원문 Service가 생성한 id는 UUID.fromString으로 확인했습니다.', 'constructor-injection', 'OrderResponse response = controller.create(new OrderRequest(" Mina ", 2));\nUUID.fromString(response.id());', [['호출 방식', '직접 Java 메서드 · HTTP 요청 아님'], ['response.customerName()', 'Mina'], ['response.quantity()', '2'], ['response.id()', '실행 때 생성된 UUID 형식 · 고정 문자열 미제시']], extraOutput('Java 메서드 직접 호출: 정규화한 Mina 반환\nJava 메서드 직접 호출: 수량2 반환\nJava 메서드 직접 호출: 생성된 id는 유효 UUID', { active: [0, 1] })),
    stage('injection-missing', '별도 컨텍스트의 의존성 누락', '정상 컨텍스트와 독립된 실패 실험입니다. OrderService만 등록하고 generator Bean을 등록하지 않으면 refresh가 실패합니다. HTTP 응답 상태를 확인한 실험이 아닙니다.', 'injection-missing', '// 새 AnnotationConfigApplicationContext의 독립 실험\ncontext.register(OrderService.class);\ncontext.refresh();', [['이번 등록', 'OrderService만'], ['누락', 'OrderIdGenerator Bean'], ['실제 실패', 'BeansException 원인 체인에 NoSuchBeanDefinitionException'], ['결과', 'Service 생성 실패 · HTTP 상태 확인 없음']], extraOutput('generator Bean 누락은 Service 생성 실패', { active: [1, 2] })),
  ] },
  { id: 'dto-entity', question: '요청 record와 JPA Entity의 생성 규칙은 같을까?', source: '원문 OrderRequest / Entity 생성 규칙 · 추가 P04SpringProof의 record 검증', note: 'OrderRequest 검증만 독립 Spring 7.0.9 / JDK 21 추가 실험에서 실행했습니다. Entity는 원문 규칙과 상징적인 생성자 선언을 비교하는 장면입니다. JPA 공급자·Entity 생성·DB 행·SQL은 미실행이며 이 화면에 임의의 Entity 필드나 행을 만들지 않습니다.', stages: [
    stage('dto-record', '요청 DTO는 생성할 때 검증', '원문 OrderRequest는 입력 이름을 trim한 뒤 빈 이름이나 1 미만 수량을 거부합니다. 추가 실험에서 Mina·0과 공백 이름·2를 각각 직접 생성해 예외를 확인했습니다.', 'dto-invalid', 'public OrderRequest {\n    customerName = customerName == null ? "" : customerName.trim();\n    if (customerName.isBlank() || quantity < 1) throw new IllegalArgumentException("invalid order");\n}', [['원문 타입', 'OrderRequest record'], ['독립 입력 A', 'customerName=Mina / quantity=0 → IllegalArgumentException'], ['독립 입력 B', 'customerName=공백 / quantity=2 → IllegalArgumentException'], ['검증 메시지', 'invalid order']], extraOutput('수량0은 record 생성자에서 거부\n공백 이름은 record 생성자에서 거부', { active: [1, 2] })),
    stage('entity-rule', 'Entity는 별도 무인자 규칙', '원문은 JPA Entity에 public 또는 protected 무인자 생성자가 필요하다고 설명합니다. 전달용 DTO를 그대로 Entity에 바인딩하지 않고 역할에 맞는 생성 경로를 구분합니다.', 'dto-entity', '// 원문 규칙의 상징적 타입 · JPA 미실행\nclass Entity {\n    protected Entity() {}\n}', [['표현 범위', '상징적 타입 Entity · 실제 Entity 구현 아님'], ['원문 생성자 접근 규칙', 'public 또는 protected 무인자'], ['역할', '영속성 공급자가 접근할 생성 경로'], ['실행 증거', 'JPA 미실행 · DB 행·SQL 없음']], { active: [0, 2] }),
  ] },
  { id: 'java25-boundary', question: 'super 앞의 검증 코드는 Java 버전에 따라 다를까?', source: '추가 BeforeSuper21 javac 검사 / 원문 Java 25 JEP 513 설명', note: '같은 BeforeSuper21 코드를 JDK 21에서 컴파일 거부한 것만 실행 증거로 확인했습니다. Java 25 동작은 원문 설명이며 미실행입니다. 제한된 생성자 전처리 허용을 임의의 this 접근이나 모든 코드가 허용된다는 뜻으로 확대하지 않습니다.', stages: [
    stage('java21-reject', 'JDK 21에서는 컴파일 거부', '추가 BeforeSuper21은 매개변수 n을 검사한 다음 super(n)을 호출합니다. 실제 JDK 21 javac는 super 호출이 생성자 첫 문장이어야 한다고 거부했습니다.', 'java25-boundary', beforeSuperCode, [['추가 타입', 'BeforeSuper21 extends Base'], ['검사 환경', 'JDK 21.0.6'], ['컴파일 결과', '거부 · call.must.be.first.stmt.in.ctor: super'], ['실행 결과', '컴파일 실패로 실행 없음']], { active: [3, 4] }),
    stage('java25-described', 'Java 25는 제한된 전처리 허용', '원문 JEP 513 설명에서는 super 앞의 제한된 인자 검증을 허용합니다. 앞 장면과 같은 코드를 비교하지만 이 작업에서는 Java 25로 컴파일하거나 실행하지 않았습니다.', 'java25-boundary', beforeSuperCode, [['비교 대상', '동일 BeforeSuper21 소스'], ['원문 설명', 'Java 25 · super 앞 제한된 인자 검증 허용'], ['증거 구분', 'Java 25 미실행 · 원문 규칙 설명'], ['범위', '임의 this 접근·모든 코드 허용으로 일반화하지 않음']], { active: [3, 4] }),
  ] },
);
