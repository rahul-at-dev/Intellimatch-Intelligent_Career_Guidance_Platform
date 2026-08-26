"""Embedding provider.

Real deployments should load a Sentence-Transformers / BGE-M3 model. Since this
environment cannot guarantee model downloads, the default path is a deterministic
hashing-based embedding (bag-of-tokens random projection) — offline, dependency-free,
and stable across runs, so semantic search still works meaningfully in demo mode.
"""
from __future__ import annotations

import hashlib
import re

import numpy as np

EMBED_DIM = 256


def _token_vector(token: str) -> np.ndarray:
    h = hashlib.sha256(token.encode()).digest()
    seed = int.from_bytes(h[:8], "little")
    rng = np.random.default_rng(seed)
    return rng.normal(size=EMBED_DIM)


def embed_text(text: str) -> list[float]:
    tokens = re.findall(r"[a-zA-Z0-9\+\#\.]+", text.lower())
    if not tokens:
        return [0.0] * EMBED_DIM
    vecs = np.stack([_token_vector(t) for t in tokens])
    vec = vecs.mean(axis=0)
    norm = np.linalg.norm(vec) + 1e-9
    return (vec / norm).tolist()


class EmbeddingProvider:
    def embed(self, text: str) -> list[float]:
        return embed_text(text)

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [embed_text(t) for t in texts]


def get_embedding_provider() -> EmbeddingProvider:
    return EmbeddingProvider()
