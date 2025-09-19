import logging
import os
from pathlib import Path
from typing import List, Optional

import numpy as np
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, validator

from ..data.datatypes import FashionCompatibilityQuery, FashionItem
from ..models.load import load_model

DEFAULT_CHECKPOINT = (
    Path(__file__).resolve().parents[2]
    / "checkpoints"
    / "compatibillity_clip_best.pth"
)
MAX_BATCH_REPEAT = int(os.environ.get("OUTFIT_MAX_BATCH_REPEAT", "1024"))


def _load_model() -> torch.nn.Module:
    checkpoint_path = os.environ.get(
        "OUTFIT_MODEL_CHECKPOINT", str(DEFAULT_CHECKPOINT)
    )
    if not os.path.isfile(checkpoint_path):
        raise RuntimeError(
            "Checkpoint file not found. Provide a valid path via OUTFIT_MODEL_CHECKPOINT."
        )

    model = load_model(model_type="clip", checkpoint=checkpoint_path)
    model.eval()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    return model


try:
    model = _load_model()
    MODEL_EMBED_DIM = getattr(model.item_enc, "d_embed", None)
    HALF_MODEL_EMBED_DIM = (
        MODEL_EMBED_DIM // 2 if isinstance(MODEL_EMBED_DIM, int) and MODEL_EMBED_DIM % 2 == 0 else None
    )
except Exception as exc:  # pragma: no cover
    raise RuntimeError("Failed to initialize compatibility model") from exc


class OutfitEmbeddingsRequest(BaseModel):
    embeddings: List[List[float]] = Field(
        ..., description="List of CLIP embeddings, one per outfit item"
    )
    descriptions: Optional[List[str]] = Field(
        default=None,
        description="Optional textual descriptions for each embedding",
    )

    @validator("embeddings")
    def _validate_embeddings(cls, embeddings: List[List[float]]) -> List[List[float]]:
        if not embeddings:
            raise ValueError("At least one embedding must be provided.")

        dim = len(embeddings[0])
        if dim == 0:
            raise ValueError("Embeddings must be non-empty vectors.")

        allowed_dims = set()
        if MODEL_EMBED_DIM is not None:
            allowed_dims.add(MODEL_EMBED_DIM)
        if HALF_MODEL_EMBED_DIM is not None:
            allowed_dims.add(HALF_MODEL_EMBED_DIM)

        if allowed_dims and dim not in allowed_dims:
            raise ValueError(
                f"Embeddings must have dimension {sorted(allowed_dims)}, received {dim}."
            )

        for idx, emb in enumerate(embeddings):
            if len(emb) != dim:
                raise ValueError(
                    f"Embedding at index {idx} has dimension {len(emb)}; expected {dim}."
                )
        return embeddings

    @validator("descriptions")
    def _validate_descriptions(
        cls, descriptions: Optional[List[str]], values
    ) -> Optional[List[str]]:
        embeddings = values.get("embeddings")
        if descriptions is not None and len(descriptions) != len(embeddings):
            raise ValueError("descriptions length must match embeddings length.")
        return descriptions


class CompatibilityResponse(BaseModel):
    compatibility: float = Field(
        ..., description="Predicted compatibility score between 0 and 1."
    )


logger = logging.getLogger("outfit_compatibility_api")


app = FastAPI(title="Outfit Compatibility API", version="0.1.0")


@app.post("/compatibility", response_model=CompatibilityResponse)
async def predict_compatibility(
    payload: OutfitEmbeddingsRequest,
    batch_repeat: int = 1,
) -> CompatibilityResponse:
    if batch_repeat < 1:
        raise HTTPException(status_code=400, detail="batch_repeat must be >= 1.")
    if batch_repeat > MAX_BATCH_REPEAT:
        raise HTTPException(
            status_code=400,
            detail=f"batch_repeat must be <= {MAX_BATCH_REPEAT}.",
        )

    descriptions = payload.descriptions or [f"item_{idx}" for idx in range(len(payload.embeddings))]

    items = []
    for embedding, description in zip(payload.embeddings, descriptions):
        emb_array = np.asarray(embedding, dtype=np.float32)
        if emb_array.ndim != 1:
            raise HTTPException(status_code=400, detail="Each embedding must be a 1D vector.")

        if MODEL_EMBED_DIM is not None and emb_array.shape[0] != MODEL_EMBED_DIM:
            if (
                HALF_MODEL_EMBED_DIM is not None
                and emb_array.shape[0] == HALF_MODEL_EMBED_DIM
            ):
                # Replicate half-size embeddings to match the model expectation.
                emb_array = np.concatenate([emb_array, emb_array])
            else:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Embedding dimension {emb_array.shape[0]} does not match the expected size. "
                        f"Provide vectors with dimension {MODEL_EMBED_DIM}."
                    ),
                )

        items.append(FashionItem(description=description, embedding=emb_array))

    query = FashionCompatibilityQuery(outfit=items)
    queries = [query.copy(deep=True) for _ in range(batch_repeat)]

    try:
        with torch.no_grad():
            score_tensor = model.predict_score(
                queries, use_precomputed_embedding=True
            )
    except Exception as exc:  # pragma: no cover - surfaced via API response
        logger.exception("Model inference failed")
        raise HTTPException(status_code=500, detail=f"Model inference failed: {exc}") from exc

    score = float(score_tensor[0].squeeze().detach().cpu().item())
    return CompatibilityResponse(compatibility=score)
