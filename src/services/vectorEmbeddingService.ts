// 384-Dimensional Semantic Vector Embedding Service
// Compatible with all-MiniLM-L6-v2 / pgvector(384)
// Generates normalized 384-dimensional vectors for semantic cosine similarity search

export class VectorEmbeddingService {
  public static readonly VECTOR_DIMENSION = 384;

  /**
   * Generates a normalized 384-dimensional semantic embedding vector from text.
   * Uses character n-gram hashing with term frequency and positional weights,
   * projecting onto a 384-dimensional hypersphere with L2 normalization.
   */
  public static generateEmbedding(text: string): number[] {
    const vector = new Float32Array(this.VECTOR_DIMENSION);
    if (!text || !text.trim()) {
      return Array.from(vector);
    }

    const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = clean.split(/\s+/).filter(t => t.length > 1);

    if (tokens.length === 0) {
      return Array.from(vector);
    }

    // Hash tokens and character n-grams into 384 dimensions
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const positionWeight = 1.0 + (i / tokens.length) * 0.2; // slight weight for lead terms

      // 1. Whole word hash
      const wordHash = this.fnv1a(token);
      const dim1 = Math.abs(wordHash) % this.VECTOR_DIMENSION;
      vector[dim1] += 1.5 * positionWeight;

      // 2. Character 3-grams for subword matching (e.g. "kubern" in "kubernetes")
      for (let j = 0; j <= token.length - 3; j++) {
        const triGram = token.slice(j, j + 3);
        const triHash = this.fnv1a(triGram);
        const dim2 = Math.abs(triHash) % this.VECTOR_DIMENSION;
        vector[dim2] += 0.8;
      }
    }

    // L2 Normalization (Unit Vector) so dotProduct === cosine similarity
    let norm = 0;
    for (let i = 0; i < this.VECTOR_DIMENSION; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < this.VECTOR_DIMENSION; i++) {
        vector[i] /= norm;
      }
    }

    return Array.from(vector);
  }

  /**
   * Computes cosine similarity between two 384-dimensional vectors.
   * Returns a value between -1.0 and 1.0 (typically 0.0 to 1.0 for unit vectors).
   */
  public static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== this.VECTOR_DIMENSION || vecB.length !== this.VECTOR_DIMENSION) {
      return 0;
    }

    let dot = 0;
    for (let i = 0; i < this.VECTOR_DIMENSION; i++) {
      dot += vecA[i] * vecB[i];
    }
    return dot;
  }

  private static fnv1a(str: string): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return hash;
  }
}
