"""Análise simples de sentimento e temas em português (baseada em léxico).

Limitações: não entende ironia nem contexto complexo. Para produção,
substitua por um modelo de NLP treinado para português.
"""
import re
import unicodedata
from collections import Counter, defaultdict

POSITIVE = {"excelente", "delicioso", "maravilhoso", "otimo", "bom", "adorei", "recomendo",
            "aconchegante", "limpo", "simpatica", "simpatico", "rapido", "rapida", "saboroso",
            "saborosa", "lindo", "melhor", "justo", "gostei", "perfeito", "amei", "voltarei"}
NEGATIVE = {"pessimo", "demora", "demorou", "atrasado", "grosseiro", "frio", "caro", "sujo",
            "barulhento", "ruim", "horrivel", "absurda", "absurdo", "fila", "decepcionante"}
NEGATIONS = {"nao", "nunca", "nem", "jamais"}

TOPICS = {
    "atendimento": ["atendimento", "garcom", "equipe", "atendente", "simpatic"],
    "tempo de espera": ["demora", "demorou", "espera", "fila", "atrasado", "rapid"],
    "preço": ["preco", "caro", "barato", "justo", "valor"],
    "ambiente": ["ambiente", "lugar", "barulh", "limpo", "sujo", "banheiro", "aconchegante"],
    "produto": ["cafe", "bolo", "comida", "pedido", "saboros", "delicios"],
}


def normalize(text: str) -> str:
    """Minúsculas e sem acentos para facilitar a comparação."""
    text = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def sentiment(text: str, rating: int) -> str:
    """Combina léxico (com negação simples) e a nota dada pelo cliente."""
    words = re.findall(r"[a-z]+", normalize(text))
    score = 0
    for i, w in enumerate(words):
        value = 1 if w in POSITIVE else -1 if w in NEGATIVE else 0
        if value and i > 0 and words[i - 1] in NEGATIONS:
            value = -value  # "não gostei" vira negativo
        score += value
    score += (rating - 3)  # a nota também pesa
    if score >= 1:
        return "positive"
    if score <= -1:
        return "negative"
    return "neutral"


def topics_of(text: str) -> list:
    norm = normalize(text)
    return [name for name, keys in TOPICS.items() if any(k in norm for k in keys)]


def enrich(review: dict) -> dict:
    return {**review,
            "sentiment": sentiment(review["text"], review["rating"]),
            "topics": topics_of(review["text"])}


def summarize(reviews: list) -> dict:
    total = len(reviews)
    sent = Counter(r["sentiment"] for r in reviews)

    topic_count, topic_neg = Counter(), Counter()
    for r in reviews:
        for t in r["topics"]:
            topic_count[t] += 1
            if r["sentiment"] == "negative":
                topic_neg[t] += 1

    months = defaultdict(lambda: {"positive": 0, "neutral": 0, "negative": 0})
    for r in reviews:
        months[r["date"][:7]][r["sentiment"]] += 1

    return {
        "total": total,
        "average": round(sum(r["rating"] for r in reviews) / total, 2) if total else 0,
        "sentiment": {k: sent.get(k, 0) for k in ("positive", "neutral", "negative")},
        "topics": [{"name": t, "count": c, "negative": topic_neg[t]} for t, c in topic_count.most_common()],
        "timeline": [{"month": m, **v} for m, v in sorted(months.items())],
    }


# ---------- Rascunhos de resposta (templates por tom) ----------
TEMPLATES = {
    "cordial": {
        "positive": "Olá, {name}! Ficamos muito felizes com seu comentário. Será um prazer receber você novamente!",
        "neutral": "Olá, {name}! Obrigado pelo feedback. Vamos considerar suas observações para melhorar sua próxima visita.",
        "negative": "Olá, {name}! Lamentamos sua experiência e agradecemos por nos contar. Vamos avaliar o que aconteceu{topic} e buscar melhorar.",
    },
    "formal": {
        "positive": "Prezado(a) {name}, agradecemos sua avaliação positiva. Seguiremos empenhados em oferecer um bom serviço.",
        "neutral": "Prezado(a) {name}, agradecemos seu retorno. Suas considerações serão analisadas por nossa equipe.",
        "negative": "Prezado(a) {name}, lamentamos o ocorrido{topic}. Sua opinião será analisada para que possamos aprimorar nossos serviços.",
    },
    "descontraido": {
        "positive": "Oi, {name}! Que alegria ler isso! Te esperamos de novo por aqui!",
        "neutral": "Oi, {name}! Valeu pelo toque! Vamos trabalhar para deixar sua próxima visita ainda melhor.",
        "negative": "Oi, {name}! Poxa, sentimos muito{topic}. Vamos corrigir isso e queremos te receber de novo!",
    },
}


def draft_reply(review: dict, tone: str) -> str:
    if not isinstance(tone, str):
        tone = "cordial"
    tone = tone if tone in TEMPLATES else "cordial"
    first = review["topics"][0] if review["topics"] else None
    topic = f" com relação a {first}" if first else ""
    name = review["author"].split()[0] if review["author"].strip() else "cliente"
    return TEMPLATES[tone][review["sentiment"]].format(name=name, topic=topic)
