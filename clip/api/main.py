from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fashion_clip.fashion_clip import FashionCLIP
import numpy as np
from typing import List
import base64
import binascii
from tempfile import NamedTemporaryFile

app = FastAPI()
model = FashionCLIP('fashion-clip')

class TextRequest(BaseModel):
    text: str

class VectorResponse(BaseModel):
    vector: List[float]

class ImageRequest(BaseModel):
    image_base64: str

@app.post("/vectorize", response_model=VectorResponse)
async def vectorize_text(request: TextRequest):
    text_emb = model.encode_text([request.text], batch_size=1)[0]
    text_emb = text_emb/np.linalg.norm(text_emb, ord=2, axis=-1, keepdims=True)
    return VectorResponse(vector=text_emb.tolist())

@app.post("/vectorize-image", response_model=VectorResponse)
async def vectorize_image(request: ImageRequest):
    try:
        image_bytes = base64.b64decode(request.image_base64, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="Invalid base64-encoded image data.")

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Image data is empty.")

    with NamedTemporaryFile(suffix=".png") as tmp_file:
        tmp_file.write(image_bytes)
        tmp_file.flush()

        try:
            image_emb = model.encode_images([tmp_file.name], batch_size=1)[0]
        except Exception as exc:
            raise HTTPException(status_code=500, detail="Failed to encode image.") from exc

    image_emb = image_emb/np.linalg.norm(image_emb, ord=2, axis=-1, keepdims=True)
    return VectorResponse(vector=image_emb.tolist())
