# test_direct_smtp.py
import smtplib
import os
from dotenv import load_dotenv
from email.message import EmailMessage

load_dotenv()

print("🔍 Testing direct SMTP connection...")
print(f"Server: {os.getenv('MAIL_SERVER')}")
print(f"Port: {os.getenv('MAIL_PORT')}")
print(f"Username: {os.getenv('MAIL_USERNAME')}")
print(f"Password: {'***' if os.getenv('MAIL_PASSWORD') else 'MISSING!'}")

try:
    # Connect with TLS (port 587)
    server = smtplib.SMTP(os.getenv('MAIL_SERVER'),
                          int(os.getenv('MAIL_PORT', 587)))
    server.starttls()

    # Login
    server.login(os.getenv('MAIL_USERNAME'), os.getenv('MAIL_PASSWORD'))
    print("✅ LOGIN SUCCESSFUL!")

    # Send test email
    msg = f"""Subject: 🧪 Direct SMTP Test
From: {os.getenv('MAIL_USERNAME')}
To: {os.getenv('ADMIN_EMAIL')}

If you see this, Gmail authentication works!
"""
    server.sendmail(os.getenv('MAIL_USERNAME'), os.getenv('ADMIN_EMAIL'), msg)
    print("✅ EMAIL SENT SUCCESSFULLY!")

    server.quit()

except smtplib.SMTPAuthenticationError as e:
    print(f"❌ AUTH FAILED: {e}")
    print("\n🔗 Check this link for help:")
    print("https://support.google.com/accounts/troubleshooter/2402620")

except Exception as e:
    print(f"❌ ERROR: {type(e).__name__}: {e}")
