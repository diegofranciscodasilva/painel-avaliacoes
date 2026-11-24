/*
 * Voz do Cliente: lógica do front-end
 * Carrega dados da API (ou fallback), renderiza indicadores,
 * gráfico, temas, filtros e o assistente de resposta.
 */
document.addEventListener('DOMContentLoaded', () => {
    const API = window.PAINEL_API_URL || 'http://localhost:5000/api';
    const $ = (id) => document.getElementById(id);

    // Estado da aplicação
    let state = { reviews: [], summary: null, topicFilter: '' };
    let currentReview = null;

    // ---------- Utilidades ----------
    const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&', '<': '<', '>': '>', '"': '&quot;', "'": '&#39;' }[c]));
    const SENT_LABEL = { positive: 'Positivo', neutral: 'Neutro', negative: 'Negativo' };
    const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
    const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
    const fmtMonth = (m) => { const [y, mo] = m.split('-'); return `${mo}/${y.slice(2)}`; };

    // ---------- Dados ----------
    async function loadData() {
        try {
            const res = await fetch(`${API}/reviews`);
            if (!res.ok) throw new Error('API indisponível');
            state = { ...state, ...(await res.json()) };
        } catch {
            state = { ...state, ...fallbackData() }; // modo demonstração sem back-end
            console.warn('Back-end offline: usando dados de demonstração.');
        }
        renderAll();
    }

    /** Dados mínimos para o front-end funcionar sozinho. */
    function fallbackData() {
        const reviews = [
            { id: 1, author: 'Marina S.', rating: 5, date: '2026-09-12', text: 'Atendimento excelente e café delicioso!', sentiment: 'positive', topics: ['atendimento', 'produto'] },
            { id: 2, author: 'Carlos P.', rating: 2, date: '2026-10-03', text: 'Demora muito no horário do almoço.', sentiment: 'negative', topics: ['tempo de espera'] },
            { id: 3, author: 'Julia R.', rating: 3, date: '2026-10-20', text: 'Lugar ok, preço mediano.', sentiment: 'neutral', topics: ['preço', 'ambiente'] },
            { id: 4, author: 'Rafael M.', rating: 5, date: '2026-11-02', text: 'Ambiente aconchegante, recomendo.', sentiment: 'positive', topics: ['ambiente'] },
        ];
        return {
            reviews,
            summary: {
                total: 4, average: 3.8,
                sentiment: { positive: 2, neutral: 1, negative: 1 },
                topics: [{ name: 'atendimento', count: 1, negative: 0 }, { name: 'tempo de espera', count: 1, negative: 1 }, { name: 'preço', count: 1, negative: 0 }, { name: 'ambiente', count: 2, negative: 0 }, { name: 'produto', count: 1, negative: 0 }],
                timeline: [{ month: '2026-09', positive: 1, neutral: 0, negative: 0 }, { month: '2026-10', positive: 0, neutral: 1, negative: 1 }, { month: '2026-11', positive: 1, neutral: 0, negative: 0 }],
            },
        };
    }

    // ---------- Renderização ----------
    function renderAll() { renderKpis(); renderTimeline(); renderTopics(); fillTopicSelect(); renderReviews(); }

    function renderKpis() {
        const s = state.summary, total = s.total || 1;
        const pct = (n) => Math.round((n / total) * 100);
        $('kpis').innerHTML = `
      <div class="kpi"><div class="kpi__value">${s.average.toFixed(1)}</div><div class="kpi__label">Nota média</div></div>
      <div class="kpi"><div class="kpi__value">${s.total}</div><div class="kpi__label">Avaliações</div></div>
      <div class="kpi kpi--pos"><div class="kpi__value">${pct(s.sentiment.positive)}%</div><div class="kpi__label">Positivas</div></div>
      <div class="kpi kpi--neg"><div class="kpi__value">${pct(s.sentiment.negative)}%</div><div class="kpi__label">Negativas</div></div>`;
    }

    function renderTimeline() {
        const data = state.summary.timeline;
        const max = Math.max(...data.map(d => d.positive + d.neutral + d.negative), 1);
        $('timeline').innerHTML = data.map(d => {
            const total = d.positive + d.neutral + d.negative;
            const h = (total / max) * 100; // altura relativa da coluna
            const seg = (n, cls) => n ? `<div class="tl-seg--${cls}" style="height:${(n / total) * 100}%" title="${n}"></div>` : '';
            return `<div class="tl-col">
        <div class="tl-bar" style="height:${h}%" role="img" aria-label="${fmtMonth(d.month)}: ${d.positive} positivas, ${d.neutral} neutras, ${d.negative} negativas">
          ${seg(d.positive, 'pos')}${seg(d.neutral, 'neu')}${seg(d.negative, 'neg')}
        </div><span class="tl-label">${fmtMonth(d.month)}</span></div>`;
        }).join('');
    }

    function renderTopics() {
        $('topics').innerHTML = state.summary.topics.map(t => {
            const neg = t.count ? Math.round((t.negative / t.count) * 100) : 0;
            return `<button class="topic ${state.topicFilter === t.name ? 'active' : ''}" data-topic="${esc(t.name)}">
        <div class="topic__name">${esc(t.name)}</div>
        <div class="topic__meta">${t.count} menções · ${neg}% negativas</div>
        <div class="topic__bar"><span style="width:${neg}%"></span></div></button>`;
        }).join('');
    }

    function fillTopicSelect() {
        const sel = $('f-topic');
        sel.innerHTML = '<option value="">Todos os temas</option>' +
            state.summary.topics.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join('');
        sel.value = state.topicFilter;
    }

    function filtered() {
        const q = $('f-search').value.trim().toLowerCase();
        const sent = $('f-sentiment').value, rating = $('f-rating').value, topic = state.topicFilter;
        return state.reviews.filter(r =>
            (!q || r.text.toLowerCase().includes(q) || r.author.toLowerCase().includes(q)) &&
            (!sent || r.sentiment === sent) &&
            (!rating || r.rating === Number(rating)) &&
            (!topic || r.topics.includes(topic)));
    }

    function renderReviews() {
        const list = filtered();
        $('count').textContent = `${list.length} de ${state.reviews.length} avaliações`;
        $('reviews').innerHTML = list.length ? list.map(r => `
      <article class="review review--${r.sentiment}">
        <div class="review__head">
          <span class="review__author">${esc(r.author)}</span>
          <span class="review__stars" aria-label="${r.rating} de 5 estrelas">${stars(r.rating)}</span>
          <span class="review__date">${fmtDate(r.date)}</span>
        </div>
        <p class="review__text">${esc(r.text)}</p>
        <div class="review__foot">
          <div class="tags">
            <span class="sent sent--${r.sentiment}">${SENT_LABEL[r.sentiment]}</span>
            ${r.topics.map(t => `<span class="tag">${esc(t)}</span>`).join('')}
          </div>
          <button class="btn btn--outline" data-reply="${r.id}"><i class="ri-reply-line"></i> Responder</button>
        </div>
      </article>`).join('') : '<p class="empty">Nenhuma avaliação encontrada com esses filtros.</p>';
    }

    // ---------- Filtros ----------
    ['f-search', 'f-sentiment', 'f-rating'].forEach(id => $(id).addEventListener('input', renderReviews));
    $('f-topic').addEventListener('change', (e) => { state.topicFilter = e.target.value; renderTopics(); renderReviews(); });
    $('f-clear').addEventListener('click', () => {
        ['f-search', 'f-sentiment', 'f-rating'].forEach(id => ($(id).value = ''));
        state.topicFilter = ''; $('f-topic').value = ''; renderTopics(); renderReviews();
    });
    $('topics').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-topic]'); if (!btn) return;
        state.topicFilter = state.topicFilter === btn.dataset.topic ? '' : btn.dataset.topic;
        $('f-topic').value = state.topicFilter; renderTopics(); renderReviews();
        $('avaliacoes').scrollIntoView({ behavior: 'smooth' });
    });

    // ---------- Assistente de resposta ----------
    $('reviews').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-reply]'); if (!btn) return;
        currentReview = state.reviews.find(r => r.id === Number(btn.dataset.reply));
        $('modal-quote').textContent = `"${currentReview.text}"`;
        $('modal').hidden = false;
        generateDraft();
    });

    async function generateDraft() {
        const tone = $('tone').value;
        $('draft').value = 'Gerando rascunho...';
        try {
            const res = await fetch(`${API}/reply`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: currentReview.id, tone }),
            });
            if (!res.ok) throw new Error();
            $('draft').value = (await res.json()).reply;
        } catch {
            $('draft').value = `Olá, ${currentReview.author}! Obrigado pelo seu comentário. Vamos considerá-lo para melhorar nosso serviço.`;
        }
    }
    $('tone').addEventListener('change', generateDraft);
    $('regen').addEventListener('click', generateDraft);
    $('copy').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText($('draft').value);
            $('copy').innerHTML = '<i class="ri-check-line"></i> Copiado!';
            setTimeout(() => ($('copy').innerHTML = '<i class="ri-file-copy-line"></i> Copiar'), 1500);
        } catch {
            $('draft').focus();
            $('draft').select();
            $('copy').textContent = 'Selecione e copie manualmente';
            setTimeout(() => ($('copy').innerHTML = '<i class="ri-file-copy-line"></i> Copiar'), 2500);
        }
    });
    const closeModal = () => ($('modal').hidden = true);
    $('modal-close').addEventListener('click', closeModal);
    $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // ---------- Menu mobile ----------
    $('nav-toggle').addEventListener('click', () => {
        const open = $('nav-menu').classList.toggle('show');
        $('nav-toggle').setAttribute('aria-expanded', open);
        $('nav-toggle').querySelector('i').className = open ? 'ri-close-line' : 'ri-menu-line';
    });
    document.querySelectorAll('.header__link').forEach(l => l.addEventListener('click', () => {
        $('nav-menu').classList.remove('show');
        $('nav-toggle').querySelector('i').className = 'ri-menu-line';
    }));

    // ---------- Link ativo ao rolar + botão scroll-up ----------
    const sections = document.querySelectorAll('main section[id]');
    const links = document.querySelectorAll('.header__link');
    window.addEventListener('scroll', () => {
        let current = sections[0].id;
        sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) current = s.id; });
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${current}`));
        $('scroll-up').classList.toggle('show', window.scrollY > 400);
    });
    $('scroll-up').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // ---------- Ano automático no footer ----------
    $('year').textContent = new Date().getFullYear();

    loadData();
    window.dispatchEvent(new Event('scroll')); // define o link ativo inicial
});
