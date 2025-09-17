from PIL import Image
from sentence_transformers import SentenceTransformer
import vecs
from matplotlib import pyplot as plt
from matplotlib import image as mpimg
from dotenv import load_dotenv
import os

load_dotenv("../.env.local")

db_url = os.getenv("DB_URL")

# create vector store client
vx = vecs.create_client(db_url)

# create a collection of vectors with 3 dimensions
images = vx.get_or_create_collection(name="image_vectors", dimension=512)

# Load CLIP model
model = SentenceTransformer("clip-ViT-B-32", use_auth_token=None) 

# Encode an image:
img_emb1 = model.encode(Image.open('./images/one.jpg'))
img_emb2 = model.encode(Image.open('./images/two.jpg'))
img_emb3 = model.encode(Image.open('./images/three.jpg'))
img_emb4 = model.encode(Image.open('./images/four.jpg'))

# add records to the *images* collection
images.upsert(
    records=[
        (
            "one.jpg",        # the vector's identifier
            img_emb1,          # the vector. list or np.array
            {"type": "jpg"}   # associated  metadata
        ), (
            "two.jpg",
            img_emb2,
            {"type": "jpg"}
        ), (
            "three.jpg",
            img_emb3,
            {"type": "jpg"}
        ), (
            "four.jpg",
            img_emb4,
            {"type": "jpg"}
        )
    ]
)
print("Inserted images")

# index the collection for fast search performance
images.create_index()
print("Created index")
