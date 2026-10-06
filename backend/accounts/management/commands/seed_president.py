from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Seeds or updates the President superuser account (Fahmi)."

    def handle(self, *args, **options):
        phone_number = "+251905338431"
        username = "fahmi"
        password = "fhm1997???"

        self.stdout.write(f"Seeding President account for phone: {phone_number}, username: {username}...")

        user = User.objects.filter(phone_number=phone_number).first()
        if not user:
            user = User.objects.filter(username__iexact=username).first()

        if user:
            self.stdout.write(self.style.WARNING(f"Updating existing user #{user.id}..."))
            user.phone_number = phone_number
            user.username = username
        else:
            self.stdout.write(self.style.SUCCESS("Creating new user account..."))
            user = User(
                phone_number=phone_number,
                username=username,
            )

        user.full_name = "Fahmi Rahmet"
        user.role = User.Role.ADMIN
        user.officer_title = User.OfficerTitle.PRESIDENT
        user.is_superuser = True
        user.is_staff = True
        user.is_verified = True
        user.is_active = True
        user.set_password(password)
        user.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded President account: username='{user.username}', phone='{user.phone_number}', role='{user.role}', is_superuser={user.is_superuser}, is_staff={user.is_staff}, is_verified={user.is_verified}"
            )
        )
