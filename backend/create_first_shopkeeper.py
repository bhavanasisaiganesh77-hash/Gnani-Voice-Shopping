from getpass import getpass

from database import SessionLocal
from models import StaffUser
from auth import hash_password


def main():
    db = SessionLocal()

    try:
        existing = db.query(StaffUser).filter(
            StaffUser.role == "shopkeeper"
        ).first()

        if existing:
            print("A shopkeeper account already exists.")
            return

        full_name = input("Enter shopkeeper name: ").strip()
        username = input("Create shopkeeper username: ").strip()
        password = getpass("Create shopkeeper password: ")
        confirm_password = getpass("Confirm password: ")

        if not full_name or not username or not password:
            print("All fields are required.")
            return

        if len(password) < 8:
            print("Password must contain at least 8 characters.")
            return

        if password != confirm_password:
            print("Passwords do not match.")
            return

        account = StaffUser(
            full_name=full_name,
            username=username,
            password_hash=hash_password(password),
            role="shopkeeper",
            is_active=True,
        )

        db.add(account)
        db.commit()

        print("First shopkeeper account created successfully!")

    except Exception as error:
        db.rollback()
        print("Could not create account:", error)

    finally:
        db.close()


if __name__ == "__main__":
    main()