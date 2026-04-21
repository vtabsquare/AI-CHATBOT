/**
 * Vanilla JS SaaS Bot Widget — Chameleon Engine + Review System
 */
(function() {
    let businessId = null;
    let HOST = "https://ai-chatbot-lpap.onrender.com"; // Fallback
    
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].getAttribute('src');
        if (src && src.includes('widget.js')) {
            const url = new URL(src, window.location.href);
            // Dynamic host detection: If loaded from localhost, point to localhost backend (assumed port 5000)
            if (url.host.includes('localhost') || url.host.includes('127.0.0.1')) {
                HOST = "http://localhost:5000";
            } else {
                HOST = `${url.protocol}//${url.host}`;
            }
        }
        
        const sid = scripts[i].getAttribute('data-business-id');
        if (sid) {
            businessId = sid;
        }
    }
    if (!businessId) return;

    function applyBranding(config, isLightModeManual = null) {
        let isLightMode = isLightModeManual;
        if (isLightMode === null) {
            const computedBody = window.getComputedStyle(document.body);
            let bodyBg = computedBody.backgroundColor;
            if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent' && bodyBg !== 'rgb(255, 255, 255)') {
                const rgb = bodyBg.match(/\d+/g);
                if (rgb && rgb.length >= 3) {
                    const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
                    isLightMode = brightness > 200;
                }
            } else {
                isLightMode = true; 
            }
        }

        const primary = config.theme_primary || "#2dd4bf";
        const secondary = config.theme_secondary || "#064e40";
        const font = config.theme_font === 'Inter' ? "'Inter', sans-serif" : "inherit";
        const bgType = config.theme_bg || 'glass';

        // 🌗 Enhanced Mode Detection: If user selects "solid", we usually assume a light theme is desired 
        // unless the site itself is dark. For "dark", we force dark mode.
        if (bgType === 'dark') isLightMode = false;
        if (bgType === 'solid' && isLightMode === null) isLightMode = true; 
        if (isLightMode === null) isLightMode = true;

        // Smart Contrast for Primary Color (Luma Calculation)
        const getContrastYIQ = (hexcolor) => {
            hexcolor = hexcolor.replace("#", "");
            if (hexcolor.length === 3) hexcolor = hexcolor.split('').map(c => c + c).join('');
            const r = parseInt(hexcolor.substr(0,2),16);
            const g = parseInt(hexcolor.substr(2,2),16);
            const b = parseInt(hexcolor.substr(4,2),16);
            const yiq = ((r*299)+(g*587)+(b*114))/1000;
            return (yiq >= 128) ? '#000000' : '#ffffff';
        };
        const contrastText = getContrastYIQ(primary);

        const style = document.createElement('style');
        style.id = 'saas-dynamic-styles';
        
        // Dynamic Palette Logic
        let glassBg = isLightMode ? 'rgba(255, 255, 255, 0.92)' : 'rgba(13, 13, 18, 0.85)';
        let solidBg = isLightMode ? '#ffffff' : '#1e293b';
        let textColor = isLightMode ? '#0f172a' : '#ffffff';
        let textMuted = isLightMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.5)';
        let border = isLightMode ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.12)';
        let inputBg = isLightMode ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.05)';

        if (bgType === 'dark') {
            glassBg = 'rgba(15, 23, 42, 0.95)';
            solidBg = '#0f172a';
            textColor = '#ffffff';
            textMuted = 'rgba(255, 255, 255, 0.5)';
            border = 'rgba(255, 255, 255, 0.1)';
            inputBg = 'rgba(255, 255, 255, 0.05)';
        }

        style.innerHTML = `#saas-chatbot-container { 
            --saas-font: ${font}; 
            --saas-accent: ${primary}; 
            --saas-accent-secondary: ${secondary};
            --saas-accent-contrast: ${contrastText};
            --saas-accent-low: ${primary}22;
            --saas-glass: ${bgType === 'solid' ? solidBg : glassBg};
            --saas-bg-solid: ${solidBg};
            --saas-border: ${border};
            --saas-text: ${textColor};
            --saas-text-muted: ${textMuted};
            --saas-input-bg: ${inputBg};
        }`;
        
        const existing = document.getElementById('saas-dynamic-styles');
        if (existing) existing.remove();
        document.body.appendChild(style);
    }

    async function init() {
        // Initial fallback branding
        applyBranding({ theme_primary: "#2dd4bf", theme_secondary: "#064e40", theme_font: "Inter", theme_bg: "glass" });

        // 🟢 LIVE IDENTITY & BRANDING SYNC
        let botName = "AI Assistant";
        let botGreeting = "How can I help you today?";
        let botAvatar = `${HOST}/static/bot_avatar.png`;
        let quickQuestions = [];
        try {
            const res = await fetch(`${HOST}/api/widget/config/${businessId}?cache_bust=${Date.now()}`);
            if (res.ok) {
                const cfg = await res.json();
                botName = cfg.bot_name || botName;
                botGreeting = cfg.bot_greeting || botGreeting;
                botAvatar = cfg.bot_avatar_url ? (cfg.bot_avatar_url.startsWith('http') ? cfg.bot_avatar_url : `${HOST}${cfg.bot_avatar_url}`) : botAvatar;
                quickQuestions = cfg.quick_questions || [];
                
                // Apply production branding from database
                applyBranding(cfg);
            }
        } catch(e) { console.error("Widget config error", e); }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${HOST}/static/widget.css?v=${Date.now()}_v2`;
        document.head.appendChild(link);

        const AVATAR_URL = botAvatar;

        const container = document.createElement('div');
        container.id = 'saas-chatbot-container';
        container.innerHTML = `
            <div id="saas-chatbot-window">
                <div id="saas-chat-header">
                    <div class="saas-header-info">
                        <img src="${AVATAR_URL}" id="saas-bot-avatar" alt="Bot">
                        <div class="saas-bot-title-wrap">
                            <span class="saas-bot-name">${botName}</span>
                            <div class="saas-bot-status">
                                <div class="saas-status-dot"></div>
                                Online
                            </div>
                        </div>
                    </div>
                    <div class="saas-header-tools">
                        <button id="saas-chat-close">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
                <div id="saas-chat-messages"></div>
                <div id="saas-chat-quick-links" style="opacity: 0; display: none; transition: opacity 0.5s; flex-wrap: wrap; gap: 8px; padding: 10px 20px;">
                    ${quickQuestions.map(q => `<button class="saas-chip">${q}</button>`).join('')}
                    <button class="saas-chip" id="saas-btn-connect" style="background: var(--saas-accent-low); border-color: var(--saas-accent); color: var(--saas-accent);">💬 Connect with Team</button>
                    <button class="saas-chip saas-chip-review" id="saas-btn-review" style="background: rgba(251, 191, 36, 0.1); border-color: #fbbf24; color: #fbbf24;">⭐ Leave a Review</button>
                </div>
                <div id="saas-chat-input-container">
                    <div class="saas-input-wrapper">
                        <input type="text" id="saas-chat-input" placeholder="Verification required to chat..." autocomplete="off" disabled>
                    </div>
                    <button id="saas-chat-send" disabled style="opacity: 0.3">
                        <svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-width="2.5" stroke="var(--saas-text)"/></svg>
                    </button>
                </div>
            </div>
            <button id="saas-chatbot-toggle">
                <img src="${AVATAR_URL}" alt="Open Chat">
            </button>
        `;
        document.body.appendChild(container);

        const toggleBtn     = document.getElementById('saas-chatbot-toggle');
        const closeBtn      = document.getElementById('saas-chat-close');
        const chatWindow    = document.getElementById('saas-chatbot-window');
        const sendBtn       = document.getElementById('saas-chat-send');
        const inputField    = document.getElementById('saas-chat-input');
        const messagesDiv   = document.getElementById('saas-chat-messages');
        const quickLinks    = document.getElementById('saas-chat-quick-links');

        function isLeadCaptured() {
            return sessionStorage.getItem(`saas_lead_captured_${businessId}`) === 'true';
        }

        function getChatId() {
            return sessionStorage.getItem(`saas_chat_id_${businessId}`);
        }

        function saveMessageToHistory(text, sender) {
            const history = JSON.parse(sessionStorage.getItem(`saas_chat_history_${businessId}`) || '[]');
            history.push({ text, sender });
            sessionStorage.setItem(`saas_chat_history_${businessId}`, JSON.stringify(history));
        }

        function formatMarkdown(text) {
            if (!text) return '';
            let formatted = text
                // 1. Bold: **text** -> <strong>text</strong>
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                // 2. Lists: * item -> <li>item</li>
                .replace(/^\* (.*)/gm, '<li>$1</li>')
                // 3. Newlines: \n -> <br/>
                .replace(/\n/g, '<br/>');
            
            // 4. Wrap adjacent <li> items in <ul>
            formatted = formatted.replace(/(<li>.*<\/li>)/s, match => `<ul>${match}</ul>`);
            
            return formatted;
        }

        function loadChatHistory() {
            const history = JSON.parse(sessionStorage.getItem(`saas_chat_history_${businessId}`) || '[]');
            if (history.length > 0) {
                messagesDiv.innerHTML = '';
                history.forEach(msg => {
                    const d = document.createElement('div');
                    d.className = `saas-message saas-message-${msg.sender}`;
                    d.innerHTML = formatMarkdown(msg.text);
                    messagesDiv.appendChild(d);
                });
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
                return true;
            }
            return false;
        }

        function applyConversationalFlow() {
            if (isLeadCaptured()) {
                inputField.disabled = false;
                inputField.placeholder = "Neural interface active...";
                sendBtn.disabled = false;
                sendBtn.style.opacity = '1';
                
                if (quickLinks) {
                    quickLinks.style.display = 'flex';
                    setTimeout(() => { 
                        quickLinks.style.opacity = '1'; 
                        // Persist action buttons until submitted
                        const revBtn = document.getElementById('saas-btn-review');
                        if (revBtn) {
                            if (sessionStorage.getItem(`saas_review_submitted_${businessId}`)) revBtn.style.display = 'none';
                            else revBtn.style.display = 'inline-block';
                        }
                        const connBtn = document.getElementById('saas-btn-connect');
                        if (connBtn) {
                            if (sessionStorage.getItem(`saas_booking_submitted_${businessId}`)) connBtn.style.display = 'none';
                            else connBtn.style.display = 'inline-block';
                        }
                    }, 10);
                }

                const hasHistory = loadChatHistory();
                if (!hasHistory) {
                    messagesDiv.innerHTML = ''; // Clear the "pre-capture" greeting to avoid duplication
                    addMessage(`Hi! I am <strong>${botName}</strong>, ${botGreeting}`, 'ai', true);
                } else if (quickLinks) {
                    // Hide standard question chips but keep action buttons
                    const chips = quickLinks.querySelectorAll('.saas-chip:not(.saas-chip-review):not(#saas-btn-connect)');
                    chips.forEach(c => c.style.display = 'none');
                }
            } else {
                if (messagesDiv.children.length === 0) {
                    addMessage(`Hi! I am <strong>${botName}</strong>, ${botGreeting}`, 'ai', false); // false = don't save greeting to history yet
                    setTimeout(() => addLeadForm(), 600);
                }
                
                inputField.disabled = true;
                inputField.placeholder = "Verification required to chat...";
                sendBtn.disabled = true;
                sendBtn.style.opacity = '0.3';
            }
        }

        function addMessage(text, sender, save = true) {
            const d = document.createElement('div');
            d.className = `saas-message saas-message-${sender}`;
            d.innerHTML = formatMarkdown(text);
            messagesDiv.appendChild(d);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            if (save) saveMessageToHistory(text, sender);
            return d;
        }

        function addLoading() {
            const d = document.createElement('div');
            d.className = 'saas-message saas-message-ai saas-loading';
            d.innerHTML = '<div class="saas-dot"></div><div class="saas-dot"></div><div class="saas-dot"></div>';
            messagesDiv.appendChild(d);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            return d;
        }

        // ======================= REVIEWS =======================
        function addReviewForm() {
            if (document.querySelector('.saas-review-container')) return;

            const wrap = document.createElement('div');
            wrap.className = 'saas-review-container';
            wrap.innerHTML = `
                <div class="saas-lead-card" style="border: 2px solid var(--saas-accent); box-shadow: 0 0 30px var(--saas-accent-low); margin: 20px 0;">
                    <div class="saas-lead-header">
                        <div class="saas-lead-title" style="color: var(--saas-text);">Rate Your Experience</div>
                    </div>
                    <div class="saas-lead-form">
                        <div style="display:flex; justify-content:center; gap:10px; margin-bottom: 20px;" class="saas-stars">
                            ${[1,2,3,4,5].map(i => `<span data-val="${i}" style="font-size:28px; cursor:pointer; color: var(--saas-text-muted);">★</span>`).join('')}
                        </div>
                        <div class="saas-input-group">
                            <textarea class="saas-review-comment" placeholder="Tell us what you think..." style="background: var(--saas-input-bg); color: var(--saas-text); border: 1px solid var(--saas-border); border-radius: 12px; padding: 10px; width: 100%; height: 60px; box-sizing: border-box; resize: none; font-family: var(--saas-font);"></textarea>
                        </div>
                        <button class="saas-review-submit" style="background: var(--saas-accent); color: #fff;">Submit Review</button>
                    </div>
                    <div class="saas-review-thanks" style="display:none; color:var(--saas-text); text-align:center; padding:15px; font-weight:800;">
                        Thank you for your feedback! ⭐
                    </div>
                </div>
            `;
            messagesDiv.appendChild(wrap);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            let selectedRating = 0;
            const stars = wrap.querySelectorAll('.saas-stars span');
            stars.forEach(s => {
                s.addEventListener('click', () => {
                    selectedRating = parseInt(s.getAttribute('data-val'));
                    stars.forEach(st => {
                        if (parseInt(st.getAttribute('data-val')) <= selectedRating) {
                            st.style.color = '#fbbf24'; // Yellow Gold
                        } else {
                            st.style.color = 'var(--saas-text-muted)';
                        }
                    });
                });
            });

            const submitBtn = wrap.querySelector('.saas-review-submit');
            submitBtn.addEventListener('click', async () => {
                if (selectedRating === 0) {
                    alert("Please select a star rating.");
                    return;
                }
                const comment = wrap.querySelector('.saas-review-comment').value.trim();
                const userName = sessionStorage.getItem(`saas_lead_name_${businessId}`) || "Anonymous";
                const userEmail = sessionStorage.getItem(`saas_lead_email_${businessId}`) || "";

                submitBtn.disabled = true;
                submitBtn.textContent = "Sending...";

                try {
                    await fetch(`${HOST}/api/widget/review`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            business_id: businessId,
                            rating: selectedRating,
                            comment: comment,
                            user_name: userName,
                            user_email: userEmail
                        })
                    });
                    sessionStorage.setItem(`saas_review_submitted_${businessId}`, 'true');
                    const revBtn = document.getElementById('saas-btn-review');
                    if (revBtn) revBtn.style.display = 'none';
                    
                    wrap.querySelector('.saas-lead-form').style.display = 'none';
                    wrap.querySelector('.saas-review-thanks').style.display = 'block';
                } catch(e) {
                    alert("Failed to submit review. Try again.");
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Submit Review";
                }
            });
        }

        // ======================= CALL BOOKING =======================
        let bookingStep = 0; // 1: name, 2: email, 3: date, 4: time
        let bookingData = { name: '', email: '', ws_id: businessId, date: '', time: '' };

        function addBookingForm() {
            if (document.querySelector('.saas-booking-container')) return;
            const wrap = document.createElement('div');
            wrap.className = 'saas-booking-container';
            wrap.innerHTML = `
                <div class="saas-card" style="border: 2px solid var(--saas-accent); box-shadow: 0 0 30px var(--saas-accent-low); margin: 20px 0;">
                    <div class="saas-card-header" style="background: linear-gradient(135deg, var(--saas-accent-secondary), var(--saas-accent)); padding: 15px; text-align: center;">
                        <div class="saas-lead-title" style="color: var(--saas-accent-contrast); font-weight: 800; font-size: 14px; text-transform: uppercase;">Schedule a Consultation</div>
                        <div style="font-size: 10px; color: rgba(255,255,255,0.9); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Expert Support Available</div>
                    </div>
                    <div class="saas-booking-form" style="padding: 20px;">
                        <div class="saas-input-group">
                            <label id="saas-booking-label" style="color: var(--saas-text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; display: block;">What is your full name?</label>
                            <input type="text" id="saas-booking-input" placeholder="Enter your name" style="background: var(--saas-input-bg); color: var(--saas-text); border: 1px solid var(--saas-border); width: 100%; padding: 12px; border-radius: 12px; box-sizing: border-box; outline: none; transition: border-color 0.2s;">
                        </div>
                        <button id="saas-booking-next" style="background: var(--saas-accent); color: var(--saas-accent-contrast); width: 100%; margin-top: 15px; border-radius: 12px; padding: 12px; font-weight: 800; text-transform: uppercase; font-size: 11px; border: none; cursor: pointer;">Next Step →</button>
                    </div>
                    <div class="saas-booking-thanks" style="display:none; color:var(--saas-text); text-align:center; padding:30px; font-weight:800; text-transform:uppercase; font-size: 12px;">
                        <div style="font-size: 40px; margin-bottom: 15px;">🗓️</div>
                        Request Secured. <br/> <span style="font-size: 10px; opacity: 0.7; margin-top: 10px; display: block;">We will contact you shortly to confirm the slot.</span>
                    </div>
                </div>
            `;
            messagesDiv.appendChild(wrap);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            const form = wrap.querySelector('.saas-booking-form');
            const input = wrap.querySelector('#saas-booking-input');
            const label = wrap.querySelector('#saas-booking-label');
            const nextBtn = wrap.querySelector('#saas-booking-next');
            const thanks = wrap.querySelector('.saas-booking-thanks');

            input.value = sessionStorage.getItem(`saas_lead_name_${businessId}`) || "";
            input.focus();
            bookingStep = 1;

            nextBtn.onclick = async () => {
                const val = input.value.trim();
                if (!val) return alert("Please provide details.");

                if (bookingStep === 1) {
                    bookingData.name = val;
                    label.innerText = "Confirm your contact email:";
                    input.placeholder = "john@example.com";
                    input.value = sessionStorage.getItem(`saas_lead_email_${businessId}`) || "";
                    bookingStep = 2;
                } else if (bookingStep === 2) {
                    bookingData.email = val;
                    label.innerText = "Preferred Date & Day?";
                    input.type = "date";
                    input.value = "";
                    bookingStep = 3;
                } else if (bookingStep === 3) {
                    bookingData.date = val;
                    label.innerText = "What time works best?";
                    
                    // Replace input with professional selectors
                    const inputParent = input.parentElement;
                    input.style.display = 'none';
                    const timePicker = document.createElement('div');
                    timePicker.id = 'saas-time-picker';
                    timePicker.style.display = 'flex';
                    timePicker.style.gap = '8px';
                    timePicker.innerHTML = `
                        <select id="saas-time-h" style="flex:1; background:var(--saas-input-bg); color:var(--saas-text); border:1px solid var(--saas-border); border-radius:12px; padding:10px; appearance:none;">
                            ${[...Array(12).keys()].map(i => `<option value="${(i+1).toString().padStart(2,'0')}">${i+1}</option>`).join('')}
                        </select>
                        <select id="saas-time-m" style="flex:1; background:var(--saas-input-bg); color:var(--saas-text); border:1px solid var(--saas-border); border-radius:12px; padding:10px; appearance:none;">
                            <option value="00">00</option><option value="15">15</option><option value="30">30</option><option value="45">45</option>
                        </select>
                        <select id="saas-time-p" style="flex:1; background:var(--saas-input-bg); color:var(--saas-text); border:1px solid var(--saas-border); border-radius:12px; padding:10px; appearance:none;">
                            <option value="AM">AM</option><option value="PM">PM</option>
                        </select>
                    `;
                    inputParent.appendChild(timePicker);
                    bookingStep = 4;
                    return; // Prevent immediate execution of next step
                } else if (bookingStep === 4) {
                    const h = wrap.querySelector('#saas-time-h').value;
                    const m = wrap.querySelector('#saas-time-m').value;
                    const p = wrap.querySelector('#saas-time-p').value;
                    bookingData.time = `${h}:${m} ${p}`;
                    
                    nextBtn.disabled = true;
                    nextBtn.innerText = "Securing Slot...";
                    
                    try {
                        const res = await fetch(`${HOST}/api/widget/booking`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(bookingData)
                        });
                        if (res.ok) {
                            form.style.display = 'none';
                            thanks.style.display = 'block';
                            sessionStorage.setItem(`saas_booking_submitted_${businessId}`, 'true');
                            const connBtn = document.getElementById('saas-btn-connect');
                            if (connBtn) connBtn.style.display = 'none';
                        } else {
                            throw new Error("Server error");
                        }
                    } catch(e) {
                        alert("Network issue. Please try again.");
                        nextBtn.disabled = false;
                        nextBtn.innerText = "Finalize Booking →";
                    }
                }
            };
        }

        // ======================= LEADS =======================
        async function addLeadForm() {
            if (isLeadCaptured()) return;
            if (document.querySelector('.saas-lead-container')) return;

            addMessage(`Please share your details to start the chat. Your data is kept secure and private. 🛡️`, 'ai', false);

            const wrap = document.createElement('div');
            wrap.className = 'saas-lead-container';
            wrap.innerHTML = `
                <div class="saas-lead-card" style="border: 2px solid var(--saas-accent); box-shadow: 0 0 30px var(--saas-accent-low); margin: 20px 0;">
                    <div class="saas-lead-header">
                        <div class="saas-lead-title" style="color: var(--saas-text);">Identity Verification</div>
                        <div class="saas-lead-privacy" style="color: var(--saas-text-muted);">🔒 Secure & Private Connection</div>
                    </div>
                    <div class="saas-lead-form">
                        <div class="saas-input-group">
                            <label style="color: var(--saas-text-muted);">Full Name</label>
                            <input type="text" class="saas-lead-name" placeholder="John Doe" required style="background: var(--saas-input-bg); color: var(--saas-text); border: 1px solid var(--saas-border);">
                        </div>
                        <div class="saas-input-group">
                            <label style="color: var(--saas-text-muted);">Email Address</label>
                            <input type="email" class="saas-lead-email" placeholder="john@example.com" required style="background: var(--saas-input-bg); color: var(--saas-text); border: 1px solid var(--saas-border);">
                        </div>
                        <div class="saas-input-group">
                            <label style="color: var(--saas-text-muted);">Location</label>
                            <input type="text" class="saas-lead-location" placeholder="City, Country" required style="background: var(--saas-input-bg); color: var(--saas-text); border: 1px solid var(--saas-border);">
                        </div>
                        <div class="saas-input-group">
                            <label style="color: var(--saas-text-muted);">User Type</label>
                            <select class="saas-lead-type">
                                <option value="individual">Individual</option>
                                <option value="organization">Organization</option>
                            </select>
                        </div>
                        <div class="saas-lead-org-wrap" style="display:none; margin-top:10px;">
                            <div class="saas-input-group">
                                <label style="color: var(--saas-text-muted);">Company Name</label>
                                <input type="text" class="saas-lead-org" placeholder="Acme Corp" style="background: var(--saas-input-bg); color: var(--saas-text); border: 1px solid var(--saas-border);">
                            </div>
                        </div>
                        <button class="saas-lead-submit" style="background: var(--saas-accent); color: #fff;">Start Conversation</button>
                    </div>
                    <div class="saas-lead-thanks" style="display:none; color:var(--saas-text); text-align:center; padding:15px; font-weight:800; text-transform:uppercase;">
                        Access Granted.
                    </div>
                </div>
            `;
            messagesDiv.appendChild(wrap);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            const typeSelect = wrap.querySelector('.saas-lead-type');
            const orgWrap = wrap.querySelector('.saas-lead-org-wrap');
            const submitBtn = wrap.querySelector('.saas-lead-submit');
            const thanks = wrap.querySelector('.saas-lead-thanks');
            const form = wrap.querySelector('.saas-lead-form');

            typeSelect.addEventListener('change', () => {
                orgWrap.style.display = typeSelect.value === 'organization' ? 'block' : 'none';
            });

            submitBtn.addEventListener('click', async () => {
                const name = wrap.querySelector('.saas-lead-name').value.trim();
                const email = wrap.querySelector('.saas-lead-email').value.trim();
                const location = wrap.querySelector('.saas-lead-location').value.trim();
                const type = typeSelect.value;
                const org = wrap.querySelector('.saas-lead-org').value.trim();

                if (!name || !email || !location) {
                    alert("Verification details required: Name, Email, and Location.");
                    return;
                }

                // 📧 Email Validation Regex
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    alert("Please enter a valid email address (e.g., name@example.com).");
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.textContent = "Verifying...";

                try {
                    const res = await fetch(`${HOST}/api/widget/lead`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            business_id: businessId,
                            name, email, location,
                            entity_type: type,
                            org_name: org
                        })
                    });
                    if (res.ok) {
                        sessionStorage.setItem(`saas_lead_captured_${businessId}`, 'true');
                        // Save identity for the Review system
                        sessionStorage.setItem(`saas_lead_name_${businessId}`, name);
                        sessionStorage.setItem(`saas_lead_email_${businessId}`, email);

                        form.style.display = 'none';
                        thanks.style.display = 'block';
                        setTimeout(() => {
                            wrap.remove();
                            applyConversationalFlow(); 
                        }, 1200);
                    } else {
                        throw new Error("Verification failed");
                    }
                } catch(e) {
                    alert("Connection issue. Please retry.");
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Start Conversation";
                }
            });
        }

        applyConversationalFlow();

        let isOpen = false;
        const toggleChat = (e) => {
            if (e) e.stopPropagation();
            isOpen = !isOpen;
            chatWindow.classList.toggle('saas-open', isOpen);
            if (isOpen) {
                applyConversationalFlow();
                setTimeout(() => inputField.focus(), 100);
            }
        };
        toggleBtn.addEventListener('click', toggleChat);
        closeBtn.addEventListener('click', toggleChat);

        async function sendMessage(manualText = null) {
            if (!isLeadCaptured()) {
                if (!document.querySelector('.saas-lead-container')) addLeadForm();
                return;
            }
            const text = manualText || inputField.value.trim();
            if (!text) return;
            
            // 1. Hide standard prompt chips but preserve persistent actions
            if (quickLinks) {
                const chips = quickLinks.querySelectorAll('.saas-chip:not(.saas-chip-review):not(#saas-btn-connect)');
                chips.forEach(c => c.style.display = 'none');
            }
            
            addMessage(text, 'user', true);
            inputField.value = '';

            const loader = addLoading();
            try {
                const res = await fetch(`${HOST}/api/widget/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        business_id: businessId, 
                        message: text,
                        chat_id: getChatId() // Use persistent chat_id
                    })
                });
                const data = await res.json();
                loader.remove();
                if (data.response) {
                    if (data.chat_id) sessionStorage.setItem(`saas_chat_id_${businessId}`, data.chat_id);
                    addMessage(data.response, 'ai', true);
                    
                    // 2. Intelligence: Update session counters
                    let aiCount = parseInt(sessionStorage.getItem(`saas_ai_msg_count_${businessId}`) || '0');
                    aiCount++;
                    sessionStorage.setItem(`saas_ai_msg_count_${businessId}`, aiCount.toString());

                    // (Proactive trigger removed - now manual via 'Connect with Team' button)
                }
            } catch(e) {
                loader.remove();
                addMessage("I am temporarily disconnected. Please try again later.", 'ai', false);
            }
        }

        sendBtn.addEventListener('click', () => sendMessage());
        inputField.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
        
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('saas-chip')) {
                if (e.target.classList.contains('saas-chip-review')) {
                    addReviewForm();
                } else if (e.target.id === 'saas-btn-connect') {
                    addBookingForm();
                } else {
                    sendMessage(e.target.innerText);
                }
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
