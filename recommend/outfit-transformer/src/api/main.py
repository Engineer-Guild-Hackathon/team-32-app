import logging
import os
from pathlib import Path
from typing import Dict, List, Optional

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


def _prepare_embedding(vector: List[float]) -> np.ndarray:
    """Validate and normalize an embedding vector for model consumption."""
    emb_array = np.asarray(vector, dtype=np.float32)

    if emb_array.ndim != 1:
        raise ValueError("Each embedding must be a 1D vector.")

    if emb_array.size == 0:
        raise ValueError("Embedding vectors must be non-empty.")

    if MODEL_EMBED_DIM is not None and emb_array.shape[0] != MODEL_EMBED_DIM:
        if (
            HALF_MODEL_EMBED_DIM is not None
            and emb_array.shape[0] == HALF_MODEL_EMBED_DIM
        ):
            emb_array = np.concatenate([emb_array, emb_array])
        else:
            raise ValueError(
                (
                    f"Embedding dimension {emb_array.shape[0]} does not match the expected size. "
                    f"Provide vectors with dimension {MODEL_EMBED_DIM}."
                )
            )

    return emb_array


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


class ClosetItem(BaseModel):
    id: str = Field(..., description="Unique identifier of the closet item.")
    category: str = Field(..., description="Category of the closet item.")
    embedding: List[float] = Field(
        ..., description="Pre-computed CLIP embedding for the item."
    )

    @validator("id")
    def _validate_id(cls, value: str) -> str:
        if not value:
            raise ValueError("Item id must be a non-empty string.")
        return value

    @validator("category")
    def _validate_category(cls, value: str) -> str:
        if not value:
            raise ValueError("Item category must be provided.")
        return value

    @validator("embedding")
    def _validate_embedding(cls, value: List[float]) -> List[float]:
        if not value:
            raise ValueError("Embedding vectors must contain at least one value.")
        return value


class ReplacementSuggestion(BaseModel):
    original_item_id: str = Field(..., description="The original selected item id.")
    replacement_item_id: str = Field(..., description="Suggested replacement item id.")
    score: float = Field(..., description="Compatibility score for the suggested outfit.")


class SuggestImprovementRequest(BaseModel):
    selected_item_ids: List[str] = Field(
        ..., description="Ordered list of item ids selected by the user.", min_items=1
    )
    closet_items: List[ClosetItem] = Field(
        ..., description="All closet items available to the user.", min_items=1
    )

    @validator("selected_item_ids")
    def _validate_selected_ids(cls, value: List[str]) -> List[str]:
        if any(not item_id for item_id in value):
            raise ValueError("selected_item_ids must not contain empty strings.")
        return value


class SuggestImprovementResponse(BaseModel):
    improved: bool = Field(
        ..., description="Whether a better outfit than the original selection was found."
    )
    original_score: float = Field(
        ..., description="Compatibility score of the original outfit."
    )
    best_score: float = Field(
        ..., description="Compatibility score of the best outfit evaluated."
    )
    suggestion: Optional[ReplacementSuggestion] = Field(
        default=None,
        description="Details of the suggested replacement when an improvement is found.",
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
        try:
            emb_array = _prepare_embedding(embedding)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

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


@app.post("/suggest-improvement", response_model=SuggestImprovementResponse)
async def suggest_improvement(
    payload: SuggestImprovementRequest,
) -> SuggestImprovementResponse:
    closet_by_id: Dict[str, ClosetItem] = {}
    for item in payload.closet_items:
        if item.id in closet_by_id:
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate item id detected in closet_items: {item.id}",
            )
        closet_by_id[item.id] = item

    missing_items = [item_id for item_id in payload.selected_item_ids if item_id not in closet_by_id]
    if missing_items:
        raise HTTPException(
            status_code=400,
            detail=f"Selected item {missing_items[0]} is not present in closet_items.",
        )

    fashion_items_by_id: Dict[str, FashionItem] = {}
    category_to_ids: Dict[str, List[str]] = {}

    for item in payload.closet_items:
        try:
            embedding = _prepare_embedding(item.embedding)
        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid embedding for item {item.id}: {exc}",
            ) from exc

        fashion_item = FashionItem(
            description=item.id,
            category=item.category,
            embedding=embedding,
        )
        fashion_items_by_id[item.id] = fashion_item
        category_to_ids.setdefault(item.category, []).append(item.id)

    selected_items = [fashion_items_by_id[item_id] for item_id in payload.selected_item_ids]

    queries: List[FashionCompatibilityQuery] = [
        FashionCompatibilityQuery(outfit=list(selected_items))
    ]
    query_infos: List[Dict[str, str]] = [
        {"type": "original"}
    ]

    for index, selected_id in enumerate(payload.selected_item_ids):
        category = closet_by_id[selected_id].category
        candidate_ids = [
            candidate_id
            for candidate_id in category_to_ids.get(category, [])
            if candidate_id != selected_id
        ]

        for candidate_id in candidate_ids:
            outfit = list(selected_items)
            outfit[index] = fashion_items_by_id[candidate_id]
            queries.append(FashionCompatibilityQuery(outfit=outfit))
            query_infos.append(
                {
                    "type": "replacement",
                    "original_item_id": selected_id,
                    "replacement_item_id": candidate_id,
                }
            )

    try:
        with torch.no_grad():
            scores_tensor = model.predict_score(
                queries, use_precomputed_embedding=True
            )
    except Exception as exc:  # pragma: no cover - surfaced via API response
        logger.exception("Model inference failed during improvement suggestion")
        raise HTTPException(status_code=500, detail=f"Model inference failed: {exc}") from exc

    scores = scores_tensor.detach().cpu().view(-1).tolist()
    original_score = float(scores[0])
    best_index = int(np.argmax(scores))
    best_score = float(scores[best_index])

    best_info = query_infos[best_index]
    improvement_threshold = 1e-6

    if (
        best_info.get("type") != "replacement"
        or best_score <= original_score + improvement_threshold
    ):
        return SuggestImprovementResponse(
            improved=False,
            original_score=original_score,
            best_score=best_score,
            suggestion=None,
        )

    return SuggestImprovementResponse(
        improved=True,
        original_score=original_score,
        best_score=best_score,
        suggestion=ReplacementSuggestion(
            original_item_id=best_info["original_item_id"],
            replacement_item_id=best_info["replacement_item_id"],
            score=best_score,
        ),
    )
