FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# 基本ツール
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 先に PyTorch（CPU版）を確実に入れる
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
    torch torchvision torchaudio

# ライブラリ
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリ本体
COPY . .

# モデルの初回ダウンロードをビルド時に実行して、起動を速くする
RUN python - << 'PY'
from fashion_clip.fashion_clip import FashionCLIP
FashionCLIP('fashion-clip')
print("FashionCLIP weights cached.")
PY

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]