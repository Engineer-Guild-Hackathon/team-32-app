from fastapi import FastAPI
from pydantic import BaseModel
from fashion_clip.fashion_clip import FashionCLIP
import numpy as np
from typing import List

app = FastAPI()
model = FashionCLIP('fashion-clip')

class TextRequest(BaseModel):
    text: str

class VectorResponse(BaseModel):
    vector: List[float]

@app.post("/vectorize", response_model=VectorResponse)
async def vectorize_text(request: TextRequest):
    text_emb = model.encode_text([request.text], batch_size=1)[0]
    text_emb = text_emb/np.linalg.norm(text_emb, ord=2, axis=-1, keepdims=True)
    return VectorResponse(vector=text_emb.tolist())
