const express = require('express');
const router = express.Router();
const memoryEmbeddingService = require('../services/memoryEmbeddingService');
const { 
  validate, 
  validateQuery, 
  memoryEmbeddingSchema, 
  updateMemoryEmbeddingSchema, 
  similaritySearchSchema, 
  batchSchema,
  querySchema,
  memoryRetrievalSchema 
} = require('../middleware/validation');

// @route   GET /api/memory-embeddings/stats
// @desc    Get collection statistics
// @access  Private
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await memoryEmbeddingService.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/memory-embeddings/similarity
// @desc    Find similar memory embeddings using cosine similarity
// @access  Private
router.post('/similarity', validate(similaritySearchSchema), async (req, res, next) => {
  try {
    const { feature_vector, limit, filters } = req.body;
    const result = await memoryEmbeddingService.findSimilarMemoryEmbeddings(feature_vector, { limit, filters });
    
    res.json({
      success: true,
      data: result,
      message: `Found ${result.results.length} similar memory embeddings`
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/memory-embeddings/batch
// @desc    Create multiple memory embeddings in batch
// @access  Private
router.post('/batch', validate(batchSchema), async (req, res, next) => {
  try {
    const { embeddings } = req.body;
    const result = await memoryEmbeddingService.createMemoryEmbeddingsBatch(embeddings);
    
    res.status(201).json({
      success: true,
      data: result,
      message: `Successfully created ${result.inserted_count} memory embeddings`
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/memory-embeddings/query
// @desc    Query memory embeddings with filters and pagination
// @access  Private
router.get('/query', validateQuery(querySchema), async (req, res, next) => {
  try {
    const result = await memoryEmbeddingService.queryMemoryEmbeddings(req.query);
    
    res.json({
      success: true,
      data: result,
      message: `Found ${result.results.length} memory embeddings`
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/memory-embeddings
// @desc    Create a new memory embedding
// @access  Private
router.post('/', validate(memoryEmbeddingSchema), async (req, res, next) => {
  try {
    const memoryEmbedding = await memoryEmbeddingService.createMemoryEmbedding(req.body);
    
    res.status(201).json({
      success: true,
      data: memoryEmbedding,
      message: 'Memory embedding created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/memory-embeddings/:id
// @desc    Get memory embedding by ID
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const memoryEmbedding = await memoryEmbeddingService.getMemoryEmbeddingById(req.params.id);
    
    res.json({
      success: true,
      data: memoryEmbedding
    });
  } catch (error) {
    if (error.message === 'Memory embedding not found') {
      return res.status(404).json({
        success: false,
        error: 'Memory embedding not found'
      });
    }
    next(error);
  }
});

// @route   PUT /api/memory-embeddings/:id
// @desc    Update memory embedding by ID
// @access  Private
router.put('/:id', validate(updateMemoryEmbeddingSchema), async (req, res, next) => {
  try {
    const memoryEmbedding = await memoryEmbeddingService.updateMemoryEmbedding(req.params.id, req.body);
    
    res.json({
      success: true,
      data: memoryEmbedding,
      message: 'Memory embedding updated successfully'
    });
  } catch (error) {
    if (error.message === 'Memory embedding not found') {
      return res.status(404).json({
        success: false,
        error: 'Memory embedding not found'
      });
    }
    next(error);
  }
});

// @route   DELETE /api/memory-embeddings/:id
// @desc    Delete memory embedding by ID
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await memoryEmbeddingService.deleteMemoryEmbedding(req.params.id);
    
    res.json({
      success: true,
      data: result,
      message: 'Memory embedding deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Memory embedding not found') {
      return res.status(404).json({
        success: false,
        error: 'Memory embedding not found'
      });
    }
    next(error);
  }
});

// @route   GET /api/memory-embeddings/user/:userId
// @desc    Get all memory embeddings for a specific user
// @access  Private
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0, sort_by = 'created_at', sort_order = 'desc' } = req.query;
    
    const result = await memoryEmbeddingService.queryMemoryEmbeddings({
      user_id: userId,
      limit: parseInt(limit),
      offset: parseInt(offset),
      sort_by,
      sort_order
    });
    
    res.json({
      success: true,
      data: result,
      message: `Found ${result.results.length} memory embeddings for user ${userId}`
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/memory-embeddings/type/:memoryType
// @desc    Get all memory embeddings of a specific type
// @access  Private
router.get('/type/:memoryType', async (req, res, next) => {
  try {
    const { memoryType } = req.params;
    const { limit = 20, offset = 0, sort_by = 'importance_score', sort_order = 'desc' } = req.query;
    
    const result = await memoryEmbeddingService.queryMemoryEmbeddings({
      memory_type: memoryType,
      limit: parseInt(limit),
      offset: parseInt(offset),
      sort_by,
      sort_order
    });
    
    res.json({
      success: true,
      data: result,
      message: `Found ${result.results.length} ${memoryType} memory embeddings`
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/memory-embeddings/:id/access
// @desc    Record access to a memory (updates access frequency and last accessed)
// @access  Private
router.post('/:id/access', async (req, res, next) => {
  try {
    const result = await memoryEmbeddingService.recordMemoryAccess(req.params.id);
    
    res.json({
      success: true,
      data: result,
      message: 'Memory access recorded successfully'
    });
  } catch (error) {
    if (error.message === 'Memory embedding not found') {
      return res.status(404).json({
        success: false,
        error: 'Memory embedding not found'
      });
    }
    next(error);
  }
});

// @route   GET /api/memory-embeddings/user/:userId/important
// @desc    Get important memories for a user (high importance score)
// @access  Private
router.get('/user/:userId/important', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 10, min_score = 0.7 } = req.query;
    
    const result = await memoryEmbeddingService.queryMemoryEmbeddings({
      user_id: userId,
      min_importance_score: parseFloat(min_score),
      limit: parseInt(limit),
      sort_by: 'importance_score',
      sort_order: 'desc'
    });
    
    res.json({
      success: true,
      data: result,
      message: `Found ${result.results.length} important memories for user ${userId}`
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/memory-embeddings/user/:userId/recent
// @desc    Get recently accessed memories for a user
// @access  Private
router.get('/user/:userId/recent', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    
    const result = await memoryEmbeddingService.queryMemoryEmbeddings({
      user_id: userId,
      limit: parseInt(limit),
      sort_by: 'last_accessed',
      sort_order: 'desc'
    });
    
    res.json({
      success: true,
      data: result,
      message: `Found ${result.results.length} recently accessed memories for user ${userId}`
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/memory-embeddings/user/:userId/relationships/:memoryId
// @desc    Get related memories for a specific memory
// @access  Private
router.get('/user/:userId/relationships/:memoryId', async (req, res, next) => {
  try {
    const { userId, memoryId } = req.params;
    
    // First get the memory to find its relationships
    const memory = await memoryEmbeddingService.getMemoryEmbeddingById(memoryId);
    
    if (memory.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this memory'
      });
    }
    
    // Get related memories
    const relatedMemories = [];
    for (const relatedId of memory.relationships) {
      try {
        const relatedMemory = await memoryEmbeddingService.getMemoryEmbeddingById(relatedId);
        if (relatedMemory.user_id === userId) {
          relatedMemories.push(relatedMemory);
        }
      } catch (error) {
        // Skip memories that don't exist or can't be accessed
        continue;
      }
    }
    
    res.json({
      success: true,
      data: {
        source_memory: memory,
        related_memories: relatedMemories,
        relationship_count: relatedMemories.length
      },
      message: `Found ${relatedMemories.length} related memories`
    });
  } catch (error) {
    if (error.message === 'Memory embedding not found') {
      return res.status(404).json({
        success: false,
        error: 'Memory embedding not found'
      });
    }
    next(error);
  }
});

module.exports = router;
