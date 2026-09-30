"""
Create the first Admin Panel account.

Run from the backend folder:
    python -m app.init_admin
"""

import getpass

from .database import engine, SessionLocal
from .migrations import prepare_database
from .models.admin import Admin
from .core.security import password_hash


def main():
    prepare_database(engine)

    username = input("Admin username: ").strip()
    email = input("Admin email: ").strip()
    password = getpass.getpass("Admin password (hidden while typing): ")
    confirm = getpass.getpass("Confirm password: ")

    if not username or not email or not password:
        print("All fields are required.")
        return

    if password != confirm:
        print("Passwords do not match.")
        return

    db = SessionLocal()

    try:
        existing = (
            db.query(Admin)
            .filter(
                (Admin.email == email) |
                (Admin.username == username)
            )
            .first()
        )

        if existing:
            print(
                f"Admin '{existing.username}' ({existing.email}) already exists."
            )
            answer = input("Reset this admin's password to the one you entered? (y/n): ")

            if answer.strip().lower() == "y":
                existing.password_hash = password_hash.hash(password)
                db.commit()
                print("Password updated.")

            return

        db.add(
            Admin(
                username=username,
                email=email,
                password_hash=password_hash.hash(password)
            )
        )
        db.commit()

        print(f"Admin '{username}' created.")

    finally:
        db.close()


if __name__ == "__main__":
    main()
