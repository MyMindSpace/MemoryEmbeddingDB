const Joi = require('joi');

// Gate scores schema
const gateScoresSchema = Joi.object({
  forget_score: Joi.number().min(0).max(1).required(),
  input_score: Joi.number().min(0).max(1).required(),
  output_score: Joi.number().min(0).max(1).required(),
  confidence: Joi.number().min(0).max(1).required()
});

// Memory embedding validation schema
const memoryEmbeddingSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  memory_type: Joi.string().valid('conversation', 'event', 'emotion', 'insight').required(),
  content_summary: Joi.string().min(1).max(5000).required(),
  original_entry_id: Joi.string().uuid().required(),
  importance_score: Joi.number().min(0).max(1).required(),
  emotional_significance: Joi.number().min(0).max(1).required(),
  temporal_relevance: Joi.number().min(0).max(1).required(),
  access_frequency: Joi.number().integer().min(0).default(0),
  feature_vector: Joi.array()
    .items(Joi.number())
    .length(90)
    .required()
    .messages({
      'array.base': 'Feature vector must be an array of numbers',
      'array.length': 'Feature vector must have exactly 90 dimensions',
      'any.required': 'Feature vector is required'
    }),
  gate_scores: gateScoresSchema.required(),
  relationships: Joi.array().items(Joi.string().uuid()).default([]),
  context_needed: Joi.object().default({}),
  retrieval_triggers: Joi.array().items(Joi.string()).default([])
});

// Update memory embedding schema (partial)
const updateMemoryEmbeddingSchema = Joi.object({
  content_summary: Joi.string().min(1).max(5000).optional(),
  importance_score: Joi.number().min(0).max(1).optional(),
  emotional_significance: Joi.number().min(0).max(1).optional(),
  temporal_relevance: Joi.number().min(0).max(1).optional(),
  access_frequency: Joi.number().integer().min(0).optional(),
  feature_vector: Joi.array()
    .items(Joi.number())
    .length(90)
    .optional(),
  gate_scores: gateScoresSchema.optional(),
  relationships: Joi.array().items(Joi.string().uuid()).optional(),
  context_needed: Joi.object().optional(),
  retrieval_triggers: Joi.array().items(Joi.string()).optional()
});

// Similarity search schema
const similaritySearchSchema = Joi.object({
  feature_vector: Joi.array()
    .items(Joi.number())
    .length(90)
    .required()
    .messages({
      'array.length': 'Feature vector must have exactly 90 dimensions for similarity search'
    }),
  limit: Joi.number().integer().min(1).max(100).default(10),
  filters: Joi.object({
    user_id: Joi.string().uuid().optional(),
    memory_type: Joi.string().valid('conversation', 'event', 'emotion', 'insight').optional(),
    min_importance_score: Joi.number().min(0).max(1).optional(),
    min_emotional_significance: Joi.number().min(0).max(1).optional(),
    min_temporal_relevance: Joi.number().min(0).max(1).optional(),
    date_range: Joi.object({
      start: Joi.date().iso().optional(),
      end: Joi.date().iso().optional()
    }).optional(),
    retrieval_triggers: Joi.array().items(Joi.string()).optional()
  }).optional().default({})
});

// Batch schema for multiple memory embeddings
const batchSchema = Joi.object({
  embeddings: Joi.array()
    .items(memoryEmbeddingSchema)
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one embedding is required',
      'array.max': 'Maximum 50 embeddings allowed per batch'
    })
});

// Query validation schema
const querySchema = Joi.object({
  user_id: Joi.string().uuid().optional(),
  memory_type: Joi.string().valid('conversation', 'event', 'emotion', 'insight').optional(),
  min_importance_score: Joi.number().min(0).max(1).optional(),
  min_emotional_significance: Joi.number().min(0).max(1).optional(),
  min_temporal_relevance: Joi.number().min(0).max(1).optional(),
  date_range: Joi.object({
    start: Joi.date().iso().optional(),
    end: Joi.date().iso().optional()
  }).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  sort_by: Joi.string().valid('created_at', 'last_accessed', 'importance_score', 'emotional_significance', 'temporal_relevance', 'access_frequency').default('created_at'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc')
});

// Memory retrieval schema
const memoryRetrievalSchema = Joi.object({
  query_text: Joi.string().min(1).max(1000).required(),
  user_id: Joi.string().uuid().required(),
  context: Joi.object().optional().default({}),
  limit: Joi.number().integer().min(1).max(50).default(10),
  min_relevance_score: Joi.number().min(0).max(1).default(0.3)
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errorMessage
      });
    }
    
    next();
  };
};

// Query validation middleware
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, { 
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        error: 'Query Validation Error',
        details: errorMessage
      });
    }
    
    next();
  };
};

module.exports = {
  validate,
  validateQuery,
  memoryEmbeddingSchema,
  updateMemoryEmbeddingSchema,
  similaritySearchSchema,
  batchSchema,
  querySchema,
  memoryRetrievalSchema
};
