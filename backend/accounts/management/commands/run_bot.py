import time
import requests
import random
import sys
from django.core.management.base import BaseCommand
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

BOT_TOKEN = getattr(settings, 'TELEGRAM_BOT_TOKEN', '') or ''
BASE_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"


class Command(BaseCommand):
    help = "Runs Telegram Bot polling listener to capture user chat_ids and deliver verification codes."

    def handle(self, *args, **options):
        if not BOT_TOKEN:
            self.stderr.write(self.style.ERROR(
                "Error: TELEGRAM_BOT_TOKEN is not configured in .env or settings."
            ))
            return
        try:
            sys.stdout.reconfigure(line_buffering=True)
            sys.stderr.reconfigure(line_buffering=True)
        except Exception:
            pass

        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("Started Chapter & Chats Telegram bot polling listener..."))
        self.stdout.write(self.style.SUCCESS(f"Endpoint: {BASE_URL}/getUpdates"))
        self.stdout.write(self.style.SUCCESS("=" * 60))

        offset = 0

        # Remove existing webhooks so polling works smoothly
        try:
            requests.get(f"{BASE_URL}/deleteWebhook", timeout=10)
            self.stdout.write(self.style.SUCCESS("✓ Webhooks cleared. Polling via getUpdates enabled."))
        except Exception as e:
            self.stderr.write(f"Warning clearing webhook: {e}")

        while True:
            try:
                response = requests.get(f"{BASE_URL}/getUpdates", params={"offset": offset, "timeout": 20}, timeout=30)
                if response.status_code == 200:
                    data = response.json()
                    for update in data.get("result", []):
                        offset = update["update_id"] + 1
                        message = update.get("message", {})
                        text = message.get("text", "").strip()
                        chat_id = message.get("chat", {}).get("id")
                        contact = message.get("contact", {})

                        if not chat_id:
                            continue

                        user = None
                        is_reset_intent = text.startswith("/reset") or text.lower() == "reset"

                        # 1. Contact card shared
                        if contact and contact.get("phone_number"):
                            contact_phone = "".join(c for c in str(contact["phone_number"]) if c.isdigit())
                            if len(contact_phone) >= 9:
                                user = User.objects.filter(phone_number__endswith=contact_phone[-9:]).first()

                        # 2. Deep-link: /start <phone> or bare /start
                        elif text.startswith("/start"):
                            parts = text.split()
                            phone = parts[1].replace("+", "").replace("-", "") if len(parts) > 1 else None

                            if phone and len(phone) >= 9:
                                user = User.objects.filter(phone_number__endswith=phone[-9:]).first()

                            # If no user found by parameter, try matching any linked user by chat_id
                            if not user:
                                user = User.objects.filter(telegram_chat_id=str(chat_id)).first()

                        # 3. Direct phone number sent in chat (e.g. 09XXXXXXXX or 9XXXXXXXX)
                        elif any(c.isdigit() for c in text):
                            digits = "".join(c for c in text if c.isdigit())
                            if len(digits) >= 9:
                                user = User.objects.filter(phone_number__endswith=digits[-9:]).first()

                        # 4. /code or /reset command
                        elif text.startswith("/code") or is_reset_intent:
                            user = User.objects.filter(telegram_chat_id=str(chat_id)).first()

                        code = f"{random.randint(100000, 999999)}"

                        if user:
                            user.telegram_chat_id = str(chat_id)
                            user.verification_code = code
                            user.save(update_fields=["telegram_chat_id", "verification_code"])

                            if is_reset_intent:
                                reply = (
                                    f"🔐 *Chapter & Chats Password Reset*\n\n"
                                    f"Hello {user.full_name or user.username}!\n"
                                    f"Your password reset code is: `{code}`\n\n"
                                    f"Do not share this with anyone."
                                )
                            else:
                                reply = (
                                    f"📚 *Chapter & Chats Verification*\n\n"
                                    f"Hello {user.full_name or user.username}!\n"
                                    f"Your 6-digit security code is: `{code}`\n\n"
                                    f"Enter this code on the website to complete your verification."
                                )

                            self.stdout.write(self.style.SUCCESS(
                                f"✓ Dispatched code [{code}] to {user.full_name or user.username} (chat_id={chat_id})"
                            ))
                        else:
                            reply = (
                                f"📚 *Chapter & Chats Bot*\n\n"
                                f"Welcome! Please return to the website and open the bot via the provided button so your phone number connects automatically, or enter your registered phone number here."
                            )

                        requests.post(
                            f"{BASE_URL}/sendMessage",
                            json={"chat_id": chat_id, "text": reply, "parse_mode": "Markdown"},
                            timeout=10
                        )

            except Exception as e:
                self.stderr.write(f"Error in polling: {e}")
                time.sleep(2)
