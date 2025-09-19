#!/usr/bin/env python3
"""Simple CLI to test the Outfit Compatibility API with CLIP embeddings."""
import argparse
import json
import sys
from pathlib import Path
from typing import Iterable, List, Optional
from urllib import error, request
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse


DEFAULT_EMBEDDINGS_FILE = Path(__file__).resolve().parent / "sample_embeddings.json"


def _ensure_numpy():  # pragma: no cover - optional dependency
    try:
        import numpy as np  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "NumPy is required to read .npy files. Install it or provide JSON embeddings."
        ) from exc
    return np


def load_vectors_from_path(path: Path) -> List[List[float]]:
    if not path.is_file():
        raise FileNotFoundError(f"Embedding file not found: {path}")

    suffix = path.suffix.lower()
    if suffix == ".json":
        with path.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
    elif suffix == ".npy":
        np = _ensure_numpy()
        data = np.load(path).tolist()
    else:
        raise ValueError(f"Unsupported file type for embeddings: {path.suffix}")

    if isinstance(data, list) and data and isinstance(data[0], (int, float)):
        return [data]
    if not isinstance(data, list):
        raise ValueError(f"Embeddings in {path} must be a list of vectors.")

    vectors: List[List[float]] = []
    for idx, vec in enumerate(data):
        if not isinstance(vec, Iterable):
            raise ValueError(f"Entry at position {idx} in {path} is not a sequence.")
        vec_list = [float(v) for v in vec]
        if not vec_list:
            raise ValueError(f"Embedding at position {idx} in {path} is empty.")
        vectors.append(vec_list)

    first_dim = len(vectors[0])
    for idx, vec in enumerate(vectors[1:], start=1):
        if len(vec) != first_dim:
            raise ValueError(
                f"Embedding at position {idx} in {path} has dimension {len(vec)} (expected {first_dim})."
            )

    return vectors


def build_payload(
    embedding_paths: List[Path],
    descriptions: Optional[List[str]],
) -> dict:
    embeddings: List[List[float]] = []
    for emb_path in embedding_paths:
        embeddings.extend(load_vectors_from_path(emb_path))

    if descriptions:
        if len(descriptions) != len(embeddings):
            raise ValueError("Number of descriptions must match number of embeddings.")

    payload = {"embeddings": embeddings}
    if descriptions:
        payload["descriptions"] = descriptions

    return payload


def _attach_query(url: str, params: dict) -> str:
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query))
    query.update({k: str(v) for k, v in params.items() if v is not None})
    new_query = urlencode(query)
    return urlunparse(parsed._replace(query=new_query))


def post_json(url: str, payload: dict, *, batch_repeat: int) -> dict:
    url = _attach_query(url, {"batch_repeat": batch_repeat})
    data = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    req = request.Request(url=url, data=data, headers=headers, method="POST")

    try:
        with request.urlopen(req) as response:
            resp_bytes = response.read()
            return json.loads(resp_bytes)
    except error.HTTPError as http_err:
        detail = http_err.read().decode("utf-8", errors="ignore")
        raise RuntimeError(
            f"HTTP {http_err.code} {http_err.reason}: {detail}".strip()
        ) from http_err


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Call the Outfit Compatibility API.")
    parser.add_argument(
        "--url",
        default="http://localhost:8000/compatibility",
        help="Target API endpoint.",
    )
    parser.add_argument(
        "--embedding",
        dest="embedding_paths",
        action="append",
        type=Path,
        help=(
            "Path to a .npy or .json file containing one or more embedding vectors. "
            "Repeat to merge multiple files. When omitted, bundled sample embeddings are used."
        ),
    )
    parser.add_argument(
        "--embeddings-file",
        dest="embeddings_file",
        type=Path,
        default=DEFAULT_EMBEDDINGS_FILE,
        help="Shortcut to a file containing all embeddings. Ignored when --embedding is provided.",
    )
    parser.add_argument(
        "--description",
        dest="descriptions",
        action="append",
        help="Optional description for each embedding. Repeat per embedding.",
    )
    parser.add_argument(
        "--batch-repeat",
        dest="batch_repeat",
        type=int,
        default=1,
        help="Duplicate the payload this many times before sending it to the API.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.embedding_paths:
        embedding_paths = args.embedding_paths
    else:
        embedding_paths = [args.embeddings_file]
    descriptions = args.descriptions

    try:
        payload = build_payload(embedding_paths, descriptions)
    except (FileNotFoundError, ValueError, json.JSONDecodeError) as exc:
        print(f"[Error] {exc}", file=sys.stderr)
        sys.exit(1)

    try:
        response = post_json(args.url, payload, batch_repeat=args.batch_repeat)
    except Exception as exc:  # pragma: no cover - network error surfaces to user
        print(f"[Error] Failed to call API: {exc}", file=sys.stderr)
        sys.exit(2)

    print(json.dumps(response, indent=2))


if __name__ == "__main__":
    main()
