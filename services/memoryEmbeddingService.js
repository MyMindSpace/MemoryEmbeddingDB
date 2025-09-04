const astraDB = require('../config/astradb');
const { v4: uuidv4 } = require('uuid');

class MemoryEmbeddingService {
  constructor() {
    this.collection = null;
  }

  async initialize() {
    if (!this.collection) {
      this.collection = await astraDB.connect();
    }
    return this.collection;
  }

  // Create a new memory embedding
  async createMemoryEmbedding(embeddingData) {
    try {
      await this.initialize();

      const document = {
        _id: uuidv4(),
        user_id: embeddingData.user_id,
        memory_type: embeddingData.memory_type,
        content_summary: embeddingData.content_summary,
        original_entry_id: embeddingData.original_entry_id,
        importance_score: embeddingData.importance_score,
        emotional_significance: embeddingData.emotional_significance,
        temporal_relevance: embeddingData.temporal_relevance,
        access_frequency: embeddingData.access_frequency || 0,
        last_accessed: new Date().toISOString(),
        created_at: new Date().toISOString(),
        $vector: embeddingData.feature_vector, // AstraDB uses $vector for the main vector
        gate_scores: embeddingData.gate_scores,
        relationships: embeddingData.relationships || [],
        context_needed: embeddingData.context_needed || {},
        retrieval_triggers: embeddingData.retrieval_triggers || [],
        updated_at: new Date().toISOString()
      };

      const result = await this.collection.insertOne(document);
      
      return {
        id: document._id,
        ...document,
        feature_vector: document.$vector,
        insertedId: result.insertedId
      };
    } catch (error) {
      throw new Error(`Failed to create memory embedding: ${error.message}`);
    }
  }

  // Get memory embedding by ID
  async getMemoryEmbeddingById(id) {
    try {
      await this.initialize();

      const result = await this.collection.findOne({ _id: id });
      
      if (!result) {
        throw new Error('Memory embedding not found');
      }

      return {
        id: result._id,
        user_id: result.user_id,
        memory_type: result.memory_type,
        content_summary: result.content_summary,
        original_entry_id: result.original_entry_id,
        importance_score: result.importance_score,
        emotional_significance: result.emotional_significance,
        temporal_relevance: result.temporal_relevance,
        access_frequency: result.access_frequency,
        last_accessed: result.last_accessed,
        created_at: result.created_at,
        feature_vector: result.$vector,
        gate_scores: result.gate_scores,
        relationships: result.relationships,
        context_needed: result.context_needed,
        retrieval_triggers: result.retrieval_triggers,
        updated_at: result.updated_at
      };
    } catch (error) {
      throw new Error(`Failed to get memory embedding: ${error.message}`);
    }
  }

  // Update memory embedding
  async updateMemoryEmbedding(id, updateData) {
    try {
      await this.initialize();

      const updateDoc = {
        updated_at: new Date().toISOString()
      };
      
      // Map fields to database structure
      if (updateData.feature_vector) {
        updateDoc.$vector = updateData.feature_vector;
      }
      if (updateData.content_summary) updateDoc.content_summary = updateData.content_summary;
      if (updateData.importance_score !== undefined) updateDoc.importance_score = updateData.importance_score;
      if (updateData.emotional_significance !== undefined) updateDoc.emotional_significance = updateData.emotional_significance;
      if (updateData.temporal_relevance !== undefined) updateDoc.temporal_relevance = updateData.temporal_relevance;
      if (updateData.access_frequency !== undefined) updateDoc.access_frequency = updateData.access_frequency;
      if (updateData.gate_scores) updateDoc.gate_scores = updateData.gate_scores;
      if (updateData.relationships) updateDoc.relationships = updateData.relationships;
      if (updateData.context_needed) updateDoc.context_needed = updateData.context_needed;
      if (updateData.retrieval_triggers) updateDoc.retrieval_triggers = updateData.retrieval_triggers;

      const result = await this.collection.findOneAndUpdate(
        { _id: id },
        { $set: updateDoc },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error('Memory embedding not found');
      }

      return {
        id: result._id,
        user_id: result.user_id,
        memory_type: result.memory_type,
        content_summary: result.content_summary,
        original_entry_id: result.original_entry_id,
        importance_score: result.importance_score,
        emotional_significance: result.emotional_significance,
        temporal_relevance: result.temporal_relevance,
        access_frequency: result.access_frequency,
        last_accessed: result.last_accessed,
        created_at: result.created_at,
        feature_vector: result.$vector,
        gate_scores: result.gate_scores,
        relationships: result.relationships,
        context_needed: result.context_needed,
        retrieval_triggers: result.retrieval_triggers,
        updated_at: result.updated_at
      };
    } catch (error) {
      throw new Error(`Failed to update memory embedding: ${error.message}`);
    }
  }

