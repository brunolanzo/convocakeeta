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
  let todosJogadores = [];

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

  function renderBusca(query) {
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
             ${!jaSelecionado && !prazoExpirado ? `onclick="adicionarJogador('${j.nome.replace(/'/g, "\\'")}')"` : ''}>
          <div>
            <span class="font-medium">${j.nome}</span>
            <span class="text-xs text-gray-500 ml-2">${j.posicao} - ${j.clube}</span>
          </div>
          ${jaSelecionado ? '<span class="text-green-600 text-sm">Selecionado</span>' : ''}
        </div>
      `;
    }).join('');
  }

  function renderSelecionados() {
    if (!listaDiv) return;
    listaDiv.innerHTML = selecionados.map((nome, i) => `
      <div class="jogador-selecionado">
        <span><span class="text-gray-400 text-sm mr-2">${i + 1}.</span>${nome}</span>
        ${!prazoExpirado ? `<span class="remover" onclick="removerJogador('${nome.replace(/'/g, "\\'")}')">&times;</span>` : ''}
      </div>
    `).join('');

    if (contagemEl) {
      contagemEl.textContent = `${selecionados.length}/26`;
      contagemEl.className = `text-sm font-bold px-3 py-1 rounded-full ${
        selecionados.length === 26 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
      }`;
    }

    if (hiddenInput) {
      hiddenInput.value = JSON.stringify(selecionados);
    }

    if (btnSalvar) {
      btnSalvar.disabled = selecionados.length !== 26;
    }
  }

  window.adicionarJogador = function(nome) {
    if (selecionados.includes(nome) || selecionados.length >= 26) return;
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

  // Renderizar lista inicial
  renderSelecionados();
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
        selecionados.length === 26 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
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
