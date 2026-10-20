document.querySelectorAll('.concept-focus').forEach((root) => {
  const show = (key) => {
    root.querySelectorAll('[data-concept-panel]').forEach((panel) => { panel.hidden = panel.dataset.conceptPanel !== key; });
    root.querySelectorAll('[data-concept-go]').forEach((button) => button.setAttribute('aria-current', button.dataset.conceptGo === key ? 'step' : 'false'));
  };
  root.querySelectorAll('[data-concept-go]').forEach((button) => button.addEventListener('click', () => show(button.dataset.conceptGo)));

  if (root.dataset.concept === 'S14') {
    const states = [
      ['없음', '없음', '아직 업무 요청 전입니다. DB와 broker 모두 바뀌지 않았습니다.', false],
      ['트랜잭션 안', '없음', 'DB 변경은 아직 commit 전입니다. 이때 롤백되면 업무 데이터도 남지 않습니다.', false],
      ['저장됨', '이벤트 없음', 'DB 커밋 뒤 발행 전에 앱이 멈추면 주문은 남고 이벤트는 사라질 수 있습니다.', true],
      ['저장됨', '발행 확인 중', '브로커의 발행 확인을 받기 전이라 전달 성공 여부를 별도로 확인해야 합니다.', true],
      ['저장됨', '브로커에 기록됨', '브로커에 발행됐습니다. 이것이 소비자의 업무 처리 완료를 뜻하지는 않습니다.', false]
    ];
    root.querySelectorAll('[data-event-time]').forEach((button) => button.addEventListener('click', () => {
      const [db, broker, message, alert] = states[Number(button.dataset.eventTime)];
      root.querySelectorAll('[data-event-time]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      root.querySelector('[data-event-db]').textContent = db;
      root.querySelector('[data-event-broker]').textContent = broker;
      const result = root.querySelector('[data-event-result]');
      result.textContent = message;
      result.classList.toggle('is-alert', alert);
    }));
  }
  if (root.dataset.concept === 'W23') {
    const loaded = new Set();
    let reads = 0;
    const key = root.querySelector('[data-cache-key]');
    const renderCache = (message) => {
      root.querySelector('[data-cache-state]').textContent = loaded.size ? `${loaded.size}개 키 저장` : '캐시 비어 있음';
      root.querySelector('[data-cache-entry]').textContent = loaded.size ? [...loaded].join(' · ') : '저장된 키가 없습니다.';
      root.querySelector('[data-cache-reads]').textContent = String(reads);
      root.querySelector('[data-cache-message]').textContent = message;
    };
    root.querySelector('[data-cache-request]').addEventListener('click', () => {
      if (loaded.has(key.value)) renderCache(`${key.value} 캐시 히트: DB를 다시 읽지 않고 사본을 반환합니다.`);
      else { loaded.add(key.value); reads++; renderCache(`${key.value} 캐시 미스: DB에서 읽어 로컬 캐시에 저장했습니다.`); }
    });
    root.querySelector('[data-cache-reset]').addEventListener('click', () => { loaded.clear(); reads = 0; renderCache('캐시와 설명용 DB 조회 횟수를 초기화했습니다.'); });
    const phases = {
      before: ['“옛 이름”', '“옛 이름”', '“옛 이름”', '변경 전에는 두 캐시와 DB가 같은 값을 보여 줍니다.'],
      now: ['“새 이름”', '“새 이름”', '“옛 이름”', 'A가 자신의 캐시를 비워도 B의 사본은 자동으로 바뀌지 않습니다. TTL은 오래된 사본이 남는 시간을 제한합니다.'],
      later: ['“새 이름”', '“새 이름”', '“새 이름”', 'B의 캐시가 만료된 뒤 다음 조회에서 원본을 읽으면 새 값을 받을 수 있습니다.']
    };
    root.querySelectorAll('[data-stale-phase]').forEach((button) => button.addEventListener('click', () => {
      const [a, db, b, message] = phases[button.dataset.stalePhase];
      root.querySelectorAll('[data-stale-phase]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      root.querySelector('[data-stale-a]').textContent = a;
      root.querySelector('[data-stale-db]').textContent = db;
      root.querySelector('[data-stale-b]').textContent = b;
      root.querySelector('[data-stale-message]').textContent = message;
    }));
  }
  if (root.dataset.concept === 'S12') {
    let role = 'user';
    const states = {
      anonymous: ['확인된 사용자 없음', '인가 전 인증 필요', '익명 요청은 먼저 신원을 확인해야 합니다.'],
      user: ['로그인한 사용자', '관리자 권한 없음', '일반 사용자는 인증됐지만 관리자 작업에는 접근할 수 없습니다.'],
      admin: ['로그인한 관리자', '관리자 권한 있음', '관리자는 인증과 관리자 작업의 인가를 모두 통과할 수 있습니다.']
    };
    root.querySelectorAll('[data-auth-role]').forEach((button) => button.addEventListener('click', () => {
      role = button.dataset.authRole;
      root.querySelectorAll('[data-auth-role]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      root.querySelector('[data-auth-identity]').textContent = states[role][0];
      root.querySelector('[data-auth-permission]').textContent = states[role][1];
      root.querySelector('[data-auth-result]').textContent = '선택한 사용자로 접근 결과를 확인하세요.';
      root.querySelector('[data-auth-result]').classList.remove('is-alert');
    }));
    root.querySelector('[data-auth-request]').addEventListener('click', () => {
      const result = root.querySelector('[data-auth-result]');
      result.textContent = states[role][2];
      result.classList.toggle('is-alert', role !== 'admin');
    });
  }
});
