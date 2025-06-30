const inputBusca = document.getElementById('inputBusca');
const categorias = document.querySelectorAll('.categoria');
const lista = document.getElementById('freelancer-list');
const semResultado = document.getElementById('semResultado');
const loading = document.getElementById('loading');
const erro = document.getElementById('erro');
const tituloLista = document.getElementById('titulo-lista');

const btnBuscar = document.getElementById('btnBuscar');
const paginacao = document.getElementById('paginacao');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const paginaAtualSpan = document.getElementById('paginaAtual');
const totalPaginasSpan = document.getElementById('totalPaginas');

let categoriaAtiva = 'all';
let buscaAtiva = '';
let paginaAtual = 1;
const resultadosPorPagina = 10;
let totalPaginas = 1;

function capitalizar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function carregarFreelancers() {
  const busca = buscaAtiva;
  const categoria = categoriaAtiva;

  let url = `http://localhost:3000/freelancers?categoria=${categoria}&page=${paginaAtual}&limit=${resultadosPorPagina}`;
  if (busca) url += `&busca=${encodeURIComponent(busca)}`;

  lista.innerHTML = '';
  semResultado.style.display = 'none';
  erro.style.display = 'none';
  loading.style.display = 'block';
  paginacao.style.display = 'none';

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro na resposta');

    const json = await res.json();
    loading.style.display = 'none';

    const freelancers = json.data || json;
    const totalResultados = json.total || freelancers.length;

    if (freelancers.length === 0) {
      semResultado.style.display = 'block';
      atualizarTitulo(totalResultados);
      paginacao.style.display = 'none';
      return;
    }

    semResultado.style.display = 'none';

    freelancers.forEach(f => {
      const card = document.createElement('div');
      card.className = 'card';

      // Formata telefone só com números para wa.me
      const telefoneNum = f.telefone.replace(/\D/g, '');

      card.innerHTML = `
        <h3>${f.nome} - ${capitalizar(f.categoria)}</h3>
        <p>⭐ ${parseFloat(f.avaliacao).toFixed(1)} (${f.num_avaliacoes} avaliações)</p>
        <p class="descricao">${f.descricao || ''}</p>
        <button class="botao" onclick="window.open('https://wa.me/${telefoneNum}', '_blank', 'noopener,noreferrer')">Chamar no WhatsApp</button>
      `;
      lista.appendChild(card);
    });

    totalPaginas = Math.ceil(totalResultados / resultadosPorPagina);
    paginaAtualSpan.textContent = paginaAtual;
    totalPaginasSpan.textContent = totalPaginas;

    btnPrev.disabled = paginaAtual <= 1;
    btnNext.disabled = paginaAtual >= totalPaginas;
    paginacao.style.display = 'flex';

    atualizarTitulo(totalResultados);
  } catch (e) {
    loading.style.display = 'none';
    erro.style.display = 'block';
    paginacao.style.display = 'none';
    console.error('Erro ao carregar freelancers:', e);
  }
}

function atualizarTitulo(totalResultados = 0) {
  let titulo = 'Freelancers Encontrados';

  if (buscaAtiva && categoriaAtiva !== 'all') {
    titulo = `Resultados para "${buscaAtiva}" em ${capitalizar(categoriaAtiva)}`;
  } else if (buscaAtiva) {
    titulo = `Resultados para "${buscaAtiva}"`;
  } else if (categoriaAtiva !== 'all') {
    titulo = `Freelancers na categoria ${capitalizar(categoriaAtiva)}`;
  }

  if (totalResultados) {
    titulo += ` (${totalResultados})`;
  }

  tituloLista.textContent = titulo;
}

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Eventos
btnBuscar.addEventListener('click', () => {
  buscaAtiva = inputBusca.value.trim();
  paginaAtual = 1;
  carregarFreelancers();
});

inputBusca.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    btnBuscar.click();
  }
});

// Busca automática com debounce
inputBusca.addEventListener('input', debounce(() => {
  buscaAtiva = inputBusca.value.trim();
  paginaAtual = 1;
  carregarFreelancers();
}, 500));

categorias.forEach(cat => {
  cat.addEventListener('click', () => {
    categorias.forEach(c => c.classList.remove('active'));
    cat.classList.add('active');
    categoriaAtiva = cat.dataset.cat;
    paginaAtual = 1;
    carregarFreelancers();
  });
});

btnPrev.addEventListener('click', () => {
  if (paginaAtual > 1) {
    paginaAtual--;
    carregarFreelancers();
  }
});

btnNext.addEventListener('click', () => {
  if (paginaAtual < totalPaginas) {
    paginaAtual++;
    carregarFreelancers();
  }
});

// Carrega na inicialização
carregarFreelancers();
