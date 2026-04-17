import os
from dotenv import load_dotenv
import google.generativeai as genai

# ai_service.py lives in backend/services/ → go up one level to get backend/
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(dotenv_path=os.path.join(_backend_dir, ".env"))

from langchain_text_splitters import RecursiveCharacterTextSplitter

class AIService:
    def __init__(self):
        # ── CONFIGURATION ──
        self.api_key = os.getenv("GEMINI_API_KEY")
        
        # Initialize Stable Gemini SDK (Original Path)
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-flash-latest')
        
        # ── RAG COMPONENTS ──
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        from supabase.client import create_client
        
        self.embedder = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=self.api_key)
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.supabase = create_client(self.supabase_url, self.supabase_key) if (self.supabase_url and self.supabase_key) else None
        
        self.splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

    def ingest_text(self, text, ws_id):
        """Processes text and saves it to the Supabase Vector Store."""
        from langchain_community.vectorstores import SupabaseVectorStore
        chunks = self.splitter.split_text(text)
        
        # This will create and save embeddings directly to your Supabase 'documents' table
        SupabaseVectorStore.from_texts(
            chunks, 
            self.embedder, 
            client=self.supabase, 
            table_name="documents", 
            query_name="match_documents",
            metadata=[{"ws_id": ws_id}] * len(chunks)
        )

    def _search_knowledge(self, question, ws_id):
        """Search the workspace knowledge vault in Supabase."""
        from langchain_community.vectorstores import SupabaseVectorStore
        try:
            vector_db = SupabaseVectorStore(
                client=self.supabase,
                embedding=self.embedder,
                table_name="documents",
                query_name="match_documents"
            )
            # Filter by workspace ID so bots don't mix up data
            docs_with_scores = vector_db.similarity_search_with_score(
                question, 
                k=3, 
                filter={"ws_id": ws_id}
            )
            if not docs_with_scores:
                return None, 999.0

            relevant = [(doc, score) for doc, score in docs_with_scores if score < 1.4]
            if not relevant:
                return None, 999.0

            best_score = relevant[0][1]
            context = "\n\n".join([doc.page_content for doc, _ in relevant])
            return context, best_score
        except Exception as e:
            print(f"[AIService] Knowledge search error: {e}")
            return None, 999.0

    def _call_gemini(self, prompt):
        """Calls the Stable Google Gemini API (google-generativeai)."""
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=1000,
                )
            )
            if response.text:
                return response.text.strip()
            return "I'm sorry, I couldn't generate a proper response right now."
        except Exception as e:
            with open("live_error.txt", "w") as f:
                f.write(f"LIVE STABLE ERROR: {str(e)}")
            print(f"[AIService] Gemini API Error: {e}")
            return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again soon!"

    def _search_internet(self, question):
        """Search the internet using DuckDuckGo as a fallback."""
        try:
            from duckduckgo_search import DDGS
            with DDGS() as ddgs:
                results = list(ddgs.text(question, max_results=3))
                if not results:
                    return ""
                return "\n".join([f"- {r.get('body', '')}" for r in results if r.get('body')])
        except Exception as e:
            print(f"[AIService] Internet search error: {e}")
            return ""

    def _match_custom_qa(self, question, custom_qa_list):
        """Finds the best fuzzy match for a question in the custom Q&A list."""
        from difflib import SequenceMatcher
        best_match = None
        highest_ratio = 0.0
        q_low = question.lower().strip()
        for qa in custom_qa_list:
            stored_q = qa['question'].lower().strip()
            ratio = SequenceMatcher(None, q_low, stored_q).ratio()
            if ratio > highest_ratio:
                highest_ratio = ratio
                best_match = qa
        
        if highest_ratio > 0.92:
            return best_match['answer'], highest_ratio
        return None, 0.0

    def get_response(self, question, ws_id, custom_qa=None, raw_knowledge=None):
        """AI Strategy using Gemini with strict premium formatting."""
        # ── STEP -1: Social Greetings ───────────────────────────────────
        q_low = question.lower().strip().replace("?", "").replace("!", "")
        if (any(q_low.startswith(w) for w in ["hi", "hello", "hey"]) and len(q_low) < 15) or any(q_low == word for word in ["good morning", "good afternoon", "who are you", "what is your name"]):
            return "Hello! I am the friendly VTAB Square AI Assistant. How can I help you today?"

        # ── STEP 0: Fuzzy Match Custom Q&A + Premium Reformat ──────────
        if custom_qa:
            best_ans, ratio = self._match_custom_qa(question, custom_qa)
            if best_ans and ratio > 0.92:
                # If we have a direct answer, still pass it through Gemini to ensure it's simplified and bulleted
                reformat_prompt = (
                    f"SYSTEM: You are a professional formatting assistant. Simplify the answer below into 2-3 clean, bold bullet points.\n"
                    f"ANSWER TO REFORMAT:\n{best_ans}\n\n"
                    f"FORMATTED ANSWER (BULLET POINTS ONLY):"
                )
                return self._call_gemini(reformat_prompt)

        # ── STEP 1: Official Website Knowledge (RAG) ─────────────────────────
        context, score = self._search_knowledge(question, ws_id)
        
        if context and score < 1.4:
            safe_context = context.replace("http://localhost:3000", "[Our Website]")
            safe_context = safe_context.replace("http://", "").replace("https://", "")
            
            prompt = (
                f"SYSTEM: You are the friendly official AI Marketing Assistant for VTAB Square.\n"
                f"CONTEXT: {safe_context}\n\n"
                f"INSTRUCTIONS:\n"
                f"1. Answer ONLY using the context. If not found, say you don't know.\n"
                f"2. Use ONLY 3-4 bullet points starting with '- '.\n"
                f"3. Use **bold** for all key services, features, and names.\n"
                f"4. NO paragraphs. NO intro sentences.\n\n"
                f"QUESTION: {question}\n"
                f"ANSWER:"
            )
            return self._call_gemini(prompt)

        # ── STEP 2: High-Capacity Context Fallback ────────────────────────────
        if raw_knowledge and len(raw_knowledge.strip()) > 10:
            safe_knowledge = raw_knowledge[:15000] 
            prompt = (
                f"SYSTEM: You are the VTAB Square Business AI. Provide a simplified scan-friendly answer using 3-4 **bold** bullet points based on the Context below.\n"
                f"RULES: Each bullet MUST start with a '*' on a NEW LINE. NO paragraphs. NO rambling.\n\n"
                f"CONTEXT:\n{safe_knowledge}\n\n"
                f"QUESTION: {question}\n"
                f"ANSWER:"
            )
            return self._call_gemini(prompt)

        # ── STEP 3: Automatic Internet Fallback ──────────────────────────────
        internet_context = self._search_internet(question)
        if internet_context:
            prompt = (
                f"SYSTEM: You are the VTAB Square AI representative. Provide a professional answer using 3-4 **bold** bullet points.\n"
                f"RULES: Each bullet MUST start with a '*' on a NEW LINE. Simplify the research below.\n\n"
                f"RESEARCH:\n{internet_context}\n\n"
                f"QUESTION: {question}\n\n"
                f"ANSWER:"
            )
            return self._call_gemini(prompt)

        return ("I'm sorry, I couldn't find a definitive answer for that in our records. "
                "Please reach out to our team directly for more specific info!")