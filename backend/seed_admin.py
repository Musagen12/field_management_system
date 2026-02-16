# import uuid
# from datetime import datetime
# from sqlmodel import Session, select
# from core.database import engine
# from models.user import User, UserRole, UserStatus
# from passlib.context import CryptContext

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ADMIN_USERNAME = "admin"
# ADMIN_PASSWORD = "admin123"

# def seed_admin():
#     with Session(engine) as session:
#         # check if admin already exists
#         statement = select(User).where(User.username == ADMIN_USERNAME)
#         existing_admin = session.exec(statement).first()

#         if existing_admin:
#             print("✅ Admin already exists")
#             return

#         # create admin user
#         admin = User(
#             id=uuid.uuid4(),
#             username=ADMIN_USERNAME,
#             password_hash=pwd_context.hash(ADMIN_PASSWORD),
#             role=UserRole.admin,
#             status=UserStatus.active,
#             created_at=datetime.now(),
#             updated_at=datetime.now()
#         )

#         session.add(admin)
#         session.commit()
#         print("🎉 Admin seeded successfully")

# if __name__ == "__main__":
#     seed_admin()


import uuid
from datetime import datetime
from sqlmodel import Session, select
from core.database import engine
from models.user import User, UserRole, UserStatus
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"
ADMIN_PHONE = "+254700000001"  # ✅ Kenyan phone number in +254 format

def seed_admin():
    with Session(engine) as session:
        # check if admin already exists
        statement = select(User).where(User.username == ADMIN_USERNAME)
        existing_admin = session.exec(statement).first()

        if existing_admin:
            print("✅ Admin already exists")
            return

        # create admin user
        admin = User(
            id=uuid.uuid4(),
            username=ADMIN_USERNAME,
            password_hash=pwd_context.hash(ADMIN_PASSWORD),
            phone_number=ADMIN_PHONE,   # ✅ added
            role=UserRole.admin,
            status=UserStatus.active,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        session.add(admin)
        session.commit()
        print("🎉 Admin seeded successfully")

if __name__ == "__main__":
    seed_admin()
