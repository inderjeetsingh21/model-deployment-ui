# Quick Start Guide

Get your first model deployed in 5 minutes!

## Prerequisites Check

```bash
# Check Python version (need 3.9+)
python3 --version

# Check Node.js version (need 18+)
node --version

# Check npm
npm --version
```

## Installation (2 minutes)

### 1. Install Backend Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies

```bash
cd ..
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Use default settings - no changes needed for testing!
```

## Start Services (30 seconds)

### Terminal 1 - Backend

```bash
cd backend
source venv/bin/activate
python -m backend.api_server
```

Wait for:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2 - Frontend

```bash
npm run dev
```

Wait for:
```
➜  Local:   http://localhost:3000/
```

## Deploy Your First Model (2 minutes)

### 1. Open Browser
Navigate to: http://localhost:3000

### 2. Configure Model (Step 1/5)
- **Model Source:** HuggingFace Hub (default)
- **Model ID:** `distilbert-base-uncased-finetuned-sst-2-english`
- **Model Type:** NLP/Text
- **Deployment Name:** `my-first-model`
- Click **Next**

### 3. Hardware (Step 2/5)
- **Device:** Auto (default)
- Click **Next**

### 4. Dependencies (Step 3/5)
- Nothing to configure
- Click **Next**

### 5. Review (Step 4/5)
- Check your settings
- Click **Next**

### 6. Deploy (Step 5/5)
- Review summary
- Click **Deploy**

### 7. Watch Progress
- See real-time progress
- Model downloads (~268MB, 1-2 minutes)
- Wait for "Deployment Successful!"

## Test Your Model (1 minute)

### Option 1: cURL

```bash
# Copy the endpoint URL from deployment result (e.g., http://localhost:8100/predict)
curl -X POST http://localhost:8100/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "I love this platform!"}'
```

Expected result:
```json
{
  "status": "success",
  "result": [{
    "label": "POSITIVE",
    "score": 0.9998
  }]
}
```

### Option 2: Python

```python
import requests

response = requests.post(
    'http://localhost:8100/predict',
    json={"text": "I love this platform!"}
)

print(response.json())
```

### Option 3: API Docs

1. Open http://localhost:8000/docs
2. Find `/api/v1/deployments/{deployment_id}/inference`
3. Click "Try it out"
4. Enter: `deployment_id`: `my-first-model`
5. Enter: `{"text": "This is amazing!"}`
6. Click "Execute"

## What Just Happened?

✅ Model downloaded from HuggingFace  
✅ Model loaded into memory  
✅ API endpoint created  
✅ Ready to accept requests  

## Try Another Model

Now deploy GPT-2 for text generation:

1. Click "Deploy Another Model"
2. Model ID: `gpt2`
3. Model Type: NLP/Text
4. Name: `gpt2-generator`
5. Deploy!

Test GPT-2:
```bash
curl -X POST http://localhost:8101/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "Once upon a time", "max_length": 50}'
```

## Common Issues

### Port Already in Use

**Error:** `Address already in use`

**Solution:** Edit `.env`:
```env
BACKEND_PORT=8001
FRONTEND_PORT=3001
```

### Python Dependencies Error

**Error:** `No module named 'transformers'`

**Solution:** Activate venv first:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### WebSocket Connection Failed

**Error:** Progress not showing

**Solution:** Ensure backend is running and check CORS settings in `.env`

## Next Steps

- 📚 Read [README.md](README.md) for detailed documentation
- 🎓 Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) to understand what happens
- 🚀 Try different models from HuggingFace
- 🔧 Customize configuration in `.env`
- 🌐 Build your application using the API

## Quick Reference

| Action | Command |
|--------|---------|
| Start Backend | `python -m backend.api_server` |
| Start Frontend | `npm run dev` |
| View Logs | Check terminal output |
| API Docs | http://localhost:8000/docs |
| Frontend | http://localhost:3000 |
| Stop Services | Ctrl+C in terminals |

## Popular Models to Try

### Sentiment Analysis
- `distilbert-base-uncased-finetuned-sst-2-english`
- `cardiffnlp/twitter-roberta-base-sentiment`

### Text Generation
- `gpt2` (small)
- `facebook/opt-125m`

### Question Answering
- `deepset/roberta-base-squad2`
- `distilbert-base-cased-distilled-squad`

## Support

- 📖 Full docs: [README.md](README.md)
- 🐛 Issues: Create GitHub issue
- 💡 Questions: Check DEPLOYMENT_GUIDE.md

Happy deploying! 🚀
