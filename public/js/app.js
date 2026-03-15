// ========== Scroll Reveal (IntersectionObserver) ==========
(function() {
  const els = document.querySelectorAll('.animate-fade-in-up');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  els.forEach(el => observer.observe(el));
})();

// ========== Countdown na Home ==========
const countdownEl = document.getElementById('countdown');
if (countdownEl) {
  const prazo = new Date(countdownEl.dataset.prazo);

  function updateCountdown() {
    const now = new Date();
    const diff = prazo - now;

    if (diff <= 0) {
      countdownEl.textContent = 'Prazo encerrado!';
      countdownEl.classList.add('text-red-600');
      return;
    }

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diff % (1000 * 60)) / 1000);

    countdownEl.textContent = `${dias}d ${horas}h ${minutos}m ${segundos}s`;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// ========== Formulário de Apostas ==========
const apostaForm = document.getElementById('apostaForm');
if (apostaForm && typeof jogadoresSelecionados !== 'undefined') {
  const selecionados = [...jogadoresSelecionados];
  const buscaInput = document.getElementById('buscaJogador');
  const resultadosDiv = document.getElementById('resultadosBusca');
  const listaDiv = document.getElementById('listaSelecionados');
  const contagemEl = document.getElementById('contagem');
  const hiddenInput = document.getElementById('jogadoresInput');
  const btnSalvar = document.getElementById('btnSalvar');
  const limiteGoleirosEl = document.getElementById('limiteGoleiros');
  let todosJogadores = [];
  let filtroPosicao = 'todas';

  const MAX_GOLEIROS = 3;

  const ordemPosicoes = ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante'];
  const coresPosicao = {
    'Goleiro': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
    'Zagueiro': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-400' },
    'Lateral': { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', dot: 'bg-cyan-400' },
    'Volante': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-400' },
    'Meia': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-400' },
    'Atacante': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-400' },
  };

  function getPosicao(nome) {
    const j = todosJogadores.find(jg => jg.nome === nome);
    return j ? j.posicao : 'Outro';
  }

  function contarGoleirosSelecionados() {
    return selecionados.filter(nome => getPosicao(nome) === 'Goleiro').length;
  }

  // Carregar lista de jogadores
  fetch('/api/jogadores')
    .then(r => r.json())
    .then(data => {
      todosJogadores = data;
      renderBusca('');
      renderSelecionados();
    });

  if (buscaInput) {
    buscaInput.addEventListener('input', () => {
      renderBusca(buscaInput.value);
    });
  }

  // Filtros de posição
  document.querySelectorAll('.filtro-posicao').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filtro-posicao').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filtroPosicao = btn.dataset.posicao;
      renderBusca(buscaInput ? buscaInput.value : '');
    });
  });

  function renderBusca(query) {
    if (!resultadosDiv) return;
    const q = query.toLowerCase();
    let filtrados = todosJogadores.filter(j =>
      j.nome.toLowerCase().includes(q) ||
      j.posicao.toLowerCase().includes(q) ||
      j.clube.toLowerCase().includes(q)
    );

    if (filtroPosicao !== 'todas') {
      filtrados = filtrados.filter(j => j.posicao === filtroPosicao);
    }

    const goleirosCount = contarGoleirosSelecionados();

    // Filtrar goleiros não selecionados quando limite atingido
    if (goleirosCount >= MAX_GOLEIROS) {
      filtrados = filtrados.filter(j => j.posicao !== 'Goleiro' || selecionados.includes(j.nome));
    }

    resultadosDiv.innerHTML = filtrados.map(j => {
      const jaSelecionado = selecionados.includes(j.nome);
      const cores = coresPosicao[j.posicao] || { dot: 'bg-gray-400' };

      return `
        <div class="jogador-item ${jaSelecionado ? 'selecionado' : ''}"
             ${!jaSelecionado && !prazoExpirado ? `onclick="adicionarJogador('${j.nome.replace(/'/g, "\\'")}')"` : ''}>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full ${cores.dot} flex-shrink-0"></span>
            <span class="font-medium">${j.nome}</span>
            <span class="text-xs text-gray-500">${j.posicao} - ${j.clube}</span>
          </div>
          ${jaSelecionado ? '<span class="text-copa-teal text-xs font-semibold">Selecionado</span>' : ''}
        </div>
      `;
    }).join('');
  }

  function renderSelecionados() {
    if (!listaDiv) return;

    // Agrupar por posição
    const grupos = {};
    for (const nome of selecionados) {
      const pos = getPosicao(nome);
      if (!grupos[pos]) grupos[pos] = [];
      grupos[pos].push(nome);
    }

    let html = '';
    for (const pos of ordemPosicoes) {
      const jogadores = grupos[pos];
      if (!jogadores || jogadores.length === 0) continue;

      const cores = coresPosicao[pos] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-400' };
      const limiteInfo = pos === 'Goleiro' ? ` (max ${MAX_GOLEIROS})` : '';

      html += `
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="w-2.5 h-2.5 rounded-full ${cores.dot}"></span>
            <span class="text-xs font-bold uppercase tracking-wider ${cores.text}">${pos}s${limiteInfo}</span>
            <span class="text-xs text-gray-400">(${jogadores.length})</span>
          </div>
          <div class="space-y-1">
            ${jogadores.map(nome => `
              <div class="jogador-selecionado">
                <div class="flex items-center gap-2">
                  <span class="text-sm">${nome}</span>
                </div>
                ${!prazoExpirado ? `<span class="remover" onclick="removerJogador('${nome.replace(/'/g, "\\'")}')">&times;</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Jogadores sem posição conhecida
    const outros = selecionados.filter(nome => !ordemPosicoes.includes(getPosicao(nome)));
    if (outros.length > 0) {
      html += `
        <div>
          <div class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Outros (${outros.length})</div>
          <div class="space-y-1">
            ${outros.map(nome => `
              <div class="jogador-selecionado">
                <span class="text-sm">${nome}</span>
                ${!prazoExpirado ? `<span class="remover" onclick="removerJogador('${nome.replace(/'/g, "\\'")}')">&times;</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (selecionados.length === 0) {
      html = '<p class="text-gray-400 text-sm text-center py-4">Nenhum jogador selecionado ainda.</p>';
    }

    listaDiv.innerHTML = html;

    if (contagemEl) {
      contagemEl.textContent = `${selecionados.length}/26`;
      contagemEl.className = `text-sm font-bold px-3 py-1 rounded-full ${
        selecionados.length === 26 ? 'badge-pago' : 'bg-amber-50 border border-amber-200 text-amber-700'
      }`;
    }

    if (hiddenInput) {
      hiddenInput.value = JSON.stringify(selecionados);
    }

    if (btnSalvar) {
      btnSalvar.disabled = selecionados.length !== 26;
    }

    // Mostrar/esconder aviso de limite de goleiros
    if (limiteGoleirosEl) {
      limiteGoleirosEl.classList.toggle('hidden', contarGoleirosSelecionados() < MAX_GOLEIROS);
    }
  }

  window.adicionarJogador = function(nome) {
    if (selecionados.includes(nome) || selecionados.length >= 26) return;

    // Verificar limite de goleiros
    const j = todosJogadores.find(jg => jg.nome === nome);
    if (j && j.posicao === 'Goleiro' && contarGoleirosSelecionados() >= MAX_GOLEIROS) return;

    selecionados.push(nome);
    renderBusca(buscaInput ? buscaInput.value : '');
    renderSelecionados();
  };

  window.removerJogador = function(nome) {
    const idx = selecionados.indexOf(nome);
    if (idx > -1) {
      selecionados.splice(idx, 1);
      renderBusca(buscaInput ? buscaInput.value : '');
      renderSelecionados();
    }
  };

  renderSelecionados();
}

// ========== Formulário de Contato (Sugerir jogador) ==========
const btnAbrirContato = document.getElementById('btnAbrirContato');
const formContato = document.getElementById('formContato');
const contatoForm = document.getElementById('contatoForm');

if (btnAbrirContato && formContato) {
  btnAbrirContato.addEventListener('click', () => {
    formContato.classList.toggle('hidden');
  });
}

if (contatoForm) {
  contatoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(contatoForm);
    const data = Object.fromEntries(formData);

    document.getElementById('contatoSucesso').classList.add('hidden');
    document.getElementById('contatoErro').classList.add('hidden');

    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        document.getElementById('contatoSucesso').classList.remove('hidden');
        contatoForm.reset();
      } else {
        document.getElementById('contatoErro').classList.remove('hidden');
      }
    } catch {
      document.getElementById('contatoErro').classList.remove('hidden');
    }
  });
}

// ========== Formulário de Convocação (Admin) ==========
const convocacaoForm = document.getElementById('convocacaoForm');
if (convocacaoForm && typeof jogadoresConvocadosAdmin !== 'undefined') {
  const selecionados = [...jogadoresConvocadosAdmin];
  const buscaInput = document.getElementById('buscaConvocacao');
  const resultadosDiv = document.getElementById('resultadosBuscaConvocacao');
  const listaDiv = document.getElementById('listaConvocados');
  const contagemEl = document.getElementById('contagemConvocacao');
  const hiddenInput = document.getElementById('jogadoresConvocadosInput');
  const btnSalvar = document.getElementById('btnSalvarConvocacao');
  let todosJogadores = [];

  fetch('/api/jogadores')
    .then(r => r.json())
    .then(data => {
      todosJogadores = data;
      renderBuscaConv('');
      renderSelecionadosConv();
    });

  if (buscaInput) {
    buscaInput.addEventListener('input', () => {
      renderBuscaConv(buscaInput.value);
    });
  }

  function renderBuscaConv(query) {
    if (!resultadosDiv) return;
    const q = query.toLowerCase();
    const filtrados = todosJogadores.filter(j =>
      j.nome.toLowerCase().includes(q) ||
      j.posicao.toLowerCase().includes(q) ||
      j.clube.toLowerCase().includes(q)
    );

    resultadosDiv.innerHTML = filtrados.map(j => {
      const jaSelecionado = selecionados.includes(j.nome);
      return `
        <div class="jogador-item ${jaSelecionado ? 'selecionado' : ''}"
             ${!jaSelecionado ? `onclick="adicionarConvocado('${j.nome.replace(/'/g, "\\'")}')"` : ''}>
          <div>
            <span class="font-medium">${j.nome}</span>
            <span class="text-xs text-gray-500 ml-2">${j.posicao} - ${j.clube}</span>
          </div>
          ${jaSelecionado ? '<span class="text-green-600 text-sm">Selecionado</span>' : ''}
        </div>
      `;
    }).join('');
  }

  function renderSelecionadosConv() {
    if (!listaDiv) return;
    listaDiv.innerHTML = selecionados.map((nome, i) => `
      <div class="jogador-selecionado">
        <span><span class="text-gray-400 text-sm mr-2">${i + 1}.</span>${nome}</span>
        <span class="remover" onclick="removerConvocado('${nome.replace(/'/g, "\\'")}')">&times;</span>
      </div>
    `).join('');

    if (contagemEl) {
      contagemEl.textContent = `${selecionados.length}/26`;
      contagemEl.className = `text-sm font-bold px-3 py-1 rounded-full ${
        selecionados.length === 26 ? 'badge-pago' : 'bg-amber-50 border border-amber-200 text-amber-700'
      }`;
    }

    if (hiddenInput) {
      hiddenInput.value = JSON.stringify(selecionados);
    }

    if (btnSalvar) {
      btnSalvar.disabled = selecionados.length !== 26;
    }
  }

  window.adicionarConvocado = function(nome) {
    if (selecionados.includes(nome) || selecionados.length >= 26) return;
    selecionados.push(nome);
    renderBuscaConv(buscaInput ? buscaInput.value : '');
    renderSelecionadosConv();
  };

  window.removerConvocado = function(nome) {
    const idx = selecionados.indexOf(nome);
    if (idx > -1) {
      selecionados.splice(idx, 1);
      renderBuscaConv(buscaInput ? buscaInput.value : '');
      renderSelecionadosConv();
    }
  };

  renderSelecionadosConv();
}
