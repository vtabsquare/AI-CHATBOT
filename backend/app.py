from flask import Flask, request, jsonify, send_from_directory, make_response
import os
import uuid
import mimetypes
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from flask_cors import CORS

mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')

from services.storage_service import StorageService
from services.ai_service import AIService
from services.scraper_service import ScraperService
from services.db_service import DBService
from services.mail_service import MailService

app = Flask(__name__)
# ── Robust CORS: Allowing all Render subdomains to prevent preflight blocks ─
import re
CORS(app, resources={r"/*": {
    "origins": [
        "http://localhost:5173", 
        re.compile(r"https://.*\.onrender\.com")
    ]
}})

@app.route("/")
def index():
    return jsonify({
        "status": "Online",
        "service": "VTAB Square AI API",
        "version": "1.0.1",
        "message": "Intelligence is active."
    })

@app.route("/api/ping")
def ping():
    """Lightweight keep-alive endpoint."""
    return jsonify({"status": "alive", "timestamp": uuid.uuid4().hex})


# ── Global error handler — always return JSON, never blank 500 ────────────
@app.errorhandler(Exception)
def handle_exception(e):
    from werkzeug.exceptions import HTTPException
    if isinstance(e, HTTPException) and e.code == 404:
        return e # Let 404s stay 404s
    
    import traceback
    err_str = str(e).lower()
    is_timeout = "timeout" in err_str or "connect" in err_str or "10060" in err_str
    print(f"[UNHANDLED ERROR] timeout={is_timeout}: {traceback.format_exc()}")
    
    return jsonify({
        "error": "Internal server error", 
        "detail": str(e),
        "retry_suggested": is_timeout
    }), 500

storage = StorageService()
ai = AIService()
scraper = ScraperService()
db = DBService()

BREVO_KEY = os.getenv("BREVO_API_KEY")
mail = MailService(BREVO_KEY)

os.makedirs("data_store/uploads", exist_ok=True)

# ── Seed admin accounts with User-specified passwords ──────────────────────
try:
    # Admin Account 1: Gokulnath M
    if not db.get_user_by_email("gokulnathm.vtab@gmail.com"):
        db.create_user("u_gokul1", "gokulnathm.vtab@gmail.com",
                       generate_password_hash("Gokul@45"), "admin", None, "gokulnathm.vtab@gmail.com")
    
    # Admin Account 2: Secondary Email
    if not db.get_user_by_email("gokulnath96880@gmail.com"):
        db.create_user("u_gokul2", "gokulnath96880@gmail.com",
                       generate_password_hash("Rohit1@45"), "admin", None, "gokulnath96880@gmail.com")
except Exception as e:
    print(f"[SEED ERROR] {e}")

@app.before_request
def log_request_info():
    print(f"[RECV] {request.method} {request.url}")

