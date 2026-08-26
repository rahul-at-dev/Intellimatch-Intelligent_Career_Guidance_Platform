"""Skill knowledge graph abstraction. Neo4j in production; in-memory graph for demo."""
from __future__ import annotations

from collections import defaultdict

# Skill -> list of (relation, target)
_EDGES: dict[str, list[tuple[str, str]]] = defaultdict(list)


def seed_graph(edges: list[tuple[str, str, str]]) -> None:
    """edges: (source, relation, target)"""
    for src, rel, tgt in edges:
        _EDGES[src].append((rel, tgt))


def neighbors(skill: str, relation: str | None = None) -> list[tuple[str, str]]:
    edges = _EDGES.get(skill, [])
    if relation:
        return [(r, t) for r, t in edges if r == relation]
    return edges


def path_to(skill: str, max_depth: int = 4) -> list[list[str]]:
    """BFS over LEADS_TO / PREREQUISITE_OF edges to find learning chains."""
    paths: list[list[str]] = []
    frontier: list[list[str]] = [[skill]]
    depth = 0
    while frontier and depth < max_depth:
        next_frontier = []
        for path in frontier:
            last = path[-1]
            for rel, tgt in neighbors(last):
                if rel in ("LEADS_TO", "PREREQUISITE_OF") and tgt not in path:
                    new_path = path + [tgt]
                    paths.append(new_path)
                    next_frontier.append(new_path)
        frontier = next_frontier
        depth += 1
    return paths


def related_skills(skill: str) -> list[str]:
    return [t for r, t in neighbors(skill) if r in ("RELATED_TO", "SIMILAR_TO")]


def get_graph_provider():
    return {"neighbors": neighbors, "path_to": path_to, "related_skills": related_skills, "seed": seed_graph}
