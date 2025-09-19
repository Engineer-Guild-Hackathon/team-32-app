from fashion_clip.fashion_clip import FashionCLIP
from vecs import create_client, IndexMeasure
from dotenv import load_dotenv
import os
import pandas as pd
from tqdm import tqdm
import numpy as np
from unittest.mock import patch

load_dotenv("../.env.local")

db_url = os.getenv("DB_URL")
if db_url is None:
    raise ValueError("DB_URL environment variable is not set")

vx = create_client(db_url)

ec_items = vx.get_or_create_collection(name="ec_item_vectors", dimension=512)

model = FashionCLIP('fashion-clip')

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

# Prepare data for batch processing
batch_size = 2048
image_paths = []
image_metadata = []

for _, row in styles.iterrows():
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

    image_paths.append(image_path)
    image_metadata.append({
        'id': f"{style_id}.jpg",
        'category': category
    })

# Process images in batches
records = []
total_batches = (len(image_paths) + batch_size - 1) // batch_size

# Disable tqdm in encode_images by patching it
with patch('fashion_clip.fashion_clip.tqdm'):
    for i in tqdm(range(0, len(image_paths), batch_size), total=total_batches, desc="Processing image batches"):
        batch_paths = image_paths[i:i + batch_size]
        batch_metadata = image_metadata[i:i + batch_size]

        try:
            # Generate embeddings for the batch
            img_embeddings = model.encode_images(batch_paths, batch_size=len(batch_paths))
            img_embeddings = img_embeddings/np.linalg.norm(img_embeddings, ord=2, axis=-1, keepdims=True)

            # Add to records list
            for emb, metadata in zip(img_embeddings, batch_metadata):
                records.append((
                    metadata['id'],  # the vector's identifier
                    emb,            # the vector embedding
                    {"category": metadata['category']}  # metadata with category
                ))
        except Exception as e:
            print(f"Error processing batch starting at index {i}: {e}")
            # Process failed batch individually
            for j, (path, metadata) in enumerate(zip(batch_paths, batch_metadata)):
                try:
                    img_emb = model.encode_images([path], batch_size=1)[0]
                    img_emb = img_emb/np.linalg.norm(img_emb, ord=2, axis=-1, keepdims=True)
                    records.append((
                        metadata['id'],
                        img_emb,
                        {"category": metadata['category']}
                    ))
                except Exception as e2:
                    print(f"Error processing image {metadata['id']}: {e2}")
                    continue

# Insert all records into the database
if records:
    ec_items.upsert(records=records)
    print(f"Inserted {len(records)} images")
else:
    print("No images to insert")

ec_items.create_index(measure=IndexMeasure.max_inner_product)
print("Created index")