# ── Auth Decorator ────────────────────────────────────────────────────────────
def require_auth(allowed_roles=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return jsonify({"error": "Missing or invalid token"}), 401
            token = auth_header.split(" ")[1]
            user = db.get_user_by_token(token)
            if not user:
                return jsonify({"error": "Invalid token"}), 401
            if allowed_roles and user['role'] not in allowed_roles:
                return jsonify({"error": "Forbidden"}), 403
            request.user = user
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# ── HTML response helper (Premium Dark Theme) ──────────────────────────────
def html_page(title, emoji, heading, body_html, link_href=None, link_text=None):
    link_part = ""
    if link_href:
        link_part = f'''<a href="{link_href}" class="primary-btn">{link_text}</a>'''
    
    return f"""<!DOCTYPE html><html><head>
    <meta charset="utf-8"><title>{title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&display=swap" rel="stylesheet">
    <style>
        :root {{ 
            --nature-bg: #061a15;
            --nature-accent: #10b981;
            --nature-text: #e0e7e6;
            --nature-glass: rgba(10, 36, 32, 0.85);
        }}
        body {{
            font-family: 'Outfit', sans-serif;
            background: #061a15;
            color: var(--nature-text);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            overflow: hidden;
            position: relative;
        }}
        /* 🌲 The Forest Background */
        .page-bg {{
            position: fixed;
            inset: 0;
            z-index: -2;
            background: #061a15; /* Replaced localhost image with solid themed color */
            background-size: cover;
            background-position: center;
            transform: scale(1.05);
        }}
        .bg-overlay {{
            position: fixed;
            inset: 0;
            z-index: -1;
            background: rgba(6, 78, 64, 0.2);
            backdrop-filter: blur(3px);
        }}
        .card {{
            background: var(--nature-glass);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 48px;
            padding: 64px 48px;
            text-align: center;
            max-width: 480px;
            width: 90%;
            box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8);
            animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            overflow: hidden;
        }}
        @keyframes fadeIn {{ from {{ opacity: 0; transform: translateY(20px); }} to {{ opacity: 1; transform: translateY(0); }} }}
        
        h1 {{
            font-size: 32px; font-weight: 800; margin: 24px 0 16px;
            color: #fff;
            letter-spacing: -0.02em;
            position: relative; z-index: 1;
        }}
        p {{ color: #8aa9a5; line-height: 1.7; font-size: 16px; margin-bottom: 32px; position: relative; z-index: 1; }}
        .badge {{ font-size: 64px; margin-bottom: 8px; filter: drop-shadow(0 0 20px rgba(16,185,129,0.4)); }}
        b {{ color: #10b981; font-weight: 800; }}
        
        .primary-btn {{
            display: inline-block;
            background: linear-gradient(135deg, #064e40, #10b981);
            color: white;
            padding: 16px 40px;
            border-radius: 99px;
            text-decoration: none;
            font-weight: 800;
            font-size: 14px;
            letter-spacing: 0.02em;
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative; z-index: 1;
            text-transform: uppercase;
        }}
        .primary-btn:hover {{ transform: translateY(-5px) scale(1.05); box-shadow: 0 15px 40px rgba(16, 185, 129, 0.5); }}
    </style>
    </head>
    <body>
        <div class="page-bg"></div>
        <div class="bg-overlay"></div>
        <div class="card">
            <svg class="leaf leaf-1" viewBox="0 0 200 200"><path d="M100,20 C120,60 180,80 180,140 C180,180 140,180 100,160 C60,180 20,180 20,140 C20,80 80,60 100,20" /></svg>
            <svg class="leaf leaf-2" viewBox="0 0 200 200"><path d="M100,20 C120,60 180,80 180,140 C180,180 140,180 100,160 C60,180 20,180 20,140 C20,80 80,60 100,20" /></svg>
            <div class="badge">{emoji}</div>
            <h1>{heading}</h1>
            <p>{body_html}</p>
            {link_part}
        </div>
    </body></html>"""


# ==================== AUTHENTICATION ====================
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    user = db.get_user_by_email(email)
    if not user:
        user = db.get_user_by_username(email)
        
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({"error": "Invalid email or password"}), 401
        
    token = uuid.uuid4().hex
    db.update_user_session(user['id'], token)
    
    user_data = {
        "id": user['id'], "username": user['username'], "role": user['role'],
        "ws_id": user['ws_id'], "email": user['email'],
        "must_change_password": user.get('must_change_password', False)
    }
    
    # Inject Org Name for Clients
    if user['role'] == 'client' and user['ws_id']:
        ws_config = db.get_workspace_config(user['ws_id'])
        user_data['org_name'] = ws_config.get('ws_name') or ws_config.get('name')

    return jsonify({"token": token, "user": user_data})

@app.route('/api/auth/me', methods=['GET'])
@require_auth()
def get_me():
    user = request.user
    if user['role'] == 'client' and user['ws_id']:
        ws_config = db.get_workspace_config(user['ws_id'])
        user['org_name'] = ws_config.get('ws_name') or ws_config.get('name')
    return jsonify(user)

@app.route('/api/auth/change-password', methods=['POST'])
@require_auth()
def change_password():
    """Force-change password: verifies current password, sets new one, clears must_change_password flag."""
    data = request.json
    current_pw = data.get('current_password', '')
    new_pw = data.get('new_password', '')
    confirm_pw = data.get('confirm_password', '')

    if not current_pw or not new_pw or not confirm_pw:
        return jsonify({"error": "All fields are required"}), 400
    if new_pw != confirm_pw:
        return jsonify({"error": "New passwords do not match"}), 400
    if len(new_pw) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    # Re-fetch to get password_hash (request.user only has token-based fields)
    user_full = db.get_user_by_email(request.user['email']) or db.get_user_by_username(request.user['username'])
    if not user_full or not check_password_hash(user_full['password_hash'], current_pw):
        return jsonify({"error": "Current password is incorrect"}), 401

    db.update_user_password(request.user['id'], generate_password_hash(new_pw))
    return jsonify({"message": "Password changed successfully. Please log in again."})

@app.route('/api/auth/create_client', methods=['POST'])
@require_auth(allowed_roles=['admin'])
def create_client():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    ws_id = data.get('ws_id')
    if not username or not password or not ws_id:
        return jsonify({"error": "Missing fields"}), 400
    db.create_user(uuid.uuid4().hex, username, generate_password_hash(password), 'client', ws_id, email)
    return jsonify({"message": "Client user created successfully"}), 201

# ==================== PASSWORD RECOVERY ====================
@app.route('/api/auth/reset-password/request', methods=['POST'])
def request_password_reset():
    import random, datetime
    email = request.json.get('email')
    if not email:
        return jsonify({"error": "Email is required"}), 400
    user = db.get_user_by_email(email)
    if not user:
        return jsonify({"error": "User not found"}), 404
    code = f"{random.randint(1000, 9999)}"
    expiry = (datetime.datetime.now() + datetime.timedelta(minutes=10)).isoformat()
    db.update_user_otp(user['id'], code, expiry)
    if mail.send_otp(email, code):
        return jsonify({"status": "Code sent"})
    return jsonify({"error": "Failed to send email"}), 500

@app.route('/api/auth/reset-password/verify', methods=['POST'])
def verify_password_reset():
    import datetime
    data = request.json
    email, code = data.get('email'), data.get('code')
    user = db.get_user_by_email(email)
    if not user or user['otp_code'] != code:
        return jsonify({"error": "Invalid or expired code"}), 400
    if user['otp_expiry']:
        expiry = datetime.datetime.fromisoformat(user['otp_expiry'])
        if datetime.datetime.now() > expiry:
            return jsonify({"error": "Code has expired"}), 400
    return jsonify({"status": "Verified"})

@app.route('/api/auth/reset-password/confirm', methods=['POST'])
def confirm_password_reset():
    data = request.json
    email, code, new_password = data.get('email'), data.get('code'), data.get('password')
    user = db.get_user_by_email(email)
    if not user or user['otp_code'] != code:
        return jsonify({"error": "Unauthorized session"}), 401
    db.update_user_password(user['id'], generate_password_hash(new_password))
    return jsonify({"status": "Password updated successfully"})

# ==================== STATIC SERVING ====================
# Legacy serve_ui removed to avoid duplicate route collision with Health check

@app.route('/static/widget.js')
def serve_widget_js():
    path = os.path.join(os.path.dirname(__file__), 'static', 'widget.js')
    with open(path, 'r', encoding='utf-8') as f:
        return app.response_class(response=f.read(), status=200, mimetype='application/javascript')

@app.route('/static/widget.css')
def serve_widget_css():
    path = os.path.join(os.path.dirname(__file__), 'static', 'widget.css')
    with open(path, 'r', encoding='utf-8') as f:
        return app.response_class(response=f.read(), status=200, mimetype='text/css')

# ==================== WORKSPACES ====================
@app.route('/api/workspace', methods=['POST'])
def create_ws():
    name = request.json['name']
    url = request.json.get('url', '')
    ws_data = storage.create_ws(name)
    db.save_workspace(ws_data['id'], name, url)
    ws_data['url'] = url
    ws_data['status'] = 'active'
    return jsonify(ws_data)

@app.route('/api/client/persona', methods=['POST', 'GET'])
@require_auth()
def manage_persona():
    user = request.user
    ws_id = user['ws_id']
    if request.method == 'POST':
        data = request.json
        db.update_bot_persona(
            ws_id, 
            data.get('bot_name'), 
            data.get('bot_greeting'), 
            data.get('url', ''),
            theme_primary=data.get('theme_primary', '#2dd4bf'),
            theme_secondary=data.get('theme_secondary', '#064e40'),
            theme_bg=data.get('theme_bg', 'glass'),
            theme_font=data.get('theme_font', 'Inter'),
            bot_avatar=data.get('bot_avatar_url', '/static/bot_avatar.png')
        )
        return jsonify({"status": "Success"})
    else:
        return jsonify(db.get_workspace_config(ws_id))

@app.route('/api/workspaces', methods=['GET'])
@require_auth()
def get_workspaces():
    user = request.user
    all_ws = db.get_workspaces()
    if user['role'] == 'client':
        filtered = [ws for ws in all_ws if ws['id'] == user['ws_id']]
        return jsonify(filtered)
    return jsonify(all_ws)

# ── Bulk Dashboard Initialization (Performance Optimization) ─────────────────
@app.route('/api/dashboard/init', methods=['GET'])
@require_auth()
def dashboard_init():
    """Consolidates multiple setup fetches into a single high-speed payload."""
    user = request.user
    requested_ws_id = request.args.get('ws_id')
    
    # 1. Base Workspaces
    all_ws = db.get_workspaces()
    if user['role'] == 'client':
        workspaces = [ws for ws in all_ws if ws['id'] == user['ws_id']]
    else:
        workspaces = all_ws

    # 2. Determine targeted workspace data to include
    active_ws_id = requested_ws_id
    if not active_ws_id and workspaces:
        active_ws_id = workspaces[0]['id']

    payload = {
        "workspaces": workspaces,
        "active_ws_id": active_ws_id,
        "admin_data": None,
        "workspace_data": None
    }

    # 3. Admin-only globals
    if user['role'] == 'admin':
        payload["admin_data"] = {
            "metrics": db.get_admin_metrics(),
            "onboarding": db.get_onboarding_all()
        }

    # 4. Specific Workspace data (if ID is valid/authorized)
    if active_ws_id:
        if user['role'] == 'client' and user['ws_id'] != active_ws_id:
            pass # Authorized check failed
        else:
            payload["workspace_data"] = {
                "threads": db.get_chat_threads(active_ws_id),
                "knowledge": db.get_knowledge_items(active_ws_id),
                "persona": db.get_workspace_config(active_ws_id),
                "qa": db.get_custom_qa(active_ws_id),
                "reviews": db.get_bot_reviews(active_ws_id),
                "leads": db.get_leads_by_workspace(active_ws_id),
                "analytics": db.get_client_analytics(active_ws_id)
            }

    return jsonify(payload)

@app.route('/api/workspace/<ws_id>', methods=['PUT'])
@require_auth()
def rename_ws(ws_id):
    new_name = request.json.get('name')
    db.rename_workspace(ws_id, new_name)
    return jsonify({"status": "Success"})

@app.route('/api/workspace/<ws_id>', methods=['DELETE'])
@require_auth(allowed_roles=['admin'])
def delete_ws(ws_id):
    storage.delete_ws_storage(ws_id)
    db.delete_workspace(ws_id)
    return jsonify({"status": "Success, workspace and all data removed"})

# ==================== CHAT THREADS ====================
@app.route('/api/chat_thread', methods=['POST'])
@require_auth()
def create_chat_thread():
    data = request.json
    ws_id = data['workspace_id']
    title = data.get('title', 'New Chat')
    chat_id = f"c_{uuid.uuid4().hex[:8]}"
    db.create_chat_thread(chat_id, ws_id, title)
    return jsonify({"id": chat_id, "title": title})

@app.route('/api/chat_threads/<ws_id>', methods=['GET'])
@require_auth()
def get_chat_threads(ws_id):
    user = request.user
    if user['role'] == 'client' and user['ws_id'] != ws_id:
        return jsonify({"error": "Forbidden"}), 403
    return jsonify(db.get_chat_threads(ws_id))

@app.route('/api/chat_thread/<chat_id>', methods=['PUT'])
@require_auth()
def rename_chat_thread(chat_id):
    new_title = request.json.get('title')
    db.rename_chat_thread(chat_id, new_title)
    return jsonify({"status": "Success"})

@app.route('/api/chat_thread/<chat_id>', methods=['DELETE'])
@require_auth()
def delete_chat_thread(chat_id):
    db.delete_chat_thread(chat_id)
    return jsonify({"status": "Success"})

# ==================== KNOWLEDGE BASE ====================
@app.route('/api/knowledge/<ws_id>', methods=['GET'])
@require_auth()
def get_knowledge(ws_id):
    user = request.user
    if user['role'] == 'client' and user['ws_id'] != ws_id:
        return jsonify({"error": "Forbidden"}), 403
    return jsonify(db.get_knowledge_items(ws_id))

@app.route('/api/admin/training-stats/<ws_id>', methods=['GET'])
@require_auth()
def get_training_stats(ws_id):
    """Returns specialized metrics for the Training Dashboard."""
    user = request.user
    if user['role'] == 'client' and user['ws_id'] != ws_id:
        return jsonify({"error": "Forbidden"}), 403
    items = db.get_knowledge_items(ws_id)
    
    # 1. Deduplicate items for the main table (keep unique URLs/Files)
    # We use a dictionary keyed by 'name' to ensure uniqueness while preserving recent data
    unique_items_map = {}
    for item in items:
        name = item.get('name')
        if name and name not in unique_items_map:
            unique_items_map[name] = item
    unique_items = list(unique_items_map.values())

    # 2. Extract Recent Intel (Recent fragments with content snippets)
    recent_intel = []
    # db.get_knowledge_items returns items sorted by created_at DESC already.
    for item in items:
        # We only want items with actual content for intelligence tracking
        content = item.get('content', '')
        if content and len(content.strip()) > 30:
            snippet = content.strip()[:180] + "..." if len(content.strip()) > 180 else content.strip()
            recent_intel.append({
                "id": item['id'],
                "name": item['name'],
                "type": item['type'],
                "snippet": snippet,
                "timestamp": item['created_at']
            })
            if len(recent_intel) >= 5: # Limit to top 5 recent snippets
                break

    # 3. Calculate last sync
    last_sync = "Never"
    if items:
        # Simple string comparison for ISO dates
        last_sync = max([item['created_at'] for item in items])

    return jsonify({
        "total_chunks": len(items),
        "unique_sources": len(unique_items_map),
        "sources": list(unique_items_map.keys()),
        "last_sync": last_sync,
        "raw_items": unique_items, # The table will now show deduplicated sources
        "recent_intel": recent_intel # New section for visualizing learned info
    })

@app.route('/api/admin/check-updates/<ws_id>', methods=['GET'])
@require_auth()
def check_for_updates(ws_id):
    """Scans the workspace root URL to find links that aren't indexed yet."""
    config = db.get_workspace_config(ws_id)
    base_url = config.get('url')
    if not base_url:
        return jsonify({"status": "url_missing", "gaps": []})

    try:
        # Standard HTTP/HTTPS request for quick discovery
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(base_url, headers=headers, timeout=5, verify=False)
        if not response.ok:
            return jsonify({"status": "error", "message": "Could not reach website", "gaps": []})

        from bs4 import BeautifulSoup
        from urllib.parse import urljoin, urlparse
        
        soup = BeautifulSoup(response.text, 'html.parser')
        links = set()
        domain = urlparse(base_url).netloc
        
        for a in soup.find_all('a', href=True):
            full_url = urljoin(base_url, a['href']).split('#')[0].split('?')[0].rstrip('/')
            if urlparse(full_url).netloc == domain:
                links.add(full_url)

        # Compare with DB
        items = db.get_knowledge_items(ws_id)
        indexed_names = set([item['name'] for item in items])
        
        gaps = [link for link in links if link not in indexed_names and link != base_url]
        # Sort and limit
        gaps.sort()

        return jsonify({
            "status": "success",
            "gaps": gaps[:15], # Limit to first 15 for a clean UI preview
            "gap_count": len(gaps),
            "root_url": base_url
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e), "gaps": []})

