"""Vector store abstraction: Qdrant when reachable, else in-process numpy index."""
from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np


class VectorStore(ABC):
    @abstractmethod
    def upsert(self, id: str, vector: list[float], payload: dict) -> None: ...

    @abstractmethod
    def search(self, vector: list[float], top_k: int = 20) -> list[tuple[str, float, dict]]: ...


class InMemoryVectorStore(VectorStore):
    """Mock/demo vector store — cosine similarity over an in-memory matrix."""

    def __init__(self):
        self._ids: list[str] = []
        self._vectors: list[list[float]] = []
        self._payloads: list[dict] = []

    def upsert(self, id: str, vector: list[float], payload: dict) -> None:
        if id in self._ids:
            idx = self._ids.index(id)
            self._vectors[idx] = vector
            self._payloads[idx] = payload
        else:
            self._ids.append(id)
            self._vectors.append(vector)
            self._payloads.append(payload)

    def search(self, vector: list[float], top_k: int = 20) -> list[tuple[str, float, dict]]:
        if not self._vectors:
            return []
        mat = np.array(self._vectors)
        q = np.array(vector)
        denom = (np.linalg.norm(mat, axis=1) * np.linalg.norm(q) + 1e-9)
        sims = (mat @ q) / denom
        order = np.argsort(-sims)[:top_k]
        return [(self._ids[i], float(sims[i]), self._payloads[i]) for i in order]


_store = InMemoryVectorStore()


def get_vector_store() -> VectorStore:
    # In production this would try Qdrant via QDRANT_URL and fall back on connection error.
    return _store
