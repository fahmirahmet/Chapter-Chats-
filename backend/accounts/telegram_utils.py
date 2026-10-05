import random
import logging
import requests
from django.conf import settings
from django.db.models import Q
from .models import User

logger = logging.getLogger(__name__)


def generate_verification_code():
    """
    Generates a secure 6-digit verification code.
    """
    return f"{random.randint(100000, 999999)}"


def get_telegram_config():
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '') or '8890123009:AAHShvtqB7M4fFmpX6GvjnJyggDxnTvfg6A'
    bot_username = getattr(settings, 'TELEGRAM_BOT_USERNAME', 'chapter_and_chats_bot') or 'chapter_and_chats_bot'
    # Strip any leading @ if present
    bot_username = bot_username.lstrip('@')
    return bot_token.strip(), bot_username.strip()


def find_user_by_phone(phone_input):
    """
    Finds a user account across various phone formatting conventions
    (e.g., +251..., 09..., raw digits, last 9 digits).
    """
    if not phone_input:
        return None
    raw = str(phone_input).strip()

    # Direct match on phone_number or username
    user = User.objects.filter(Q(phone_number=raw) | Q(username=raw)).first()
    if user:
        return user

    # Validate/normalize using phone validator
    from .validators import validate_phone_number
    try:
        norm = validate_phone_number(raw)
        user = User.objects.filter(phone_number=norm).first()
        if user:
            return user
    except Exception:
        pass

    # Match by digits only
    digits = "".join(c for c in raw if c.isdigit())
    if digits:
        user = User.objects.filter(
            Q(phone_number=digits) |
            Q(phone_number=f"+{digits}") |
            Q(username=digits)
        ).first()
        if user:
            return user

        # Ethiopian phone match (last 9 digits)
        if len(digits) >= 9:
            last9 = digits[-9:]
            user = User.objects.filter(phone_number__endswith=last9).first()
            if user:
                return user

    return None


def send_telegram_verification(phone_number, code):
    """
    Dispatches a secure 6-digit verification code to the member's Telegram chat.
    Uses Telegram Bot API sendMessage.
    
    If the member has already linked their Telegram account (telegram_chat_id is set),
    the message is sent directly to their Telegram.
    
    If telegram_chat_id is not yet set, stores the code on the user record and
    returns the deep link URL (https://t.me/<BOT_USERNAME>?start=<clean_phone>)
    so the user can initiate the bot with 1 click.
    """
    user = find_user_by_phone(phone_number)
    if user:
        user.verification_code = str(code).strip()
        user.save(update_fields=['verification_code'])

    bot_token, bot_username = get_telegram_config()
    clean_digits = "".join(c for c in str(phone_number) if c.isdigit())
    bot_url = f"https://t.me/{bot_username}?start={clean_digits}"

    logger.info(f"[Telegram Dispatcher] Verification code for {phone_number}: {code}")

    name = user.full_name or user.username if user else "Reader"
    # Live Telegram message formatting (HTML format provides tap-to-copy code in Telegram)
    message_text = (
        f"📚 Welcome to Chapter &amp; Chats, {name}!\n\n"
        f"Your 6-digit verification code is: <code>{code}</code>\n\n"
        f"Enter this code on the website to activate your account."
    )

    # If user has a linked chat_id and token is present, dispatch live Telegram API call
    if user and user.telegram_chat_id and bot_token:
        try:
            telegram_endpoint = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            resp = requests.post(
                telegram_endpoint,
                json={
                    "chat_id": user.telegram_chat_id,
                    "text": message_text,
                    "parse_mode": "HTML"
                },
                timeout=5
            )
            if resp.status_code == 200:
                logger.info(f"Telegram verification dispatched successfully to chat_id {user.telegram_chat_id}")
                return {
                    "success": True,
                    "sent": True,
                    "needs_bot_start": False,
                    "chat_id": user.telegram_chat_id,
                    "bot_url": bot_url,
                    "bot_link": bot_url,
                    "bot_username": bot_username,
                    "message": "Verification code dispatched to your Telegram chat."
                }
            else:
                logger.warning(f"Telegram API response error: {resp.status_code} - {resp.text}")
        except Exception as e:
            logger.warning(f"Telegram API request failed: {e}")

    # Fallback / onboarding scenario: Prompt user to open the bot via deep-link
    return {
        "success": True,
        "sent": False,
        "needs_bot_start": True,
        "bot_url": bot_url,
        "bot_link": bot_url,
        "bot_username": bot_username,
        "code_preview": code if settings.DEBUG else None,
        "message": f"Please message our Telegram bot @{bot_username} to receive your verification code."
    }


def link_telegram_chat(phone_number, chat_id):
    """
    Associates a user's phone number with their Telegram chat ID.
    """
    user = find_user_by_phone(phone_number)
    if user:
        user.telegram_chat_id = str(chat_id)
        user.save(update_fields=['telegram_chat_id'])
        return user
    return None


def send_telegram_password_reset(phone_or_user, code):
    """
    Dispatches a secure 6-digit password reset code to the member's Telegram chat.
    Uses Telegram Bot API sendMessage with Markdown formatting.
    """
    user = phone_or_user if isinstance(phone_or_user, User) else find_user_by_phone(phone_or_user)
    if user:
        user.verification_code = str(code).strip()
        user.save(update_fields=['verification_code'])

    bot_token, bot_username = get_telegram_config()
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '') or bot_token
    phone_number = getattr(user, 'phone_number', None) if user else phone_or_user
    clean_digits = "".join(c for c in str(phone_number or '') if c.isdigit())
    bot_url = f"https://t.me/{bot_username}?start={clean_digits}"

    logger.info(f"[Telegram Dispatcher] Password reset code for {phone_number}: {code}")

    # If user has a linked chat_id and token is present, dispatch live Telegram API call
    if user and user.telegram_chat_id and bot_token:
        try:
            resp = requests.post(
                f"https://api.telegram.org/bot{bot_token}/sendMessage",
                json={
                    "chat_id": user.telegram_chat_id,
                    "text": f"🔐 *Chapter & Chats Password Reset*\n\nYour reset code is: `{code}`\n\nDo not share this with anyone.",
                    "parse_mode": "Markdown"
                },
                timeout=5
            )
            if resp.status_code == 200:
                logger.info(f"Telegram password reset dispatched successfully to chat_id {user.telegram_chat_id}")
                return {
                    "success": True,
                    "sent": True,
                    "needs_bot_start": False,
                    "chat_id": user.telegram_chat_id,
                    "bot_url": bot_url,
                    "bot_link": bot_url,
                    "bot_username": bot_username,
                    "message": "Password reset code dispatched to your Telegram chat."
                }
            else:
                logger.warning(f"Telegram API response error: {resp.status_code} - {resp.text}")
        except Exception as e:
            logger.warning(f"Telegram API request failed: {e}")

    # Fallback / onboarding scenario: Prompt user to open the bot via deep-link
    return {
        "success": True,
        "sent": False,
        "needs_bot_start": True,
        "bot_url": bot_url,
        "bot_link": bot_url,
        "bot_username": bot_username,
        "code_preview": code if settings.DEBUG else None,
        "message": f"Please message our Telegram bot @{bot_username} to receive your password reset code."
    }
