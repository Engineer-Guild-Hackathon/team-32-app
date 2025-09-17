from sentence_transformers import SentenceTransformer
import vecs
from dotenv import load_dotenv
import os

load_dotenv("../.env.local")

db_url = os.getenv("DB_URL")
if db_url is None:
    raise ValueError("DB_URL environment variable is not set")

vx = vecs.create_client(db_url)

images = vx.get_or_create_collection(name="ec_item_vectors", dimension=512)

model = SentenceTransformer('clip-ViT-B-32')

query_string = "white t-shirt"
text_emb = model.encode(query_string)

results = images.query(
    data=text_emb,
    limit=10,
    filters={"category": {"$eq": "tops"}},
)

print(results)
