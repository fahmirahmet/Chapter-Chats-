import re
from django.core.exceptions import ValidationError


def validate_phone_number(phone_str):
    """
    Validates and normalizes phone numbers.
    Supports Ethiopian formats ('0911...', '0711...', '+2519...') and standard international E.164.
    Returns normalized '+251...' or '+...' string.
    """
    if not phone_str:
        raise ValidationError("Phone number is required.")

    raw = str(phone_str).strip().replace(" ", "").replace("-", "")
    
    # Ethiopian local format: 09... or 07... (10 digits)
    if re.match(r'^0[79]\d{8}$', raw):
        return f"+251{raw[1:]}"
    
    # Ethiopian international format without plus: 2519... or 2517...
    if re.match(r'^251[79]\d{8}$', raw):
        return f"+{raw}"

    # General international E.164 format: +[country_code][number] (9-15 digits total)
    if re.match(r'^\+[1-9]\d{8,14}$', raw):
        return raw

    # Fallback digits check
    digits_only = re.sub(r'\D', '', raw)
    if 9 <= len(digits_only) <= 15:
        if not raw.startswith('+'):
            return f"+{raw}"
        return raw

    raise ValidationError("Please provide a valid phone number (e.g. 0912345678 or +251912345678).")


def validate_optional_email(email_str):
    """
    Optional lightweight email regex validation without external DNS/MX dependency.
    """
    if not email_str:
        return ""
    clean_email = str(email_str).strip().lower()
    if not re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', clean_email):
        raise ValidationError("Please provide a valid email format.")
    return clean_email
