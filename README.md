# MyMindSpace Semantic Search Memory Database Service

A specialized vector database CRUD service for storing and retrieving memory embeddings for intelligent semantic search and memory management in the MyMindSpace mental wellness platform.

## 🎯 Purpose

This service manages memory embeddings with 90-dimensional engineered feature vectors from Component 4:
- **Memory Types**: conversation, event, emotion, insight
- **Intelligent Gating**: Forget/input/output scores with confidence
- **Relationship Mapping**: Connected memory networks
- **Access Tracking**: Frequency and temporal patterns

Designed for sophisticated memory retrieval, context awareness, and semantic understanding across user interactions.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Git installed
- AstraDB account (free tier available at [astra.datastax.com](https://astra.datastax.com))

### 1. Clone & Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd SementicSearchDB

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. AstraDB Setup
1. **Create Database**: Go to [AstraDB Console](https://astra.datastax.com) → Create Database
   - Database Name: `mymindspace-semantic-search`
   - Keyspace: `default_keyspace`
   - Region: Choose closest to your deployment

2. **Get Credentials**: After database creation
   - Copy Database ID from dashboard
   - Generate Application Token with Database Admin permissions
   - Note the database region

3. **Update .env file**:
```bash
ASTRA_DB_ID=your_database_id_here
ASTRA_DB_REGION=your_region_here
ASTRA_DB_KEYSPACE=default_keyspace
ASTRA_DB_APPLICATION_TOKEN=your_token_here
API_KEY=your_secure_api_key_here
```

### 3. Start Service
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### 4. Verify Setup
Check service health:
```bash
curl http://localhost:3000/health
```

## 🗄️ Schema

### Memory Embeddings Collection (`memory_embeddings`)

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "memory_type": "conversation | event | emotion | insight",
  "content_summary": "text",
  "original_entry_id": "uuid", 
  "importance_score": "float",
  "emotional_significance": "float",
  "temporal_relevance": "float",
  "access_frequency": "integer",
  "last_accessed": "datetime",
  "created_at": "datetime",
  "gate_scores": {
    "forget_score": "float",
    "input_score": "float", 
    "output_score": "float",
    "confidence": "float"
  },
  "feature_vector": [90 dimensions],
  "relationships": ["array", "of", "related", "memory_ids"],
  "context_needed": "jsonb",
  "retrieval_triggers": ["keywords", "that", "trigger", "this", "memory"]
}
```

## 🚀 API Endpoints & Usage

### Authentication
All API endpoints (except `/health`) require an API key in the header:
```bash
X-API-Key: your_api_key_here
```

### Core CRUD Operations

#### Create Memory Embedding
```bash
POST /api/memory-embeddings
Content-Type: application/json
X-API-Key: your_api_key_here

{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "memory_type": "conversation",
  "content_summary": "User discussed anxiety about upcoming exams and developed coping strategies",
  "original_entry_id": "550e8400-e29b-41d4-a716-446655440001",
  "importance_score": 0.8,
  "emotional_significance": 0.7,
  "temporal_relevance": 0.9,
  "access_frequency": 0,
  "feature_vector": [0.1, 0.2, ...90 numbers],
  "gate_scores": {
    "forget_score": 0.2,
    "input_score": 0.8,
    "output_score": 0.9,
    "confidence": 0.85
  },
  "relationships": ["550e8400-e29b-41d4-a716-446655440002"],
  "context_needed": {
    "academic_pressure": true,
    "support_system": "family",
    "coping_mechanisms": ["breathing", "meditation"]
  },
  "retrieval_triggers": ["anxiety", "exam", "stress", "coping", "meditation"]
}
```

#### Get Memory by ID
```bash
GET /api/memory-embeddings/550e8400-e29b-41d4-a716-446655440000
X-API-Key: your_api_key_here
```

#### Update Memory
```bash
PUT /api/memory-embeddings/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
X-API-Key: your_api_key_here

{
  "importance_score": 0.9,
  "retrieval_triggers": ["anxiety", "exam", "stress", "coping", "meditation", "success"]
}
```

#### Delete Memory
```bash
DELETE /api/memory-embeddings/550e8400-e29b-41d4-a716-446655440000
X-API-Key: your_api_key_here
```

### Advanced Operations

#### Vector Similarity Search
Find memories similar to a given feature vector:
```bash
POST /api/memory-embeddings/similarity
Content-Type: application/json
X-API-Key: your_api_key_here

{
  "feature_vector": [0.1, 0.2, ...90 numbers],
  "limit": 10,
  "filters": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "memory_type": "conversation",
    "min_importance_score": 0.5,
    "min_emotional_significance": 0.3,
    "retrieval_triggers": ["anxiety", "stress"]
  }
}
```

#### Batch Create Memories
```bash
POST /api/memory-embeddings/batch
Content-Type: application/json
X-API-Key: your_api_key_here

{
  "embeddings": [
    { /* memory object 1 */ },
    { /* memory object 2 */ },
    // ... up to 50 memories
  ]
}
```

#### Query with Filters
```bash
GET /api/memory-embeddings/query?user_id=550e8400-e29b-41d4-a716-446655440000&memory_type=insight&min_importance_score=0.7&limit=20&sort_by=importance_score&sort_order=desc
X-API-Key: your_api_key_here
```

#### Get User's Important Memories
```bash
GET /api/memory-embeddings/user/550e8400-e29b-41d4-a716-446655440000/important?min_score=0.8&limit=10
X-API-Key: your_api_key_here
```

#### Record Memory Access
```bash
POST /api/memory-embeddings/550e8400-e29b-41d4-a716-446655440000/access
X-API-Key: your_api_key_here
```

#### Get Related Memories
```bash
GET /api/memory-embeddings/user/550e8400-e29b-41d4-a716-446655440000/relationships/550e8400-e29b-41d4-a716-446655440001
X-API-Key: your_api_key_here
```

#### Collection Statistics
```bash
GET /api/memory-embeddings/stats
X-API-Key: your_api_key_here
```

### Response Format
All successful responses follow this format:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error description",
  "details": "Additional error details"
}
```

## 📋 Environment Variables

Create a `.env` file with these variables:

```bash
# AstraDB Configuration (Required)
ASTRA_DB_ID=your_database_id
ASTRA_DB_REGION=us-east1
ASTRA_DB_KEYSPACE=default_keyspace
ASTRA_DB_APPLICATION_TOKEN=your_application_token

# Server Configuration
NODE_ENV=development
PORT=3000
API_KEY=your_secure_api_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Vector Configuration
DEFAULT_VECTOR_DIMENSIONS=90
MAX_VECTOR_DIMENSIONS=4096
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test API Endpoints
Use the provided examples or tools like Postman/Insomnia:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test with API key
curl -H "X-API-Key: your_api_key_here" http://localhost:3000/api/memory-embeddings/stats
```

## 🐳 Docker Deployment

### Build and Run Locally
```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run

# Or use docker commands directly
docker build -t mymindspace-semantic-search .
docker run -p 3000:3000 --env-file .env mymindspace-semantic-search
```

### Production Deployment
```bash
# Build for production
docker build -t mymindspace-semantic-search:prod .

# Run with production config
docker run -d \
  --name semantic-search-service \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e ASTRA_DB_ID=your_id \
  -e ASTRA_DB_REGION=your_region \
  -e ASTRA_DB_KEYSPACE=default_keyspace \
  -e ASTRA_DB_APPLICATION_TOKEN=your_token \
  -e API_KEY=your_secure_api_key \
  mymindspace-semantic-search:prod
```

## ☁️ Google Cloud Deployment

### Deploy to Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/semantic-search-service
gcloud run deploy semantic-search-service \
  --image gcr.io/YOUR_PROJECT_ID/semantic-search-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-env-vars ASTRA_DB_ID=your_id \
  --set-env-vars ASTRA_DB_REGION=your_region \
  --set-env-vars ASTRA_DB_KEYSPACE=default_keyspace \
  --set-env-vars ASTRA_DB_APPLICATION_TOKEN=your_token \
  --set-env-vars API_KEY=your_secure_api_key
```

### Deploy to App Engine
```bash
# Deploy using app.yaml
gcloud app deploy
```

## 💡 Usage Examples

### Node.js Client
```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'X-API-Key': 'your_api_key_here',
    'Content-Type': 'application/json'
  }
});

