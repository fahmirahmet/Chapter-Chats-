import csv
import os
import re
import time
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from accounts.models import User


def normalize_phone_number(raw_phone: str) -> str:
    """
    Normalizes Ethiopian and international phone numbers to standard E.164 (+251...).
    Handles common typing quirks (e.g., 'O' instead of '0', spaces, dashes, 9 digits without 0).
    """
    if not raw_phone:
        return ""

    # Replace typo letter 'O' / 'o' with digit '0', strip whitespace and symbols
    clean = re.sub(r'[oO]', '0', str(raw_phone).strip())
    clean = clean.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
    digits = re.sub(r'\D', '', clean)

    if not digits:
        return ""

    # Ethiopian international format with plus: +251...
    if clean.startswith('+251'):
        return f"+251{clean[4:]}"

    # Ethiopian international format without plus: 2519... or 2517...
    if digits.startswith('251') and len(digits) in (12, 13):
        return f"+{digits}"

    # Ethiopian local format with leading 0: 09... or 07... (10 or 11 digits)
    if digits.startswith('0') and len(digits) in (10, 11) and digits[1] in '79':
        return f"+251{digits[1:]}"

    # Ethiopian local format missing leading 0: 9... or 7... (9 digits)
    if len(digits) == 9 and digits[0] in '79':
        return f"+251{digits}"

    # General international E.164 format with plus
    if clean.startswith('+') and 9 <= len(digits) <= 15:
        return f"+{digits}"

    # Fallback: if 9-15 digits
    if 9 <= len(digits) <= 15:
        if digits.startswith(('9', '7')):
            return f"+251{digits}"
        return f"+{digits}"

    return clean


def generate_base_username(full_name: str, phone: str) -> str:
    """
    Generates a clean username from full name or phone digits.
    e.g. 'Kaleb Mesfin' -> 'kaleb_mesfin'
    """
    if not full_name:
        digits = re.sub(r'\D', '', phone)
        return f"reader_{digits[-4:]}" if len(digits) >= 4 else "reader"

    clean_name = re.sub(r'[^a-zA-Z0-9\s]', '', full_name).strip().lower()
    parts = clean_name.split()
    if not parts:
        digits = re.sub(r'\D', '', phone)
        return f"reader_{digits[-4:]}" if len(digits) >= 4 else "reader"

    base = "_".join(parts[:2]) if len(parts) >= 2 else parts[0]
    return base[:30]


