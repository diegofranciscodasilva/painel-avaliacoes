# Voz do Cliente — Painel de Avaliações

Aplicação web educacional para analisar avaliações de clientes de uma cafeteria fictícia. O projeto classifica sentimento, identifica temas recorrentes, exibe indicadores e gera rascunhos de respostas para revisão humana.

## Funcionalidades

- Nota média, quantidade de avaliações e percentuais de sentimento.
- Evolução mensal em gráfico de barras empilhadas.
- Identificação de temas: atendimento, tempo de espera, preço, ambiente e produto.
- Busca e filtros por texto, sentimento, tema e nota.
- Rascunhos de resposta em três tons: cordial, formal e descontraído.
- Fallback no navegador para visualização sem o backend.
- Layout responsivo e menu para telas pequenas.

## Tecnologias

- Frontend: HTML, CSS e JavaScript sem framework.
- Backend: Python 3.10+ e Flask.
- CORS: Flask-CORS.
- Dados: lista local de demonstração em `backend/data.py`.

## Execução local

No PowerShell, a partir da pasta do projeto:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
python -m backend.app
```

Depois, abra `index.html` no navegador. O backend ficará disponível em `http://127.0.0.1:5000`.

Para servir o frontend por HTTP, use outro terminal na raiz:

```powershell
python -m http.server 8080
```

Então acesse `http://127.0.0.1:8080`. Para uma API em outro endereço, defina antes de carregar a página:

```html
<script>
  window.PAINEL_API_URL = "https://seu-endereco/api"
</script>
```

## API

- `GET /api/reviews`: retorna avaliações enriquecidas e o resumo agregado.
- `POST /api/reply`: recebe `{ "id": 1, "tone": "cordial" }` e retorna um rascunho.

Os tons aceitos são `cordial`, `formal` e `descontraido`. O endpoint nunca publica respostas automaticamente.

## Estrutura

```text
index.html                 Interface principal
assets/css/style.css       Estilos responsivos
assets/js/script.js        Estado, filtros, renderização e modal
backend/app.py             Rotas Flask e configuração do servidor
backend/analyzer.py        Sentimento, temas, resumo e templates
backend/data.py            Avaliações de demonstração
backend/requirements.txt   Dependências Python
passo-a-passo.txt          Guia detalhado de instalação e uso
versao.txt                 Versão, alterações e próximos passos
```

## Limitações conhecidas

O classificador usa um léxico simples em português: ironia, contexto, gírias e negações complexas podem gerar classificações incorretas. Os dados são estáticos e servem apenas para demonstração.

## 👨‍💻 Autor

### Diego Francisco da Silva

Desenvolvedor Front-End em formação e estudante de Engenharia de Software.

- **[Site Empresa](https://diegofranciscodasilva.github.io/dev-software-web/)**: dev.software.web
- **[LinkedIn](https://www.linkedin.com/in/diego-francisco-da-silva/)**: diego-francisco-da-silva
- **[GitHub](https://github.com/diegofranciscodasilva)**: diegofranciscodasilva
- **[Instagram](https://www.instagram.com/diego_francisco_da_silva/)**: @diego_francisco_da_silva
- **[Instagram](https://www.instagram.com/dev.software.web/)**: @dev.software.web

---

Feito com ❤️ por Diego.