// Create memory embedding
const createMemory = async (memoryData) => {
  try {
    const response = await client.post('/memory-embeddings', memoryData);
    return response.data;
  } catch (error) {
    console.error('Error creating memory:', error.response.data);
  }
};

// Search similar memories
const searchSimilar = async (featureVector, filters = {}) => {
  try {
    const response = await client.post('/memory-embeddings/similarity', {
      feature_vector: featureVector,
      limit: 10,
      filters
    });
    return response.data;
  } catch (error) {
    console.error('Error searching memories:', error.response.data);
  }
};

// Record memory access
const recordAccess = async (memoryId) => {
  try {
    const response = await client.post(`/memory-embeddings/${memoryId}/access`);
    return response.data;
  } catch (error) {
    console.error('Error recording access:', error.response.data);
  }
};
```

### Python Client
```python
import requests
import json

class SemanticSearchClient:
    def __init__(self, base_url="http://localhost:3000/api", api_key="your_api_key_here"):
        self.base_url = base_url
        self.headers = {
            "X-API-Key": api_key,
            "Content-Type": "application/json"
        }
    
    def create_memory(self, memory_data):
        response = requests.post(
            f"{self.base_url}/memory-embeddings",
            headers=self.headers,
            json=memory_data
        )
        return response.json()
    
    def search_similar(self, feature_vector, filters=None, limit=10):
        payload = {
            "feature_vector": feature_vector,
            "limit": limit,
            "filters": filters or {}
        }
        response = requests.post(
            f"{self.base_url}/memory-embeddings/similarity",
            headers=self.headers,
            json=payload
        )
        return response.json()
    
    def get_important_memories(self, user_id, min_score=0.7, limit=10):
        response = requests.get(
            f"{self.base_url}/memory-embeddings/user/{user_id}/important",
            headers=self.headers,
            params={"min_score": min_score, "limit": limit}
        )
        return response.json()

