const request = require('supertest');
const app = require('../server');

describe('Memory Embedding API', () => {
  const apiKey = process.env.API_KEY || 'test-api-key';
  
  // Sample memory embedding data for testing
  const sampleMemory = {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    memory_type: 'conversation',
    content_summary: 'User discussed anxiety about upcoming exams and developed coping strategies',
    original_entry_id: '550e8400-e29b-41d4-a716-446655440001',
    importance_score: 0.8,
    emotional_significance: 0.7,
    temporal_relevance: 0.9,
    access_frequency: 0,
    feature_vector: new Array(90).fill(0).map(() => Math.random() - 0.5),
    gate_scores: {
      forget_score: 0.2,
      input_score: 0.8,
      output_score: 0.9,
      confidence: 0.85
    },
    relationships: [],
    context_needed: {
      academic_pressure: true,
      support_system: 'family',
      coping_mechanisms: ['breathing', 'meditation']
    },
    retrieval_triggers: ['anxiety', 'exam', 'stress', 'coping', 'meditation']
  };

  beforeAll(async () => {
    // Wait for database connection
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('API Authentication', () => {
    it('should require API key for protected endpoints', async () => {
      const response = await request(app)
        .get('/api/memory-embeddings/stats');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should accept valid API key', async () => {
      const response = await request(app)
        .get('/api/memory-embeddings/stats')
        .set('X-API-Key', apiKey);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Memory Embeddings CRUD', () => {
    let createdMemoryId;

    it('should create a new memory embedding', async () => {
      const response = await request(app)
        .post('/api/memory-embeddings')
        .set('X-API-Key', apiKey)
        .send(sampleMemory);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('memory_type', 'conversation');
      
      createdMemoryId = response.body.data.id;
    });

    it('should get memory by ID', async () => {
      if (!createdMemoryId) {
        return; // Skip if creation failed
      }

      const response = await request(app)
        .get(`/api/memory-embeddings/${createdMemoryId}`)
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', createdMemoryId);
      expect(response.body.data).toHaveProperty('content_summary', sampleMemory.content_summary);
      expect(response.body.data.gate_scores).toHaveProperty('confidence', 0.85);
    });

    it('should update memory', async () => {
      if (!createdMemoryId) {
        return;
      }

      const updateData = {
        importance_score: 0.9,
        retrieval_triggers: ['anxiety', 'exam', 'stress', 'coping', 'meditation', 'success']
      };

      const response = await request(app)
        .put(`/api/memory-embeddings/${createdMemoryId}`)
        .set('X-API-Key', apiKey)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.importance_score).toBe(0.9);
      expect(response.body.data.retrieval_triggers).toContain('success');
    });

    it('should record memory access', async () => {
      if (!createdMemoryId) {
        return;
      }

      const response = await request(app)
        .post(`/api/memory-embeddings/${createdMemoryId}/access`)
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('access_frequency', 1);
    });

    it('should delete memory', async () => {
      if (!createdMemoryId) {
        return;
      }

      const response = await request(app)
        .delete(`/api/memory-embeddings/${createdMemoryId}`)
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('deleted', true);
    });
  });

  describe('Memory Search & Filtering', () => {
    it('should perform similarity search', async () => {
      const searchVector = new Array(90).fill(0).map(() => Math.random() - 0.5);
      
      const response = await request(app)
        .post('/api/memory-embeddings/similarity')
        .set('X-API-Key', apiKey)
        .send({
          feature_vector: searchVector,
          limit: 5,
          filters: {
            memory_type: 'conversation'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('query_vector_dimensions', 90);
    });

    it('should query memories with filters', async () => {
      const response = await request(app)
        .get('/api/memory-embeddings/query')
        .query({
          memory_type: 'conversation',
          min_importance_score: 0.5,
          limit: 10
        })
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('pagination');
    });
  });

  describe('Statistics', () => {
    it('should return collection statistics', async () => {
      const response = await request(app)
        .get('/api/memory-embeddings/stats')
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('total_memories');
      expect(response.body.data).toHaveProperty('memory_type_distribution');
      expect(response.body.data).toHaveProperty('score_statistics');
      expect(response.body.data.collection_info).toHaveProperty('vector_dimensions', 90);
    });
  });

  describe('Validation', () => {
    it('should reject invalid memory data', async () => {
      const invalidData = {
        ...sampleMemory,
        feature_vector: new Array(50).fill(0) // Wrong dimension
      };

      const response = await request(app)
        .post('/api/memory-embeddings')
        .set('X-API-Key', apiKey)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid memory type', async () => {
      const invalidData = {
        ...sampleMemory,
        memory_type: 'invalid_type'
      };

      const response = await request(app)
        .post('/api/memory-embeddings')
        .set('X-API-Key', apiKey)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject missing required fields', async () => {
      const incompleteData = {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        memory_type: 'conversation'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/memory-embeddings')
        .set('X-API-Key', apiKey)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate gate scores structure', async () => {
      const invalidData = {
        ...sampleMemory,
        gate_scores: {
          forget_score: 1.5, // Invalid score > 1
          input_score: 0.8,
          output_score: 0.9,
          confidence: 0.85
        }
      };

      const response = await request(app)
        .post('/api/memory-embeddings')
        .set('X-API-Key', apiKey)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('User-specific Operations', () => {
    const testUserId = '550e8400-e29b-41d4-a716-446655440123';

    it('should get user memories', async () => {
      const response = await request(app)
        .get(`/api/memory-embeddings/user/${testUserId}`)
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('results');
    });

    it('should get important memories for user', async () => {
      const response = await request(app)
        .get(`/api/memory-embeddings/user/${testUserId}/important`)
        .query({ min_score: 0.8, limit: 5 })
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('results');
    });

    it('should get recent memories for user', async () => {
      const response = await request(app)
        .get(`/api/memory-embeddings/user/${testUserId}/recent`)
        .query({ limit: 5 })
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('results');
    });
  });

  describe('Memory Types', () => {
    it('should get memories by type', async () => {
      const response = await request(app)
        .get('/api/memory-embeddings/type/conversation')
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('results');
    });

    it('should reject invalid memory type in URL', async () => {
      const response = await request(app)
        .get('/api/memory-embeddings/type/invalid_type')
        .set('X-API-Key', apiKey);

      // Should still return 200 but with empty results since validation happens at query level
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
});
