import os
from typing import List, Dict, Any
from pymilvus import MilvusClient, model
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
    # Initialize embedding model
    embedding_fn = model.DefaultEmbeddingFunction()
    
    # Prepare texts for embeddings
    texts = [doc["text"] for doc in documents]
    
    # Get embeddings
    vectors = embedding_fn.encode_documents(texts)
    
    # Prepare data for insertion
    data = [
        {
            "id": i,
            "vector": vectors[i],
            "text": doc["text"],
            "metadata": doc.get("metadata", {})
        }
        for i, doc in enumerate(documents)
    ]
    
    # Insert data
    client.insert(collection_name=collection_name, data=data)

def search_similar(query: str, collection_name: str = "conversations", limit: int = 5) -> List[Dict[str, Any]]:
    """Search for similar documents in Milvus."""
    # Initialize embedding model
    embedding_fn = model.DefaultEmbeddingFunction()
    
    # Get query embedding
    query_vector = embedding_fn.encode_documents([query])[0]
    
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
    # Initialize collection
    init_collection()
    
    # Add test documents
    test_docs = [
        {
            "text": "Hello, how can I help you?",
            "metadata": {"type": "greeting"}
        },
        {
            "text": "I want to learn about your services",
            "metadata": {"type": "inquiry"}
        }
    ]
    add_documents(test_docs)
    
    # Search for similar documents
    results = search_similar("Hello, tell me about your services")
    print("Search results:", results) 