# Usage
client = SemanticSearchClient()
important_memories = client.get_important_memories("user123", min_score=0.8)
```

## 🔍 Monitoring & Health

### Health Check
The service provides a comprehensive health check endpoint:
```bash
GET /health
```

Response includes:
- Service status
- Database connectivity
- Uptime information
- Version details

### Logging
The service uses structured logging with different levels:
- `info`: General operation logs
- `error`: Error conditions
- `warn`: Warning conditions

Set log level via `LOG_LEVEL` environment variable.

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```
Error: AstraDB connection failed
```
**Solutions:**
- Verify `ASTRA_DB_APPLICATION_TOKEN` is correct
- Check `ASTRA_DB_ID` and `ASTRA_DB_REGION`
- Ensure database is active in AstraDB console
- Verify keyspace exists (use `default_keyspace` if unsure)

#### 2. API Key Issues
```
Error: Invalid or missing API key
```
**Solutions:**
- Set `API_KEY` in environment variables
- Include `X-API-Key` header in all requests
- In development, API key validation is relaxed

#### 3. Vector Dimension Mismatch
```
Error: Vector dimension mismatch
```
**Solutions:**
- Ensure feature vectors have exactly 90 dimensions
- Check your feature engineering pipeline
- Verify Component 4 output format

#### 4. Memory Relationship Errors
```
Error: Related memory not found
```
**Solutions:**
- Verify relationship IDs exist before adding
- Check user permissions for related memories
- Handle broken relationships gracefully

### Debug Mode
Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

## 🏗️ Architecture & Integration

### Service Architecture
```
┌─────────────────┐    HTTP/JSON    ┌─────────────────┐    DataStax     ┌─────────────────┐
│   Client App    │ ──────────────► │ Semantic Search │ ──────────────► │   AstraDB       │
│                 │                 │    Service      │                 │  Vector Store   │
│  (React/Node)   │ ◄────────────── │  (Express.js)   │ ◄────────────── │  (Cassandra)    │
└─────────────────┘    API Key      └─────────────────┘   SDK/HTTP      └─────────────────┘
```

### Integration with MyMindSpace
This service is designed to integrate seamlessly with the MyMindSpace ecosystem:

1. **Component 4**: Receives 90-dimensional engineered features
2. **Memory Networks**: Builds relationship graphs between memories
3. **Context Engine**: Provides contextual memory retrieval
4. **Analytics Service**: Tracks memory access patterns and importance

### Microservice Communication
```javascript
// Example integration with other MyMindSpace services
const semanticSearchService = {
  baseURL: process.env.SEMANTIC_SEARCH_SERVICE_URL,
  apiKey: process.env.SEMANTIC_SEARCH_API_KEY
};

