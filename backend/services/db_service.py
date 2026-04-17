import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Always load .env from the backend folder
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(dotenv_path=os.path.join(_backend_dir, ".env"))

class DBService:
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise Exception("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
        
        # ── CONFIGURATION: Increased timeout to handle 'sleeping' Supabase projects ──
        from httpx import Timeout
        from supabase.client import ClientOptions
        
        opts = ClientOptions(postgrest_client_timeout=40.0, storage_client_timeout=40.0)
        self.db: Client = create_client(url, key, options=opts)
        print("[DBService] Connected to Supabase via REST API (40s timeout enabled)")

    # ── Users (Auth) ──────────────────────────────────────────────────────────
    def create_user(self, user_id, username, password_hash, role, ws_id=None, email=None, must_change_password=False):
        self.db.table("users").upsert({
            "id": user_id, "username": username, "password_hash": password_hash,
            "role": role, "ws_id": ws_id, "email": email,
            "must_change_password": 1 if must_change_password else 0
        }).execute()

    def get_user_by_username(self, username):
        res = self.db.table("users").select("*").eq("username", username).limit(1).execute()
        return res.data[0] if res.data else None

    def get_user_by_email(self, email):
        res = self.db.table("users").select("*").eq("email", email).limit(1).execute()
        return res.data[0] if res.data else None

    def update_user_otp(self, user_id, code, expiry):
        self.db.table("users").update({"otp_code": code, "otp_expiry": expiry}).eq("id", user_id).execute()

    def update_user_password(self, user_id, pw_hash):
        self.db.table("users").update({
            "password_hash": pw_hash, "otp_code": None, "otp_expiry": None, "must_change_password": 0
        }).eq("id", user_id).execute()

    def get_user_by_token(self, token):
        res = self.db.table("users").select("id, username, role, ws_id, email, must_change_password").eq("session_token", token).limit(1).execute()
        return res.data[0] if res.data else None

    def update_user_session(self, user_id, token):
        self.db.table("users").update({"session_token": token}).eq("id", user_id).execute()

    # ── Workspaces ────────────────────────────────────────────────────────────
    def save_workspace(self, ws_id, name, url=""):
        self.db.table("workspaces").upsert({"ws_id": ws_id, "name": name, "url": url}, on_conflict="ws_id").execute()

    def get_workspaces(self):
        res = self.db.table("workspaces").select("ws_id, name, url, status, created_at").order("created_at").execute()
        return [{"id": r["ws_id"], **r} for r in res.data] if res.data else []

    def rename_workspace(self, ws_id, new_name):
        self.db.table("workspaces").update({"name": new_name}).eq("ws_id", ws_id).execute()

    def delete_workspace(self, ws_id):
        self.db.table("workspaces").delete().eq("ws_id", ws_id).execute()

    # ── Chat Threads ──────────────────────────────────────────────────────────
    def create_chat_thread(self, chat_id, ws_id, title):
        self.db.table("chat_threads").insert({"id": chat_id, "ws_id": ws_id, "title": title}).execute()

    def get_chat_threads(self, ws_id):
        res = self.db.table("chat_threads").select("id, title, created_at").eq("ws_id", ws_id).order("created_at", desc=True).execute()
        if res.data:
            return res.data
        
        # Fallback: if no threads exist (e.g. after migration), infer them from chat_history
        h_res = self.db.table("chat_history").select("chat_id").eq("ws_id", ws_id).execute()
        if h_res.data:
            unique_ids = list(set([r["chat_id"] for r in h_res.data if r.get("chat_id")]))
            threads = []
            for cid in unique_ids:
                # Auto-create the thread in DB so it exists next time
                try:
                    self.db.table("chat_threads").upsert({"id": cid, "ws_id": ws_id, "title": "Archived Chat"}, on_conflict="id").execute()
                except:
                    pass
                threads.append({"id": cid, "title": "Archived Chat", "created_at": "2024-01-01T00:00:00Z"})
            return threads
        return []

    def delete_chat_thread(self, chat_id):
        self.db.table("chat_threads").delete().eq("id", chat_id).execute()

    # ── Chat Messages ─────────────────────────────────────────────────────────
    def save_chat(self, ws_id, chat_id, role, content):
        if not chat_id:
            chat_id = f"c_default_{ws_id}"
            self.db.table("chat_threads").upsert({"id": chat_id, "ws_id": ws_id, "title": "Old Chat"}, on_conflict="id").execute()
        self.db.table("chat_history").insert({"ws_id": ws_id, "chat_id": chat_id, "role": role, "content": content}).execute()

    def get_history(self, chat_id, limit=100):
        if not chat_id.startswith('c'):
            chat_id = f"c_default_{chat_id}"
        res = self.db.table("chat_history").select("role, content").eq("chat_id", chat_id).order("id", desc=True).limit(limit).execute()
        return list(reversed(res.data)) if res.data else []

    # ── Knowledge Tracking ───────────────────────────────────────────────────
    def save_knowledge_item(self, item_id, ws_id, name, k_type, size, content=""):
        self.db.table("knowledge_items").insert({"id": item_id, "ws_id": ws_id, "name": name, "type": k_type, "size": size, "content": content}).execute()

    def get_knowledge_items(self, ws_id):
        res = self.db.table("knowledge_items").select("id, name, type, size, created_at").eq("ws_id", ws_id).execute()
        return res.data if res.data else []

    def get_all_workspace_text(self, ws_id):
        res = self.db.table("knowledge_items").select("content").eq("ws_id", ws_id).execute()
        return "\n\n".join([r["content"] for r in res.data if r.get("content")]) if res.data else ""

    def delete_knowledge_item(self, item_id):
        self.db.table("knowledge_items").delete().eq("id", item_id).execute()

    # ── Custom Q&A ────────────────────────────────────────────────────────────
    def save_custom_qa(self, qa_id, ws_id, question, answer):
        self.db.table("custom_qa").insert({"id": qa_id, "ws_id": ws_id, "question": question, "answer": answer}).execute()

    def get_custom_qa(self, ws_id):
        res = self.db.table("custom_qa").select("id, question, answer").eq("ws_id", ws_id).order("created_at", desc=True).execute()
        return res.data if res.data else []

    def delete_custom_qa(self, qa_id):
        self.db.table("custom_qa").delete().eq("id", qa_id).execute()

    # ── Leads ──────────────────────────────────────────────────────────────────
    def create_lead(self, lead_id, ws_id, name, email, location, entity_type, org_name=None):
        self.db.table("leads").insert({
            "id": lead_id, "ws_id": ws_id, "name": name, "email": email,
            "location": location, "entity_type": entity_type, "org_name": org_name
        }).execute()

    def get_leads_by_workspace(self, ws_id):
        res = self.db.table("leads").select("*").eq("ws_id", ws_id).order("created_at", desc=True).execute()
        return res.data if res.data else []

    # ── Bot Reviews ──────────────────────────────────────────────────────────
    def save_bot_review(self, review_id, ws_id, rating, comment, user_name="Anonymous", user_email=""):
        self.db.table("bot_reviews").insert({
            "id": review_id, "ws_id": ws_id, "rating": rating,
            "comment": comment, "user_name": user_name, "user_email": user_email
        }).execute()

    def get_bot_reviews(self, ws_id):
        res = self.db.table("bot_reviews").select("id, rating, comment, user_name, user_email, created_at").eq("ws_id", ws_id).order("created_at", desc=True).execute()
        return res.data if res.data else []

    # ── Analytics ──────────────────────────────────────────────────────────────
    def get_admin_metrics(self):
        ws_res = self.db.table("workspaces").select("ws_id, created_at").execute()
        workspaces = ws_res.data or []
        total_clients = len(workspaces)
        from datetime import datetime, timezone
        today = datetime.now(timezone.utc).date().isoformat()
        new_today = sum(1 for w in workspaces if w.get("created_at", "").startswith(today))
        active_res = self.db.table("chat_history").select("ws_id").execute()
        active_ws = len(set(r["ws_id"] for r in (active_res.data or [])))
        retention = round((active_ws / total_clients * 100), 1) if total_clients > 0 else 0
        return {"total_clients": total_clients, "new_today": new_today, "retention": retention}

    # ── Bot Config & Persona ──────────────────────────────────────────────────
    def update_bot_persona(self, ws_id, name, greeting, url="", theme_primary="#2dd4bf",
                           theme_secondary="#064e40", theme_bg="glass", theme_font="Inter",
                           bot_avatar="/static/bot_avatar.png"):
        self.db.table("workspaces").update({
            "bot_name": name, "bot_greeting": greeting, "url": url,
            "theme_primary": theme_primary, "theme_secondary": theme_secondary,
            "theme_bg": theme_bg, "theme_font": theme_font, "bot_avatar_url": bot_avatar
        }).eq("ws_id", ws_id).execute()

    def get_workspace_config(self, ws_id):
        res = self.db.table("workspaces").select(
            "bot_name, bot_greeting, name, url, theme_primary, theme_secondary, theme_bg, theme_font, bot_avatar_url"
        ).eq("ws_id", ws_id).limit(1).execute()
        if res.data:
            r = res.data[0]
            return {
                "bot_name": r.get("bot_name", "AI Assistant"),
                "bot_greeting": r.get("bot_greeting", "How can I help you today?"),
                "ws_name": r.get("name", ""),
                "url": r.get("url", ""),
                "theme_primary": r.get("theme_primary", "#2dd4bf"),
                "theme_secondary": r.get("theme_secondary", "#064e40"),
                "theme_bg": r.get("theme_bg", "glass"),
                "theme_font": r.get("theme_font", "Inter"),
                "bot_avatar_url": r.get("bot_avatar_url", "/static/bot_avatar.png")
            }
        return {
            "bot_name": "AI Assistant", "bot_greeting": "How can I help you today?",
            "ws_name": "", "url": "", "theme_primary": "#2dd4bf", "theme_secondary": "#064e40",
            "theme_bg": "glass", "theme_font": "Inter", "bot_avatar_url": "/static/bot_avatar.png"
        }

    # ── Onboarding ────────────────────────────────────────────────────────────
    def save_onboarding_request(self, req_id, ws_name, org_name, email, ceo_t, ceo_f, ceo_m, ceo_l,
                                c_code, contact, addr1, addr2, addr3, approve_token, reject_token, temp_password):
        self.db.table("onboarding_requests").insert({
            "id": req_id, "workspace_name": ws_name, "org_name": org_name, "email": email,
            "ceo_title": ceo_t, "ceo_first_name": ceo_f, "ceo_middle_name": ceo_m, "ceo_last_name": ceo_l,
            "country_code": c_code, "contact_details": contact, "address_line_1": addr1,
            "address_line_2": addr2, "address_line_3": addr3, "approve_token": approve_token,
            "reject_token": reject_token, "temp_password": temp_password, "status": "pending"
        }).execute()

    def update_onboarding_request(self, req_id, ws_name, org_name, email, ceo_t, ceo_f, ceo_m, ceo_l,
                                   c_code, contact, addr1, addr2, addr3, approve_token, reject_token, temp_password):
        self.db.table("onboarding_requests").update({
            "workspace_name": ws_name, "org_name": org_name, "email": email,
            "ceo_title": ceo_t, "ceo_first_name": ceo_f, "ceo_middle_name": ceo_m, "ceo_last_name": ceo_l,
            "country_code": c_code, "contact_details": contact, "address_line_1": addr1,
            "address_line_2": addr2, "address_line_3": addr3, "approve_token": approve_token,
            "reject_token": reject_token, "temp_password": temp_password
        }).eq("id", req_id).execute()

    def delete_onboarding_request(self, req_id):
        self.db.table("onboarding_requests").delete().eq("id", req_id).execute()

    def get_onboarding_all(self):
        res = self.db.table("onboarding_requests").select("*").order("created_at", desc=True).execute()
        return res.data if res.data else []

    def get_onboarding_by_approve_token(self, token):
        res = self.db.table("onboarding_requests").select("*").eq("approve_token", token).limit(1).execute()
        return res.data[0] if res.data else None

    def get_onboarding_by_reject_token(self, token):
        res = self.db.table("onboarding_requests").select("*").eq("reject_token", token).limit(1).execute()
        return res.data[0] if res.data else None

    def approve_onboarding(self, request_id):
        self.db.table("onboarding_requests").update({
            "status": "approved", "approve_token": None, "reject_token": None
        }).eq("id", request_id).execute()

    def reject_onboarding(self, request_id):
        self.db.table("onboarding_requests").update({
            "status": "rejected", "approve_token": None, "reject_token": None
        }).eq("id", request_id).execute()

    def get_onboarding_by_token(self, token_field, token_value):
        res = self.db.table("onboarding_requests").select("*").eq(token_field, token_value).limit(1).execute()
        return res.data[0] if res.data else None

    def update_onboarding_status(self, request_id, status):
        self.db.table("onboarding_requests").update({"status": status}).eq("id", request_id).execute()

    # ── Missing utility methods ───────────────────────────────────────────────
    def rename_chat_thread(self, chat_id, title):
        self.db.table("chat_threads").update({"title": title}).eq("id", chat_id).execute()

    def get_knowledge_item(self, item_id):
        res = self.db.table("knowledge_items").select("id, ws_id, name, type, size").eq("id", item_id).limit(1).execute()
        return res.data[0] if res.data else None

    def delete_lead(self, lead_id):
        self.db.table("leads").delete().eq("id", lead_id).execute()

    def delete_user_by_email(self, email):
        """Used during workspace approval to prevent duplicate accounts."""
        self.db.table("users").delete().eq("email", email).execute()

    def get_client_analytics(self, ws_id, days='all'):
        """Returns chat analytics: question count, unique questions, review count."""
        from datetime import datetime, timezone, timedelta
        
        # 1. Fetch user questions from chat_history for this workspace
        h_res = self.db.table("chat_history").select("role, content, created_at").eq("ws_id", ws_id).eq("role", "user").order("created_at", desc=True).execute()
        user_messages_data = h_res.data or []

        # 2. Apply day filter manually
        if days != 'all' and user_messages_data:
            now = datetime.now(timezone.utc)
            if days == 'today':
                cutoff = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
            elif str(days).endswith('m'):
                cutoff = now - timedelta(days=30 * int(str(days)[:-1]))
            else:
                try:
                    cutoff = now - timedelta(days=int(days))
                except:
                    cutoff = now - timedelta(days=30) # fallback
            
            cutoff_str = cutoff.isoformat()
            user_messages_data = [m for m in user_messages_data if (m.get('created_at') or '') >= cutoff_str]

        user_messages = [m['content'] for m in user_messages_data if m.get('content')]
        
        # 3. Deduplicate while preserving order for 'Unique Questions' list
        seen = set()
        unique_questions = []
        for q in user_messages:
            q_clean = q.strip().lower()
            if q_clean not in seen:
                seen.add(q_clean)
                unique_questions.append(q)

        # 4. Review count
        rev_res = self.db.table("bot_reviews").select("id").eq("ws_id", ws_id).execute()
        review_count = len(rev_res.data) if rev_res.data else 0

        return {
            "total_questions": len(user_messages),
            "unique_questions": len(unique_questions),
            "unique_question_list": unique_questions[:50],
            "total_question_list": user_messages[:100], # Added for 'Full Question History' view
            "review_count": review_count
        }