class Command(BaseCommand):
    help = "Imports/seeds club members from members.csv into the Supabase database."

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv-path',
            dest='csv_path',
            default=None,
            help="Path to the members.csv file (default: searches project root and backend folder)",
        )
        parser.add_argument(
            '--password',
            dest='password',
            default='ReadingPass2026!',
            help="Default usable initial password for new members (default: 'ReadingPass2026!')",
        )
        parser.add_argument(
            '--unusable-password',
            dest='unusable_password',
            action='store_true',
            help="Set unusable password on imported accounts (Telegram verification code only)",
        )
        parser.add_argument(
            '--role',
            dest='role',
            default=User.Role.MEMBER,
            help="Role assigned to imported general members (default: MEMBER)",
        )
        parser.add_argument(
            '--dry-run',
            dest='dry_run',
            action='store_true',
            help="Simulate import process without saving changes to the database",
        )

    def find_csv_file(self, specified_path=None) -> Path:
        if specified_path:
            p = Path(specified_path)
            if p.exists() and p.is_file():
                return p
            raise CommandError(f"Specified CSV file not found: {specified_path}")

        candidates = [
            settings.BASE_DIR / 'members.csv',
            settings.BASE_DIR.parent / 'members.csv',
            Path.cwd() / 'members.csv',
            Path.cwd() / 'backend' / 'members.csv',
        ]
        for candidate in candidates:
            if candidate.exists() and candidate.is_file():
                return candidate

        raise CommandError(
            "Could not locate members.csv. Please place members.csv in the project root or backend folder, "
            "or provide --csv-path <path>."
        )

    def handle(self, *args, **options):
        t0 = time.time()
        csv_file = self.find_csv_file(options.get('csv_path'))
        dry_run = options.get('dry_run', False)
        default_password = options.get('password', 'ReadingPass2026!')
        unusable_password = options.get('unusable_password', False)
        target_role = options.get('role', User.Role.MEMBER)

        self.stdout.write(self.style.NOTICE(f"=== Starting Member Import from {csv_file} ==="))
        if dry_run:
            self.stdout.write(self.style.WARNING("[DRY RUN MODE] No database modifications will be committed."))

        # 1. Read CSV rows
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        total_rows = len(rows)
        self.stdout.write(f"Read {total_rows} rows from CSV.")

        # 2. Prefetch existing database records to minimize network roundtrips
        self.stdout.write("Inspecting existing accounts in database...")
        existing_users = {u.phone_number: u for u in User.objects.all() if u.phone_number}
        assigned_usernames = {u.username.lower() for u in User.objects.all() if u.username}

        created_count = 0
        updated_count = 0
        duplicate_rows_count = 0
        skipped_count = 0

        # Track phone numbers seen in this CSV run
        seen_phones_in_csv = {}

        # 3. Process records inside atomic transaction
        with transaction.atomic():
            for idx, row in enumerate(rows, start=1):
                raw_phone = row.get('Phone Number', '').strip()
                norm_phone = normalize_phone_number(raw_phone)

                if not norm_phone:
                    self.stdout.write(self.style.WARNING(f"Row {idx}: Skipping empty or invalid phone '{raw_phone}'"))
                    skipped_count += 1
                    continue

                full_name = row.get('Full Name', '').strip()
                dept_raw = row.get('Department', '').strip()
                year_raw = (row.get('Year of study ') or row.get('Year of study') or '').strip()
                tg_raw = row.get('Telegram Username', '').strip()
                genres = row.get('What genres or types of books excite you the most?', '').strip()
                membership_status = row.get('Are you a returning member or joining for the first time?', '').strip()
                events_interest = row.get('Would you be interested in joining special events such as movie nights, campfires, and author sessions?', '').strip()

                # Infer year of study if empty
                year_of_study = year_raw
                if not year_of_study:
                    if re.search(r'fresh\s*man|first year|1st year', dept_raw, re.I):
                        year_of_study = 'Freshman'
                    elif re.search(r'2nd year|2nd', dept_raw, re.I):
                        year_of_study = '2nd year'
                    elif re.search(r'3rd year|3rd', dept_raw, re.I):
                        year_of_study = '3rd year'
                    elif re.search(r'4th year|4th', dept_raw, re.I):
                        year_of_study = '4th year'
                    elif re.search(r'5th year|year 5|5th', dept_raw, re.I):
                        year_of_study = '5th year'

                # Format reader bio
                bio_parts = []
                if genres:
                    bio_parts.append(f"Favorite Genres: {genres}")
                if tg_raw and not ('@' in tg_raw and '.' in tg_raw):
                    bio_parts.append(f"Telegram: {tg_raw}")
                if membership_status:
                    bio_parts.append(f"Club Status: {membership_status}")
                if events_interest:
                    bio_parts.append(f"Events Interest: {events_interest}")
                bio = "\n".join(bio_parts)

                # Extract optional email if provided in Telegram column
                email = ''
                if '@' in tg_raw and '.' in tg_raw:
                    email = tg_raw

                # Split name into first and last name
                name_parts = full_name.split()
                first_name = name_parts[0] if name_parts else ''
                last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ''

                # Determine username:
                # 1) If user already in DB, keep their existing username
                # 2) If duplicate submission in CSV, keep already assigned username
                # 3) Otherwise, generate clean unique username
                existing_user = existing_users.get(norm_phone)
                is_duplicate_in_csv = norm_phone in seen_phones_in_csv

                if is_duplicate_in_csv:
                    duplicate_rows_count += 1
                    username = seen_phones_in_csv[norm_phone]
                elif existing_user and existing_user.username:
                    username = existing_user.username
                else:
                    base_uname = generate_base_username(full_name, norm_phone)
                    username = base_uname
                    counter = 1
                    while username.lower() in assigned_usernames:
                        username = f"{base_uname}_{counter}"
                        counter += 1
                    assigned_usernames.add(username.lower())

                seen_phones_in_csv[norm_phone] = username

                # Determine role: protect existing executive/officer roles
                role_to_assign = target_role
                officer_title_to_assign = User.OfficerTitle.NONE
                if existing_user:
                    if existing_user.role in [User.Role.ADMIN, User.Role.OWNER, User.Role.OFFICER] or existing_user.is_staff or existing_user.is_superuser:
                        role_to_assign = existing_user.role
                    if existing_user.officer_title and existing_user.officer_title != User.OfficerTitle.NONE:
                        officer_title_to_assign = existing_user.officer_title

                defaults = {
                    'username': username,
                    'full_name': full_name[:150],
                    'first_name': first_name[:150],
                    'last_name': last_name[:150],
                    'department': dept_raw[:100],
                    'year_of_study': year_of_study[:50],
                    'role': role_to_assign,
                    'officer_title': officer_title_to_assign,
                    'bio': bio,
                    'is_active': True,
                    'is_verified': True,
                }
                if email:
                    defaults['email'] = email

                if dry_run:
                    if existing_user or is_duplicate_in_csv:
                        updated_count += 1
                    else:
                        created_count += 1
                    continue

                user, was_created = User.objects.update_or_create(
                    phone_number=norm_phone,
                    defaults=defaults
                )

                # Password configuration
                if was_created or not user.has_usable_password():
                    if unusable_password:
                        user.set_unusable_password()
                    else:
                        user.set_password(default_password)
                    user.save(update_fields=['password'])

                # Cache in existing_users
                existing_users[norm_phone] = user

                if was_created:
                    created_count += 1
                else:
                    updated_count += 1

            if dry_run:
                transaction.set_rollback(True)

        elapsed = time.time() - t0
        self.stdout.write(self.style.SUCCESS("\n=== Member Import Completed Successfully ==="))
        self.stdout.write(f"  Total CSV rows:        {total_rows}")
        self.stdout.write(f"  New members created:   {created_count}")
        self.stdout.write(f"  Existing/updated rows: {updated_count} (including {duplicate_rows_count} duplicate submissions)")
        self.stdout.write(f"  Skipped rows:          {skipped_count}")
        self.stdout.write(f"  Time taken:            {elapsed:.2f} seconds")
        self.stdout.write(f"  Active password policy: {'Unusable (Telegram auth)' if unusable_password else f'Usable initial password ({default_password})'}")
        self.stdout.write(self.style.SUCCESS("All member records are synchronized in the database!"))
