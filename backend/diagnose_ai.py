import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load env from backend dir
backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(backend_dir, ".env"))

api_key = os.getenv("GEMINI_API_KEY")
print(f"Testing API Key: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")

genai.configure(api_key=api_key)

models_to_test = ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-1.5-flash']

for model_name in models_to_test:
    try:
        print(f"Testing model: {model_name}...")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hi, are you working?", generation_config=genai.types.GenerationConfig(max_output_tokens=10))
        print(f"SUCCESS with {model_name}: {response.text.strip()}")
        break
    except Exception as e:
        print(f"FAILED with {model_name}: {e}")
