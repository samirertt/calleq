import os
from typing import List, Dict, Any
from pymilvus import MilvusClient
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import json
import torch

# Load environment variables
load_dotenv()

# Initialize sentence transformer for embeddings with CPU
embedding_model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')

# Initialize Milvus client
client = MilvusClient("calleq.db")

def init_collection(collection_name: str = "conversations", dimension: int = 384) -> None:
    """Initialize collection in Milvus."""
    if client.has_collection(collection_name=collection_name):
        client.drop_collection(collection_name=collection_name)
    
    # Create collection with explicit schema
    client.create_collection(
        collection_name=collection_name,
        dimension=dimension,
        primary_field="id",
        vector_field="vector",
        id_type="int"
    )

def load_travel_knowledge_base(file_path: str = "travel_agency_knowledge_base.json") -> None:
    """Load travel agency knowledge base into Milvus."""
    # Initialize collection for travel knowledge with correct dimension
    init_collection(collection_name="travel_knowledge", dimension=384)
    
    # Load JSON data
    with open(file_path, 'r') as f:
        knowledge_base = json.load(f)
    
    # Prepare documents for insertion
    documents = []
    for i, item in enumerate(knowledge_base):
        documents.append({
            "text": item["content"],
            "metadata": {
                "category": item["category"],
                "tags": item["tags"]
            }
        })
    
    # Add documents to Milvus
    add_documents(documents, collection_name="travel_knowledge")
    print(f"Successfully loaded {len(documents)} documents into travel_knowledge collection")

def add_documents(documents: List[Dict[str, Any]], collection_name: str = "conversations") -> None:
    """Add documents to Milvus."""
    # Prepare texts for embeddings
    texts = [doc["text"] for doc in documents]
    
    # Get embeddings using our sentence transformer
    vectors = embedding_model.encode(texts)
    print(f"Vector shape: {vectors.shape}")  # Debug print
    
    # Prepare data for insertion
    data = []
    for i, doc in enumerate(documents):
        # Ensure vector is the correct shape (768,)
        vector = vectors[i].tolist()
        print(f"Vector {i} length: {len(vector)}")  # Debug print
        
        data.append({
            "id": int(i),
            "vector": vector,
            "text": doc["text"],
            "metadata": doc.get("metadata", {})
        })
    
    # Insert data
    client.insert(collection_name=collection_name, data=data)

def search_similar(query: str, collection_name: str = "conversations", limit: int = 5) -> List[Dict[str, Any]]:
    """Search for similar documents in Milvus."""
    # Get query embedding using our sentence transformer
    query_vector = embedding_model.encode([query])[0].tolist()
    
    # Search for similar documents
    results = client.search(
        collection_name=collection_name,
        data=[query_vector],
        limit=limit,
        output_fields=["text", "metadata"]
    )
    
    # Format results
    similar_docs = []
    for hit in results[0]:
        similar_docs.append({
            "text": hit.entity.get("text"),
            "metadata": hit.entity.get("metadata", {}),
            "score": hit.score
        })
    
    return similar_docs

# Example usage
if __name__ == "__main__":
    # Load travel knowledge base
    load_travel_knowledge_base()
    
    # Test search
    results = search_similar("What are your cancellation policies?", collection_name="travel_knowledge")
    print("Search results:", results) 