// Store processed memory
const storeMemory = async (memory, features) => {
  await axios.post(`${semanticSearchService.baseURL}/api/memory-embeddings`, {
    user_id: memory.userId,
    memory_type: memory.type,
    content_summary: memory.summary,
    original_entry_id: memory.entryId,
    feature_vector: features,
    // ... other fields
  }, {
    headers: { 'X-API-Key': semanticSearchService.apiKey }
  });
};
```

## 🔧 Development & Customization

### Project Structure
```
SementicSearchDB/
├── config/
│   └── astradb.js              # Database connection & config
├── middleware/
│   ├── errorHandler.js         # Centralized error handling
│   └── validation.js           # Joi schema validation
├── routes/
│   └── memoryEmbeddings.js     # REST API endpoints
├── services/
│   └── memoryEmbeddingService.js # Business logic & DB operations
├── tests/
│   ├── setup.js               # Test configuration
│   └── *.test.js             # Test suites
├── .env                      # Environment configuration
├── server.js                 # Express app setup
└── package.json              # Dependencies & scripts
```

### Extending the Service

#### Adding New Memory Types
```javascript
// In middleware/validation.js - add new memory type
memory_type: Joi.string().valid('conversation', 'event', 'emotion', 'insight', 'custom_type').required()
```

#### Custom Analysis Endpoints
```javascript
// In routes/memoryEmbeddings.js
router.get('/analysis/:userId/patterns', async (req, res, next) => {
  try {
    const patterns = await memoryEmbeddingService.analyzeMemoryPatterns(req.params.userId);
    res.json({ success: true, data: patterns });
  } catch (error) {
    next(error);
  }
});
```

## 🔐 Security Considerations

### API Security
- **API Key Authentication**: Required for all operations
- **Rate Limiting**: 100 requests per 15 minutes by default
- **CORS**: Configured for specific origins
- **Input Validation**: Comprehensive Joi schema validation
- **User Isolation**: All queries are user-scoped

### Data Security
- **Memory Isolation**: Users can only access their own memories
- **Relationship Validation**: Prevents unauthorized memory linking
- **Access Logging**: All memory access is tracked
- **Encryption**: Data encrypted at rest and in transit (AstraDB)

## 📊 Performance & Scaling

### Performance Optimization
- **Vector Indexing**: AstraDB automatically indexes 90D vectors for fast similarity search
- **Relationship Caching**: Frequently accessed relationships are optimized
- **Access Pattern Tracking**: Identifies hot memories for caching
- **Batch Operations**: Use bulk endpoints for high-throughput scenarios

### Scaling Considerations
- **Memory Lifecycle**: Automatic importance decay over time
- **Relationship Pruning**: Cleanup broken or low-value relationships
- **Access-based Optimization**: Prioritize frequently accessed memories
- **Geographic Distribution**: AstraDB global distribution for low latency

## 🤝 Contributing

### Development Setup
```bash
# Clone and setup
git clone <repository-url>
cd SementicSearchDB
npm install

# Start development server
npm run dev

# Run tests
npm test
```

### Code Standards
- Use ESLint configuration provided
- Write tests for new functionality
- Follow existing patterns for consistency
- Update documentation for API changes

## 📝 License & Support

### License
MIT License - Part of the MyMindSpace mental wellness platform.

### Support
- **Documentation**: This README and inline code comments
- **Issues**: Create GitHub issues for bugs or feature requests
- **Community**: MyMindSpace developer community

### Changelog
- **v1.0.0**: Initial release with memory embedding CRUD and relationship management

---

**MyMindSpace Semantic Search Service** - Powering intelligent memory retrieval and context awareness through advanced vector database operations and relationship mapping.
