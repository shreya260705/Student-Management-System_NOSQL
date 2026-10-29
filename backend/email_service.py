"""
email_service.py - Email notification and password reset dispatch for EduManage.
Supports direct SMTP delivery (e.g., via Gmail App Password) with graceful
console fallback when SMTP credentials are not yet configured in .env.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

def get_smtp_config():
    """Dynamically reads SMTP configuration from environment variables."""
    server = os.getenv("SMTP_SERVER", "smtp.gmail.com").strip()
    port = int(os.getenv("SMTP_PORT", 587))
    email = os.getenv("SMTP_EMAIL", "").strip()
    # Google App Passwords are 16 characters (e.g. 'qihz jokk usyq iotd'); remove any inner spaces
    password = os.getenv("SMTP_PASSWORD", "").replace(" ", "").strip()
    admin_email = os.getenv("ADMIN_NOTIFICATION_EMAIL", "shreyatpathi2005@gmail.com").strip()
    return server, port, email, password, admin_email


def send_contact_email(sender_name: str, sender_email: str, subject: str, message_content: str) -> dict:
    """
    Sends an inquiry email from a public user to shreyatpathi2005@gmail.com.
    Sets Reply-To header to the sender's email for seamless one-click reply.
    """
    smtp_server, smtp_port, smtp_email, smtp_password, admin_notification_email = get_smtp_config()
    recipient = admin_notification_email or "shreyatpathi2005@gmail.com"
    timestamp = datetime.now(timezone.utc).strftime("%B %d, %Y at %I:%M %p UTC")

    # Construct HTML email body
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
        .header {{ background: linear-gradient(135deg, #0f172a 0%, #312e81 100%); padding: 28px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }}
        .header p {{ margin: 6px 0 0; font-size: 12px; color: #c7d2fe; }}
        .content {{ padding: 28px; }}
        .meta-box {{ background-color: #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 20px; }}
        .meta-row {{ display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }}
        .meta-label {{ color: #64748b; font-weight: 600; }}
        .meta-val {{ color: #0f172a; font-weight: 700; }}
        .message-box {{ background-color: #ffffff; border-left: 4px solid #4f46e5; padding: 16px 20px; border-radius: 0 12px 12px 0; background: #faf5ff; margin-top: 16px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; }}
        .footer {{ padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #f8fafc; }}
        .reply-button {{ display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 10px 20px; text-decoration: none; font-weight: 700; font-size: 13px; border-radius: 10px; margin-top: 20px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Inquiry via EduManage</h1>
          <p>Academic Administration Contact Form</p>
        </div>
        <div class="content">
          <div class="meta-box">
            <div class="meta-row">
              <span class="meta-label">From:</span>
              <span class="meta-val">{sender_name}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Sender Email:</span>
              <span class="meta-val">{sender_email}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Subject:</span>
              <span class="meta-val">{subject}</span>
            </div>
            <div class="meta-row" style="margin-bottom:0;">
              <span class="meta-label">Timestamp:</span>
              <span class="meta-val">{timestamp}</span>
            </div>
          </div>
          
          <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin: 0;">Message Content</h3>
          <div class="message-box">{message_content}</div>
          
          <div style="text-align: center;">
            <a href="mailto:{sender_email}?subject=Re: {subject}" class="reply-button">Reply Directly to {sender_name}</a>
          </div>
        </div>
        <div class="footer">
          EduManage Student Management System • Notification sent to {recipient}
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = f"""
    New Contact Form Submission via EduManage
    ========================================
    From: {sender_name} <{sender_email}>
    Subject: {subject}
    Date: {timestamp}

    Message:
    {message_content}

    --------------------------------------------------
    Reply-To: {sender_email}
    Delivered to: {recipient}
    """

    # If SMTP credentials are configured, send live email via SMTP
    if smtp_email and smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"[EduManage Inquiry] {subject} - from {sender_name}"
            msg["From"] = f"EduManage Portal <{smtp_email}>"
            msg["To"] = recipient
            msg["Reply-To"] = sender_email

            msg.attach(MIMEText(plain_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_email, smtp_password)
                server.send_message(msg)

            print(f"[*] Live SMTP contact email delivered to {recipient} from {sender_email}")
            return {"status": "sent", "mode": "smtp", "recipient": recipient}
        except Exception as e:
            print(f"[!] SMTP dispatch error ({e}). Falling back to logged notification.")
            return {"status": "logged", "mode": "fallback", "error": str(e), "recipient": recipient}
    else:
        # Graceful development mode log
        print(f"\n{'='*60}")
        print(f"[*] EMAIL DISPATCH SIMULATOR (Configure SMTP_EMAIL & SMTP_PASSWORD in backend/.env for live delivery)")
        print(f"To: {recipient}")
        print(f"From: {sender_name} <{sender_email}>")
        print(f"Subject: [EduManage Inquiry] {subject}")
        print(f"Message:\n{message_content}")
        print(f"{'='*60}\n")
        return {"status": "queued", "mode": "simulated", "recipient": recipient}


def send_password_reset_email(recipient_email: str, recipient_name: str, reset_code: str) -> dict:
    """
    Sends a 6-digit password reset verification code to the user's email.
    """
    smtp_server, smtp_port, smtp_email, smtp_password, _ = get_smtp_config()
    timestamp = datetime.now(timezone.utc).strftime("%B %d, %Y at %I:%M %p UTC")

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
        .container {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
        .header {{ background: linear-gradient(135deg, #0f172a 0%, #312e81 100%); padding: 28px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 20px; font-weight: 800; }}
        .header p {{ margin: 6px 0 0; font-size: 12px; color: #c7d2fe; }}
        .content {{ padding: 28px; text-align: center; }}
        .greeting {{ font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }}
        .desc {{ font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 24px; }}
        .code-box {{ background: #f1f5f9; border: 2px dashed #4f46e5; border-radius: 14px; padding: 18px 24px; display: inline-block; margin-bottom: 24px; }}
        .code {{ font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #312e81; font-family: monospace; }}
        .expiry {{ font-size: 12px; color: #dc2626; font-weight: 600; margin-top: 6px; }}
        .warning {{ font-size: 12px; color: #94a3b8; line-height: 1.5; padding: 0 16px; }}
        .footer {{ padding: 18px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #f8fafc; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>EduManage Academic Portal</h1>
          <p>Password Reset Verification Code</p>
        </div>
        <div class="content">
          <div class="greeting">Hello {recipient_name or 'Scholar'},</div>
          <p class="desc">
            We received a request to reset your password for your EduManage account.
            Use the verification code below to authorize this change:
          </p>
          
          <div class="code-box">
            <div class="code">{reset_code}</div>
            <div class="expiry">Valid for 15 minutes</div>
          </div>
          
          <p class="warning">
            If you did not request a password reset, please ignore this email or contact your administrator immediately.
          </p>
        </div>
        <div class="footer">
          EduManage Security Center • Request initiated on {timestamp}
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = f"""
    EduManage — Password Reset Verification Code
    ============================================
    Hello {recipient_name or 'User'},

    Your password reset verification code is: {reset_code}

    This code is valid for 15 minutes.
    If you did not request this, please ignore this email.

    Request date: {timestamp}
    """

    if smtp_email and smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"EduManage — Your Verification Code is {reset_code}"
            msg["From"] = f"EduManage Security <{smtp_email}>"
            msg["To"] = recipient_email

            msg.attach(MIMEText(plain_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_email, smtp_password)
                server.send_message(msg)

            print(f"[*] Password reset verification code {reset_code} delivered via SMTP to {recipient_email}")
            return {"status": "sent", "mode": "smtp"}
        except Exception as e:
            print(f"[!] SMTP reset email error ({e})")
            return {"status": "logged", "mode": "fallback", "error": str(e)}
    else:
        print(f"\n{'='*60}")
        print(f"[*] PASSWORD RESET VERIFICATION CODE: {reset_code}")
        print(f"Recipient: {recipient_email}")
        print(f"Expires in: 15 minutes")
        print(f"{'='*60}\n")
        return {"status": "logged", "mode": "simulated"}
