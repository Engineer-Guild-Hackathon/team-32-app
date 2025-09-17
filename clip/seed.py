from sentence_transformers import SentenceTransformer
import vecs
from dotenv import load_dotenv
import os
import pandas as pd
from tqdm import tqdm

load_dotenv("../.env.local")

db_url = os.getenv("DB_URL")
if db_url is None:
    raise ValueError("DB_URL environment variable is not set")

vx = vecs.create_client(db_url)

ec_items = vx.get_or_create_collection(name="ec_item_vectors", dimension=512)

model = SentenceTransformer("clip-ViT-B-32", use_auth_token=None) 

styles = pd.read_csv('./dataset/styles.csv', usecols=[0, 3], names=['id', 'subCategory'], header=0)

category_map = {
    'Topwear': 'tops',
    'Bottomwear': 'bottoms',
    'Shoes': 'shoes',
    'Sandal': 'shoes',
    'Flip Flops': 'shoes',
    'Watches': 'accessories',
    'Belts': 'accessories',
    'Bags': 'accessories',
    'Jewellery': 'accessories',
    'Scarves': 'accessories',
    'Headwear': 'accessories',
    'Eyewear': 'accessories',
    'Ties': 'accessories',
    'Accessories': 'accessories',
}

# Process each style from the CSV
records = []
for _, row in tqdm(styles.iterrows(), total=len(styles), desc="Processing images"):
    style_id = row['id']
    sub_category = row['subCategory']

    # Skip if subCategory is not in category_map
    if sub_category not in category_map:
        continue

    # Convert subCategory to category using category_map
    category = category_map[sub_category]

    # Check if image file exists
    image_path = f'./dataset/images/{style_id}.jpg'
    if not os.path.exists(image_path):
        continue

    try:
        # Generate embedding for the image
        img_emb = model.encode(image_path)

        # Add to records list
        records.append((
            f"{style_id}.jpg",  # the vector's identifier
            img_emb,            # the vector embedding
            {"category": category}  # metadata with category instead of type
        ))
    except Exception as e:
        print(f"Error processing image {style_id}.jpg: {e}")
        continue

# Insert all records into the database
if records:
    ec_items.upsert(records=records)
    print(f"Inserted {len(records)} images")
else:
    print("No images to insert")

ec_items.create_index()
print("Created index")