  // Delete memory embedding
  async deleteMemoryEmbedding(id) {
    try {
      await this.initialize();

      const result = await this.collection.deleteOne({ _id: id });

      if (result.deletedCount === 0) {
        throw new Error('Memory embedding not found');
      }

      return {
        id,
        deleted: true,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      throw new Error(`Failed to delete memory embedding: ${error.message}`);
    }
  }

  // Find similar memory embeddings using vector similarity
  async findSimilarMemoryEmbeddings(queryVector, options = {}) {
    try {
      await this.initialize();

      const { limit = 10, filters = {} } = options;
      
      // Build query with filters
      let query = {};
      
      if (filters.user_id) query.user_id = filters.user_id;
      if (filters.memory_type) query.memory_type = filters.memory_type;
      if (filters.min_importance_score) query.importance_score = { $gte: filters.min_importance_score };
      if (filters.min_emotional_significance) query.emotional_significance = { $gte: filters.min_emotional_significance };
      if (filters.min_temporal_relevance) query.temporal_relevance = { $gte: filters.min_temporal_relevance };
      
      if (filters.date_range) {
        query.created_at = {};
        if (filters.date_range.start) query.created_at.$gte = filters.date_range.start;
        if (filters.date_range.end) query.created_at.$lte = filters.date_range.end;
      }
      
      if (filters.retrieval_triggers && filters.retrieval_triggers.length > 0) {
        query.retrieval_triggers = { $in: filters.retrieval_triggers };
      }

      // Perform vector similarity search
      const results = await this.collection.find(
        query,
        {
          sort: { $vector: queryVector },
          limit,
          includeSimilarity: true
        }
      ).toArray();

      return {
        query_vector_dimensions: queryVector.length,
        results_count: results.length,
        max_similarity_score: results.length > 0 ? results[0].$similarity : 0,
        min_similarity_score: results.length > 0 ? results[results.length - 1].$similarity : 0,
        results: results.map(result => ({
          id: result._id,
          user_id: result.user_id,
          memory_type: result.memory_type,
          content_summary: result.content_summary,
          original_entry_id: result.original_entry_id,
          importance_score: result.importance_score,
          emotional_significance: result.emotional_significance,
          temporal_relevance: result.temporal_relevance,
          access_frequency: result.access_frequency,
          last_accessed: result.last_accessed,
          created_at: result.created_at,
          feature_vector: result.$vector,
          gate_scores: result.gate_scores,
          relationships: result.relationships,
          context_needed: result.context_needed,
          retrieval_triggers: result.retrieval_triggers,
          similarity_score: result.$similarity,
          updated_at: result.updated_at
        }))
      };
    } catch (error) {
      throw new Error(`Failed to find similar memory embeddings: ${error.message}`);
    }
  }

  // Create multiple memory embeddings in batch
  async createMemoryEmbeddingsBatch(embeddingsArray) {
    try {
      await this.initialize();

      const documents = embeddingsArray.map(embeddingData => ({
        _id: uuidv4(),
        user_id: embeddingData.user_id,
        memory_type: embeddingData.memory_type,
        content_summary: embeddingData.content_summary,
        original_entry_id: embeddingData.original_entry_id,
        importance_score: embeddingData.importance_score,
        emotional_significance: embeddingData.emotional_significance,
        temporal_relevance: embeddingData.temporal_relevance,
        access_frequency: embeddingData.access_frequency || 0,
        last_accessed: new Date().toISOString(),
        created_at: new Date().toISOString(),
        $vector: embeddingData.feature_vector,
        gate_scores: embeddingData.gate_scores,
        relationships: embeddingData.relationships || [],
        context_needed: embeddingData.context_needed || {},
        retrieval_triggers: embeddingData.retrieval_triggers || [],
        updated_at: new Date().toISOString()
      }));

      const result = await this.collection.insertMany(documents);

      return {
        inserted_count: result.insertedCount,
        inserted_ids: result.insertedIds,
        documents: documents.map(doc => ({
          id: doc._id,
          user_id: doc.user_id,
          memory_type: doc.memory_type,
          content_summary: doc.content_summary,
          original_entry_id: doc.original_entry_id,
          created_at: doc.created_at
        }))
      };
    } catch (error) {
      throw new Error(`Failed to create memory embeddings batch: ${error.message}`);
    }
  }

  // Query memory embeddings with filters and pagination
  async queryMemoryEmbeddings(queryOptions = {}) {
    try {
      await this.initialize();

      const {
        user_id,
        memory_type,
        min_importance_score,
        min_emotional_significance,
        min_temporal_relevance,
        date_range,
        limit = 20,
        offset = 0,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = queryOptions;

      // Build query
      let query = {};
      
      if (user_id) query.user_id = user_id;
      if (memory_type) query.memory_type = memory_type;
      if (min_importance_score) query.importance_score = { $gte: min_importance_score };
      if (min_emotional_significance) query.emotional_significance = { $gte: min_emotional_significance };
      if (min_temporal_relevance) query.temporal_relevance = { $gte: min_temporal_relevance };
      
      if (date_range) {
        query.created_at = {};
        if (date_range.start) query.created_at.$gte = date_range.start;
        if (date_range.end) query.created_at.$lte = date_range.end;
      }

      // Build sort
      const sortOrder = sort_order === 'asc' ? 1 : -1;
      const sortObj = { [sort_by]: sortOrder };

      // Execute query with pagination
      const results = await this.collection.find(query)
        .sort(sortObj)
        .skip(offset)
        .limit(limit)
        .toArray();

      // Get total count for pagination
      const totalCount = await this.collection.countDocuments(query);

      return {
        results: results.map(result => ({
          id: result._id,
          user_id: result.user_id,
          memory_type: result.memory_type,
          content_summary: result.content_summary,
          original_entry_id: result.original_entry_id,
          importance_score: result.importance_score,
          emotional_significance: result.emotional_significance,
          temporal_relevance: result.temporal_relevance,
          access_frequency: result.access_frequency,
          last_accessed: result.last_accessed,
          created_at: result.created_at,
          gate_scores: result.gate_scores,
          relationships: result.relationships,
          context_needed: result.context_needed,
          retrieval_triggers: result.retrieval_triggers,
          updated_at: result.updated_at
        })),
        pagination: {
          total_count: totalCount,
          current_page: Math.floor(offset / limit) + 1,
          total_pages: Math.ceil(totalCount / limit),
          has_next: offset + limit < totalCount,
          has_previous: offset > 0
        }
      };
    } catch (error) {
      throw new Error(`Failed to query memory embeddings: ${error.message}`);
    }
  }

  // Update access frequency and last accessed time
  async recordMemoryAccess(id) {
    try {
      await this.initialize();

      const result = await this.collection.findOneAndUpdate(
        { _id: id },
        { 
          $inc: { access_frequency: 1 },
          $set: { 
            last_accessed: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error('Memory embedding not found');
      }

      return {
        id: result._id,
        access_frequency: result.access_frequency,
        last_accessed: result.last_accessed
      };
    } catch (error) {
      throw new Error(`Failed to record memory access: ${error.message}`);
    }
  }

  // Get collection statistics
  async getStatistics() {
    try {
      await this.initialize();

      const totalCount = await this.collection.countDocuments({});
      
      // Get statistics by memory type
      const memoryTypeStats = await this.collection.aggregate([
        { $group: { _id: '$memory_type', count: { $sum: 1 } } }
      ]).toArray();

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentCount = await this.collection.countDocuments({
        created_at: { $gte: sevenDaysAgo.toISOString() }
      });

      // Average scores
      const scoreStats = await this.collection.aggregate([
        {
          $group: {
            _id: null,
            avg_importance_score: { $avg: '$importance_score' },
            avg_emotional_significance: { $avg: '$emotional_significance' },
            avg_temporal_relevance: { $avg: '$temporal_relevance' },
            avg_access_frequency: { $avg: '$access_frequency' }
          }
        }
      ]).toArray();

      return {
        total_memories: totalCount,
        recent_memories_7_days: recentCount,
        memory_type_distribution: memoryTypeStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        score_statistics: scoreStats[0] || {
          avg_importance_score: 0,
          avg_emotional_significance: 0,
          avg_temporal_relevance: 0,
          avg_access_frequency: 0
        },
        collection_info: {
          name: 'memory_embeddings',
          vector_dimensions: 90
        }
      };
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
}

// Export singleton instance
const memoryEmbeddingService = new MemoryEmbeddingService();
module.exports = memoryEmbeddingService;
