import requests
import json
import os

class MailService:
    def __init__(self, api_key):
        self.api_key = api_key
        self.url = "https://api.brevo.com/v3/smtp/email"
        self.sender_email = "gokulnath96880@gmail.com"
        self.sender_name = "AI Workspace"

    def _send(self, payload):
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": self.api_key
        }
        try:
            res = requests.post(self.url, data=json.dumps(payload), headers=headers)
            if res.status_code == 201:
                return True
            print(f"[MailService] Failed: {res.text}")
            return False
        except Exception as e:
            print(f"[MailService] Error: {e}")
            return False

    def send_otp(self, to_email, code):
        """Sends a 4-digit security/reset code via Brevo."""
        payload = {
            "sender": {"name": self.sender_name, "email": self.sender_email},
            "to": [{"email": to_email}],
            "subject": "Your Security Code",
            "htmlContent": f"""
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 16px;">
                    <h2 style="color: #8b5cf6; margin: 0 0 16px;">Security Verification</h2>
                    <p style="color: #4b5563;">Use the code below to verify your identity. It expires in 10 minutes.</p>
                    <div style="background: #f3f4f6; padding: 24px; border-radius: 12px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937; margin: 24px 0;">
                        {code}
                    </div>
                    <p style="font-size: 12px; color: #9ca3af; text-align: center;">If you didn't request this, please ignore this email.</p>
                </div>
            """
        }
        print(f"[MailService] DEBUG OTP for {to_email}: {code}")
        return self._send(payload)

    def send_approval_request(self, to_email, ceo_name, workspace_name, org_name, addr1, addr2, addr3, country_code, contact, approve_token, reject_token, temp_password):
        """Sends a premium approval email with Proceed and Reject buttons, including temp password."""
        base_url = os.getenv("BACKEND_BASE_URL", "https://ai-chatbot-lpap.onrender.com")
        approve_url = f"{base_url}/api/onboarding/approve/{approve_token}"
        reject_url = f"{base_url}/api/onboarding/reject/{reject_token}"

        payload = {
            "sender": {"name": "AI Workspace Admin", "email": self.sender_email},
            "to": [{"email": to_email}],
            "subject": f"Action Required: Review Your Workspace Request — {workspace_name}",
            "htmlContent": f"""
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: auto; padding: 40px 32px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 20px;">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10b981, #064e40); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                            <span style="color: white; font-size: 28px;">🌲</span>
                        </div>
                        <h1 style="color: #111827; font-size: 24px; margin: 0;">Workspace Request Details</h1>
                        <p style="color: #6b7280; margin: 8px 0 0;">Please review the information below carefully.</p>
                        <div style="display: inline-block; background: #fee2e2; color: #ef4444; padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-top: 12px;">
                            ⏰ Valid for 3 Hours Only
                        </div>
                    </div>
                    
                    <div style="background: #f9fafb; border-radius: 16px; padding: 28px; margin-bottom: 32px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px 0; color: #6b7280; font-size: 11px; width: 160px; font-weight: 800; text-transform: uppercase;">Workspace Name</td>
                                <td style="padding: 10px 0; color: #111827; font-weight: 700; font-size: 16px;">{workspace_name}</td>
                            </tr>
                            <tr style="border-top: 1px solid #e5e7eb;">
                                <td style="padding: 10px 0; color: #6b7280; font-size: 11px; font-weight: 800; text-transform: uppercase;">Organization</td>
                                <td style="padding: 10px 0; color: #111827; font-weight: 600;">{org_name or 'N/A'}</td>
                            </tr>
                            <tr style="border-top: 1px solid #e5e7eb;">
                                <td style="padding: 10px 0; color: #6b7280; font-size: 11px; font-weight: 800; text-transform: uppercase;">CEO / Admin</td>
                                <td style="padding: 10px 0; color: #111827; font-weight: 600;">{ceo_name}</td>
                            </tr>
                            <tr style="border-top: 1px solid #e5e7eb;">
                                <td style="padding: 10px 0; color: #6b7280; font-size: 11px; font-weight: 800; text-transform: uppercase;">Email Address</td>
                                <td style="padding: 10px 0; color: #111827; font-weight: 600;">{to_email}</td>
                            </tr>
                            <tr style="border-top: 1px solid #e5e7eb;">
                                <td style="padding: 10px 0; color: #6b7280; font-size: 11px; font-weight: 800; text-transform: uppercase;">Contact Number</td>
                                <td style="padding: 10px 0; color: #111827; font-weight: 600;">
                                    <span style="color: #6b7280; font-size: 14px;">{country_code} {contact}</span>
                                </td>
                            </tr>
                            <tr style="border-top: 1px solid #e5e7eb;">
                                <td style="padding: 10px 0; color: #6b7280; font-size: 11px; font-weight: 800; text-transform: uppercase;">Business Address</td>
                                <td style="padding: 10px 0; color: #111827; font-weight: 600; font-size: 13px; line-height: 1.5;">
                                    {addr1 or ''}<br/>
                                    {addr2 or ''}<br/>
                                    {addr3 or ''}
                                </td>
                            </tr>
                            <tr style="border-top: 1px solid #10b981; background: #f0fdf4;">
                                <td style="padding: 12px; color: #064e40; font-size: 11px; font-weight: 800; text-transform: uppercase;">🔑 Temp Password</td>
                                <td style="padding: 12px; color: #064e40; font-weight: 800; font-family: monospace; font-size: 18px;">{temp_password}</td>
                            </tr>
                        </table>
                    </div>

                    <p style="color: #4b5563; text-align: center; margin-bottom: 28px; font-size: 15px;">
                        If all the details above are correct, click <b>Proceed</b> to activate your AI workspace.<br/>
                        You will use the <b>Temp Password</b> above for your first login.
                    </p>

                    <div style="display: flex; gap: 16px; justify-content: center; text-align: center;">
                        <a href="{approve_url}" 
                           style="display: inline-block; background: linear-gradient(135deg, #10b981, #064e40); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); margin-right: 12px;">
                           ✅ Proceed
                        </a>
                        <a href="{reject_url}"
                           style="display: inline-block; background: #ffffff; color: #ef4444; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; border: 2px solid #ef4444;">
                           ❌ Reject
                        </a>
                    </div>

                    <p style="font-size: 12px; color: #9ca3af; margin-top: 32px; text-align: center;">
                        This link is unique to your account. Do not share it with anyone.<br/>
                        If you did not request this, you can safely ignore this email.
                    </p>
                </div>
            """
        }
        return self._send(payload)
