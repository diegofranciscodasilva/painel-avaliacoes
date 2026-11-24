"""API Flask do Painel de Avaliações."""
import os

from flask import Flask, jsonify, request
from flask_cors import CORS

if __package__:
    from .analyzer import draft_reply, enrich, summarize
    from .data import REVIEWS
else:
    from analyzer import draft_reply, enrich, summarize
    from data import REVIEWS

app = Flask(__name__)
CORS(app)

# Processa os dados uma vez ao iniciar (em produção, viria de um banco)
ANALYZED = [enrich(r) for r in REVIEWS]


@app.get("/api/reviews")
def reviews():
    """Retorna avaliações já classificadas e o resumo agregado."""
    return jsonify({"reviews": ANALYZED, "summary": summarize(ANALYZED)})


@app.post("/api/reply")
def reply():
    """Gera um rascunho de resposta, sempre para revisão humana."""
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({"error": "O corpo da requisição deve ser um objeto JSON"}), 400

    review = next((r for r in ANALYZED if r["id"] == data.get("id")), None)
    if not review:
        return jsonify({"error": "Avaliação não encontrada"}), 404
    return jsonify({"reply": draft_reply(review, data.get("tone", "cordial"))})


if __name__ == "__main__":
    app.run(
        debug=os.getenv("FLASK_DEBUG", "").lower() in {"1", "true", "yes"},
        host=os.getenv("FLASK_HOST", "127.0.0.1"),
        port=int(os.getenv("FLASK_PORT", "5000")),
    )
    