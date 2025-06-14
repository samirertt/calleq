import os
import json
from typing import List, Dict, Any
from pymilvus import MilvusClient
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize sentence transformer for embeddings
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Initialize Milvus client
client = MilvusClient("calleq.db")

def init_collection(collection_name: str = "conversations", dimension: int = 768) -> None:
    """Initialize collection in Milvus."""
    if client.has_collection(collection_name=collection_name):
        client.drop_collection(collection_name=collection_name)
    
    client.create_collection(
        collection_name=collection_name,
        dimension=dimension
    )

def add_documents(documents: List[Dict[str, Any]], collection_name: str = "conversations") -> None:
    """Add documents to Milvus."""
    # Prepare texts for embeddings
    texts = [doc["text"] for doc in documents]
    
    # Get embeddings using our sentence transformer
    vectors = embedding_model.encode(texts)
    
    # Prepare data for insertion
    data = [
        {
            "id": i,
            "vector": vectors[i].tolist(),
            "text": doc["text"],
            "metadata": doc.get("metadata", {})
        }
        for i, doc in enumerate(documents)
    ]
    
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

def load_company_knowledge(json_file: str = "travel_agency_knowledge_base.json", collection_name: str = "company_knowledge") -> None:
    """Load company knowledge base from JSON file into Milvus."""
    # Initialize collection with correct dimension
    init_collection(collection_name=collection_name, dimension=384)  # all-MiniLM-L6-v2 dimension
    
    # Load JSON data
    with open(json_file, 'r', encoding='utf-8') as f:
        knowledge_base = json.load(f)
    
    # Prepare documents for insertion
    documents = []
    for item in knowledge_base:
        doc = {
            "text": item["content"],
            "metadata": {
                "category": item["category"],
                "tags": item["tags"]
            }
        }
        documents.append(doc)
    
    # Add documents to Milvus
    add_documents(documents, collection_name=collection_name)
    print(f"Loaded {len(documents)} documents into {collection_name} collection")

# Example usage
if __name__ == "__main__":
    # Load company knowledge base
    load_company_knowledge()
    
    # Test search
    results = search_similar("What are your cancellation policies?", collection_name="company_knowledge")
    print("\nSearch results:")
    for doc in results:
        print(f"\nText: {doc['text']}")
        print(f"Category: {doc['metadata']['category']}")
        print(f"Tags: {doc['metadata']['tags']}")
        print(f"Score: {doc['score']}") 