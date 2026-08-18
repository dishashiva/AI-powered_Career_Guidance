import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import get_settings

from email.utils import formataddr

settings = get_settings()


def send_password_reset_email(recipient_email: str, reset_link: str) -> bool:
    """Send an official password reset email to the recipient's email address."""
    subject = "Password Reset Request - CareerAI Platform"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; margin: 0; }}
        .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
        .header {{ text-align: center; margin-bottom: 24px; }}
        .logo {{ font-size: 20px; font-weight: 800; color: #4f46e5; }}
        .btn {{ display: inline-block; background: linear-gradient(135deg, #4f46e5, #4338ca); color: #ffffff !important; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; margin: 20px 0; }}
        .footer {{ margin-top: 28px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">CareerAI Platform</div>
          <h2 style="font-size: 18px; margin-top: 8px; color: #0f172a;">Password Reset Request</h2>
        </div>
        <p>Hello,</p>
        <p>We received a request to reset your password for your <strong>CareerAI</strong> account associated with <strong>{recipient_email}</strong>.</p>
        <p>Click the button below to choose a new password. This link will expire in 30 minutes for security reasons:</p>
        <div style="text-align: center;">
          <a href="{reset_link}" class="btn">Reset My Password</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">If the button does not work, copy and paste this link into your web browser:<br>
        <a href="{reset_link}" style="color: #4f46e5; word-break: break-all;">{reset_link}</a></p>
        <p style="font-size: 12px; color: #64748b;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        <div class="footer">
          &copy; CareerAI Intelligence Platform &bull; All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """

    # If SMTP credentials are provided in .env, send actual email
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            sender_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
            sender_name = "CareerAI"
            formatted_sender = formataddr((sender_name, sender_email))

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = formatted_sender
            msg["To"] = recipient_email
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(sender_email, [recipient_email], msg.as_string())
            logging.info(f"Successfully sent password reset email to {recipient_email}")
            return True
        except Exception as e:
            logging.error(f"Failed to send SMTP email to {recipient_email}: {e}")

    # Fallback log output for local server console (NEVER exposed to frontend API JSON)
    print(f"\n=======================================================")
    print(f"[SECURE SERVER EMAIL DISPATCH] To: {recipient_email}")
    print(f"[SECURE SERVER EMAIL DISPATCH] Subject: {subject}")
    print(f"[SECURE SERVER EMAIL DISPATCH] Reset Link: {reset_link}")
    print(f"=======================================================\n", flush=True)
    return True