@app.route('/api/admin/detect-colors', methods=['POST'])
@require_auth()
def detect_colors():
    """Attempts to extract primary brand colors from a given URL."""
    url = request.json.get('url')
    if not url:
        return jsonify({"error": "URL required"}), 400
    
    try:
        if not url.startswith('http'): url = 'https://' + url
        headers = {'User-Agent': 'Mozilla/5.0'}
        res = requests.get(url, headers=headers, timeout=5, verify=False)
        if not res.ok: return jsonify({"error": "Unreachable"}), 400
        
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Simple Logic: Look for background-color in inline styles or common selectors
        # For a truly premium experience, we could use a color quantization library, 
        # but here we'll look for common header/nav colors or the most frequent hex codes in the body.
        import re
        hex_colors = re.findall(r'#[0-9a-fA-F]{6}', res.text)
        if not hex_colors: hex_colors = re.findall(r'#[0-9a-fA-F]{3}', res.text)
        
        # Filter out clear white/black
        filtered = [c for c in hex_colors if c.lower() not in ['#ffffff', '#000000', '#fff', '#000']]
        
        primary = "#2dd4bf" # Default
        if filtered:
            # Frequency analysis
            from collections import Counter
            most_common = Counter(filtered).most_common(5)
            # Try to pick a vibrant one
            primary = most_common[0][0]

        return jsonify({
            "primary": primary,
            "secondary": "#064e40", # Hardcoded aesthetic pair for now
            "bg": "glass"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/knowledge/<item_id>', methods=['DELETE'])
@require_auth()
def delete_knowledge(item_id):
    user = request.user
    item = db.get_knowledge_item(item_id)
    if not item:
        return jsonify({"error": "Not Found"}), 404
    if user['role'] == 'client' and item['workspace_id'] != user['ws_id']:
        return jsonify({"error": "Forbidden"}), 403
    db.delete_knowledge_item(item_id)
    return jsonify({"status": "Success"})

@app.route('/api/scrape', methods=['POST'])
@require_auth()
def ingest_url():
    user = request.user
    data = request.json
    ws_id = data['workspace_id']
    base_url = data['url']
    if user['role'] == 'client' and user['ws_id'] != ws_id:
        return jsonify({"error": "Forbidden"}), 403
        
    print(f"[Crawler] Starting dynamic recursive crawl for {base_url}...")
    # 1. Recursive Crawl (Max 100 pages as requested)
    scraped_pages = scraper.crawl_website(base_url, max_pages=100)
    
    results = []
    for url, text in scraped_pages:
        try:
            if text and text.strip():
                ai.ingest_text(text, ws_id)
                item_id = f"k_{uuid.uuid4().hex[:8]}"
                db.save_knowledge_item(item_id, ws_id, url, "url", "Captured", content=text)
                results.append({"id": item_id, "name": url, "type": "url"})
        except Exception as e:
            print(f"[Crawler Result Error] Skipping {url}: {e}")
            
    if results:
        print(f"[Crawler] Successfully indexed {len(results)} pages in total.")
        return jsonify({"items": results, "count": len(results)})
    
    return jsonify({"error": "Failed to read content from that website."}), 400

@app.route('/api/upload_file', methods=['POST'])
@require_auth()
def upload_file():
    user = request.user
    ws_id = request.form.get('workspace_id')
    if user['role'] == 'client' and user['ws_id'] != ws_id:
        return jsonify({"error": "Forbidden"}), 403
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files['file']
    filename = secure_filename(file.filename)
    temp_path = os.path.join("data_store/uploads", f"{uuid.uuid4().hex}_{filename}")
    file.save(temp_path)
    text = scraper.extract_file(temp_path, filename)
    if text:
        ai.ingest_text(text, ws_id)
        size_str = f"{os.path.getsize(temp_path) // 1024} KB"
        item_id = f"k_{uuid.uuid4().hex[:8]}"
        db.save_knowledge_item(item_id, ws_id, filename, "file", size_str, content=text)
        try: os.remove(temp_path)
        except: pass
        return jsonify({"id": item_id, "name": filename, "type": "file", "size": size_str})
    try: os.remove(temp_path)
    except: pass
    return jsonify({"error": "Failed to extract text from file"}), 400

# ==================== MESSAGING ====================
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    ws_id = data['workspace_id']
    chat_id = data.get('chat_id')
    message = data['message']
    if not chat_id:
        chat_id = f"c_default_{ws_id}"
    db.save_chat(ws_id, chat_id, 'user', message)
    
    # Fetch custom QA and all raw text for fallback robustness
    custom_qa = db.get_custom_qa(ws_id)
    raw_knowledge = db.get_all_workspace_text(ws_id)
    ans = ai.get_response(message, ws_id, custom_qa=custom_qa, raw_knowledge=raw_knowledge)
    
    db.save_chat(ws_id, chat_id, 'ai', ans)
    return jsonify({"response": ans})

@app.route('/api/chat_messages/<chat_id>', methods=['GET'])
def get_chat_messages(chat_id):
    return jsonify(db.get_history(chat_id))

@app.route('/api/search', methods=['GET'])
def search_items():
    return jsonify({"workspaces": [], "chats": []})

# ==================== EXTERNAL WIDGET ====================
@app.route('/api/widget/chat', methods=['POST', 'OPTIONS'])
def widget_chat():
    if request.method == 'OPTIONS':
        return '', 204
    data = request.json
    business_id = data.get('business_id')
    message = data.get('message')
    if not business_id or not message:
        return jsonify({"error": "Missing business_id or message"}), 400
    
    try:
        # Fetch custom QA and all raw text for fallback robustness
        custom_qa = db.get_custom_qa(business_id) if business_id else []
        raw_knowledge = db.get_all_workspace_text(business_id) if business_id else ""
        ans = ai.get_response(message, business_id, custom_qa=custom_qa, raw_knowledge=raw_knowledge)
    except Exception as e:
        print(f"[WidgetChat ERROR]: {str(e)}")
        # If the workspace was deleted or internal error, provide a safe fallback
        ans = "I'm sorry, I'm currently unable to access that business's records. It may have been relocated or updated. Please try again later."

    # ── Robustness: Save history so it appears in Performance Catalogue ──
    try:
        chat_id = f"c_widget_{business_id}"
        db.save_chat(business_id, chat_id, 'user', message)
        db.save_chat(business_id, chat_id, 'ai', ans)
    except:
        pass # Ignore db errors on widget chat for maximum uptime

    return jsonify({"response": ans})

@app.route('/api/widget/config/<ws_id>', methods=['GET'])
def get_widget_config(ws_id):
    config = db.get_workspace_config(ws_id)
    top_qa = db.get_custom_qa(ws_id)[:5]
    return jsonify({
        "bot_name": config['bot_name'],
        "bot_greeting": config['bot_greeting'],
        "theme_primary": config['theme_primary'],
        "theme_secondary": config['theme_secondary'],
        "theme_bg": config['theme_bg'],
        "theme_font": config['theme_font'],
        "bot_avatar_url": config['bot_avatar_url'],
        "quick_questions": [q['question'] for q in top_qa]
    })

# ==================== WIDGET REVIEWS ====================
@app.route('/api/widget/review', methods=['POST'])
def widget_submit_review():
    data = request.json
    biz_id = data.get('business_id')
    rating = data.get('rating', 5)
    comment = data.get('comment', '')
    user_name = data.get('user_name', 'Anonymous')
    user_email = data.get('user_email', '')
    
    review_id = str(uuid.uuid4())
    db.save_bot_review(review_id, biz_id, rating, comment, user_name, user_email)
    return jsonify({"status": "success"})

# ==================== CLIENT DASHBOARD ====================
@app.route('/api/client/qa', methods=['GET'])
@require_auth(allowed_roles=['client', 'admin'])
def get_client_qa():
    ws_id = request.user.get('ws_id') or request.args.get('ws_id')
    return jsonify(db.get_custom_qa(ws_id))

@app.route('/api/client/qa', methods=['POST'])
@require_auth(allowed_roles=['client', 'admin'])
def add_client_qa():
    data = request.json
    ws_id = request.user.get('ws_id') or data.get('ws_id')
    question = data.get('question', '').strip()
    answer = data.get('answer', '[Dynamic Website Retrieval]').strip() or '[Dynamic Website Retrieval]'
    if not question:
        return jsonify({"error": "Question required"}), 400
    db.save_custom_qa(uuid.uuid4().hex, ws_id, question, answer)
    return jsonify({"message": "Custom Q&A added"}), 201

@app.route('/api/client/qa/<qa_id>', methods=['DELETE'])
@require_auth(allowed_roles=['client', 'admin'])
def delete_client_qa(qa_id):
    db.delete_custom_qa(qa_id)
    return jsonify({"message": "Deleted"}), 200

@app.route('/api/client/analytics', methods=['GET'])
@require_auth(allowed_roles=['client', 'admin'])
def get_client_analytics():
    ws_id = request.user.get('ws_id') or request.args.get('ws_id')
    days = request.args.get('days', 'all')
    return jsonify(db.get_client_analytics(ws_id, days))

@app.route('/api/client/reviews', methods=['GET'])
@require_auth(allowed_roles=['client', 'admin'])
def get_client_reviews():
    ws_id = request.user.get('ws_id') or request.args.get('ws_id')
    return jsonify(db.get_bot_reviews(ws_id))

# (duplicate /api/client/persona POST removed — handled by manage_persona above)

# ==================== LEAD MANAGEMENT (WIDGET CAPTURE) ====================
@app.route('/api/widget/lead', methods=['POST', 'OPTIONS'])
def widget_submit_lead():
    if request.method == 'OPTIONS':
        return '', 204
    data = request.json
    ws_id = data.get('business_id')
    name = data.get('name')
    email = data.get('email')
    location = data.get('location')
    entity_type = data.get('entity_type', 'individual')
    org_name = data.get('org_name', '')
    
    if not all([ws_id, name, email]):
        return jsonify({"error": "Missing required fields: Name and Email"}), 400
        
    try:
        lead_id = f"lead_{uuid.uuid4().hex[:8]}"
        db.create_lead(lead_id, ws_id, name, email, location, entity_type, org_name)
        print(f"[Lead Captured]: {email} for business {ws_id}")
        return jsonify({"status": "success", "lead_id": lead_id})
    except Exception as e:
        print(f"[Lead Capture ERROR]: {str(e)}")
        return jsonify({"error": "Storage Failure"}), 500

@app.route('/api/client/leads', methods=['GET'])
@require_auth(allowed_roles=['client', 'admin'])
def get_client_leads():
    ws_id = request.user.get('ws_id') or request.args.get('ws_id')
    return jsonify(db.get_leads_by_workspace(ws_id))

@app.route('/api/client/lead/<lead_id>', methods=['DELETE'])
@require_auth(allowed_roles=['client', 'admin'])
def delete_client_lead(lead_id):
    db.delete_lead(lead_id)
    return jsonify({"status": "success"})

# ==================== ADMIN DASHBOARD ====================
@app.route('/api/admin/metrics', methods=['GET'])
@require_auth(allowed_roles=['admin'])
def get_admin_metrics():
    return jsonify(db.get_admin_metrics())

@app.route('/api/admin/onboarding/all', methods=['GET'])
@require_auth(allowed_roles=['admin'])
def get_admin_onboarding():
    return jsonify(db.get_onboarding_all())

@app.route('/api/admin/onboarding', methods=['POST'])
@require_auth(allowed_roles=['admin'])
def initiate_onboarding():
    data = request.json
    ws_name = data.get('workspace_name', '').strip()
    org_name = data.get('org_name', '').strip()
    ceo_t = data.get('ceo_title', '').strip()
    ceo_f = data.get('ceo_first_name', '').strip()
    ceo_m = data.get('ceo_middle_name', '').strip()
    ceo_l = data.get('ceo_last_name', '').strip()
    c_code = data.get('country_code', '').strip()
    contact = data.get('contact_details', '').strip()
    addr1 = data.get('address_line_1', '').strip()
    addr2 = data.get('address_line_2', '').strip()
    addr3 = data.get('address_line_3', '').strip()
    email = data.get('email', '').strip()
    
    if not all([ws_name, ceo_f, ceo_l, email]):
        return jsonify({"error": "workspace_name, admin names, and email are required"}), 400
        
    req_id = f"req_{uuid.uuid4().hex[:8]}"
    approve_token = uuid.uuid4().hex
    reject_token = uuid.uuid4().hex
    temp_password = uuid.uuid4().hex[:8]
    
    db.save_onboarding_request(req_id, ws_name, org_name, email, ceo_t, ceo_f, ceo_m, ceo_l, c_code, contact, addr1, addr2, addr3, approve_token, reject_token, temp_password)
    
    ceo_full = f"{ceo_t} {ceo_f} {ceo_m} {ceo_l}".replace('  ', ' ').strip()
    sent = mail.send_approval_request(email, ceo_full, ws_name, org_name, addr1, addr2, addr3, c_code, contact, approve_token, reject_token, temp_password)
    msg = "Approval request sent to client" if sent else "Request saved, but email failed"
    
    return jsonify({"message": msg, "id": req_id})

@app.route('/api/admin/onboarding/<req_id>', methods=['DELETE'])
@require_auth(allowed_roles=['admin'])
def delete_onboarding_request(req_id):
    """Delete an onboarding request from the panel."""
    db.delete_onboarding_request(req_id)
    return jsonify({"message": "Request deleted"})

@app.route('/api/admin/onboarding/<req_id>/resend', methods=['PUT'])
@require_auth(allowed_roles=['admin'])
def resend_onboarding_request(req_id):
    """Update and re-send the approval email for an existing onboarding request."""
    data = request.json
    ws_name = data.get('workspace_name', '').strip()
    org_name = data.get('org_name', '').strip()
    ceo_t = data.get('ceo_title', '').strip()
    ceo_f = data.get('ceo_first_name', '').strip()
    ceo_m = data.get('ceo_middle_name', '').strip()
    ceo_l = data.get('ceo_last_name', '').strip()
    c_code = data.get('country_code', '').strip()
    contact = data.get('contact_details', '').strip()
    addr1 = data.get('address_line_1', '').strip()
    addr2 = data.get('address_line_2', '').strip()
    addr3 = data.get('address_line_3', '').strip()
    email = data.get('email', '').strip()

    if not all([ws_name, ceo_f, ceo_l, email]):
        return jsonify({"error": "All required fields must be provided"}), 400

    approve_token = uuid.uuid4().hex
    reject_token = uuid.uuid4().hex
    temp_password = uuid.uuid4().hex[:8]

    db.update_onboarding_request(req_id, ws_name, org_name, email, ceo_t, ceo_f, ceo_m, ceo_l, c_code, contact, addr1, addr2, addr3, approve_token, reject_token, temp_password)

    ceo_full = f"{ceo_t} {ceo_f} {ceo_m} {ceo_l}".replace('  ', ' ').strip()
    sent = mail.send_approval_request(email, ceo_full, ws_name, org_name, addr1, addr2, addr3, c_code, contact, approve_token, reject_token, temp_password)
    msg = "Approval email re-sent successfully" if sent else "Request updated, but email failed"

    return jsonify({"message": msg})



# (duplicate /api/client/leads GET and /api/client/lead/<id> DELETE removed — handled above)


# ==================== ONBOARDING APPROVAL/REJECTION (PUBLIC) ====================
@app.route('/api/onboarding/approve/<token>', methods=['GET'])
def approve_onboarding(token):
    req = db.get_onboarding_by_approve_token(token)
    if not req:
        return html_page("Invalid Link", "⚠️", "Invalid Link",
                         "This approval link is no longer valid or has already been used.")
    
    # ── 3-Hour Expiry Check ──────────────────────────────────────────────────
    try:
        created_at = datetime.strptime(req['created_at'], "%Y-%m-%d %H:%M:%S")
        if datetime.utcnow() - created_at > timedelta(hours=3):
            return html_page("Link Expired", "⏰", "Link Expired",
                             "For security reasons, this link was only valid for <b>3 hours</b>.<br/><br/>"
                             "Please contact your administrator to resend the request.")
    except Exception as e:
        print(f"[Expiry Check Error]: {e}")
        # If timestamp parsing fails, we allow it to proceed as a fallback
        pass
    
    ws_id = f"ws_{uuid.uuid4().hex[:8]}"
    try:
        storage.create_ws_storage(ws_id)
    except Exception:
        pass
    db.save_workspace(ws_id, req['workspace_name'], "")
    
    u_id = f"u_{uuid.uuid4().hex[:8]}"
    temp_pw = req['temp_password']
    
    # Ensure any existing user with this email is removed/replaced (prevents UNIQUE constraint errors)
    db.delete_user_by_email(req['email'])
    
    db.create_user(u_id, req['email'], generate_password_hash(temp_pw), 'client', ws_id, req['email'], must_change_password=True)
    db.approve_onboarding(req['id'])
    
    return html_page(
        "Workspace Activated!",
        "🎉",
        "Workspace Successfully Created!",
        f"Your workspace <b>{req['workspace_name']}</b> is now live.<br/><br/>"
        f"<b>Login Email:</b> {req['email']}<br/>"
        f"<b>Temporary Password:</b> <span style='font-family:monospace; font-weight:bold;'>{temp_pw}</span><br/><br/>"
        "Please change your password after first login.",
        link_href=os.getenv("FRONTEND_BASE_URL", "https://chatbot-dashboard-k498.onrender.com") + "/login",
        link_text="Go to Dashboard →"
    )

@app.route('/api/onboarding/reject/<token>', methods=['GET'])
def reject_onboarding(token):
    req = db.get_onboarding_by_reject_token(token)
    if not req:
        return html_page("Invalid Link", "⚠️", "Invalid Link",
                         "This rejection link is no longer valid or has already been used.")
    
    # ── 3-Hour Expiry Check ──────────────────────────────────────────────────
    try:
        created_at = datetime.strptime(req['created_at'], "%Y-%m-%d %H:%M:%S")
        if datetime.utcnow() - created_at > timedelta(hours=3):
            return html_page("Link Expired", "⏰", "Link Expired",
                             "For security reasons, this link was only valid for <b>3 hours</b>.")
    except Exception as e:
        print(f"[Expiry Check Error]: {e}")
        pass
    
    db.reject_onboarding(req['id'])
    return html_page(
        "Request Rejected",
        "❌",
        "Request Rejected",
        f"Your workspace request for <b>{req['workspace_name']}</b> has been rejected.<br/><br/>"
        "If this was a mistake, please contact your administrator.",
    )

# ==================== LEGACY PROVISION BOT ====================
@app.route('/api/admin/provision_bot', methods=['POST'])
@require_auth(allowed_roles=['admin'])
def provision_bot():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400
    if db.get_user_by_email(email):
        return jsonify({"error": "User with this email already exists"}), 400
    ws_data = storage.create_ws(name)
    ws_id = ws_data['id']
    db.save_workspace(ws_id, name, "")
    u_id = f"u_{uuid.uuid4().hex[:8]}"
    db.create_user(u_id, email, generate_password_hash(password), 'client', ws_id, email)
    return jsonify({"status": "Success", "workspace": {"id": ws_id, "name": name}, "client_id": u_id})

if __name__ == "__main__":
    app.run(port=5000, debug=True)