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
images = vx.get_or_create_collection(name="image_vectors", dimension=512)
# Load CLIP model
model = SentenceTransformer('clip-ViT-B-32')
# Encode text query
query_string = "a bike in front of a red brick wall"
text_emb = model.encode(query_string)
# query the collection filtering metadata for "type" = "jpg"
results = images.query(
    data=text_emb,                      # required
    limit=1,                            # number of records to return
    filters={"type": {"$eq": "jpg"}},   # metadata filters
)
result = results[0]
print(result)
plt.title(result)
image = mpimg.imread('./images/' + result)
plt.imshow(image)
plt.show()
