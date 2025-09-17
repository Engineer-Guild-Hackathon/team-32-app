from fashion_clip.fashion_clip import FashionCLIP
from vecs import create_client, IndexMeasure
from dotenv import load_dotenv
import os
import numpy as np

load_dotenv("../.env.local")

db_url = os.getenv("DB_URL")
if db_url is None:
    raise ValueError("DB_URL environment variable is not set")

vx = create_client(db_url)

images = vx.get_or_create_collection(name="ec_item_vectors", dimension=512)

model = FashionCLIP('fashion-clip')

query_string = "white t-shirt"
text_emb = model.encode_text([query_string], batch_size=1)[0]
text_emb = text_emb/np.linalg.norm(text_emb, ord=2, axis=-1, keepdims=True)

results = images.query(
    data=text_emb,
    limit=10,
    filters={"category": {"$eq": "tops"}},
    measure=IndexMeasure.max_inner_product,
)

print(results)
