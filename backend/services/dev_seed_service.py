from datetime import date, datetime, timezone
import os

import bcrypt
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.branch import Branch
from models.child import Child
from models.customer import Customer, GuardianInfo
from models.product import Product
from models.user import User
from models.zone import Zone


class DevSeedService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    @staticmethod
    def _is_dev_mode_enabled() -> bool:
        return os.environ.get("DEV_MODE", "").lower() == "true"

    async def seed(self) -> dict:
        if not self._is_dev_mode_enabled():
            return {
                "allowed": False,
                "message": "DEV_MODE is not enabled",
            }

        created = {
            "admin": False,
            "parent": False,
            "staff": False,
            "branch": False,
            "zones": 0,
            "products": 0,
            "customer": False,
            "child": False,
        }

        demo_accounts = [
            {
                "key": "admin",
                "email": "admin@peekaboo.com",
                "password": "admin123",
                "display_name": "Peekaboo Admin",
                "role": "ADMIN",
            },
            {
                "key": "parent",
                "email": "parent@peekaboo.com",
                "password": "parent123",
                "display_name": "Peekaboo Parent",
                "role": "PARENT",
            },
            {
                "key": "staff",
                "email": "staff@peekaboo.com",
                "password": "staff123",
                "display_name": "Peekaboo Staff",
                "role": "STAFF",
            },
        ]

        users_by_key = {}
        for account in demo_accounts:
            user_doc = await self.db.users.find_one({"email": account["email"]}, {"_id": 0})
            if not user_doc:
                password_hash = bcrypt.hashpw(account["password"].encode(), bcrypt.gensalt()).decode()
                user = User(
                    email=account["email"],
                    password_hash=password_hash,
                    display_name=account["display_name"],
                    role=account["role"],
                )
                user_doc = user.model_dump()
                user_doc["created_at"] = user_doc["created_at"].isoformat()
                user_doc["updated_at"] = user_doc["updated_at"].isoformat()
                await self.db.users.insert_one(user_doc)
                created[account["key"]] = True
            users_by_key[account["key"]] = user_doc

        admin_doc = users_by_key["admin"]

        branch_doc = await self.db.branches.find_one({"name": "Peekaboo Main"}, {"_id": 0})
        if not branch_doc:
            branch = Branch(
                name="Peekaboo Main",
                name_ar="بيكابو الرئيسي",
                address="Main Street",
                city="Amman",
                phone="+962700000000",
                email="main@peekaboo.com",
            )
            branch_dict = branch.model_dump()
            branch_dict["created_at"] = branch_dict["created_at"].isoformat()
            branch_dict["updated_at"] = branch_dict["updated_at"].isoformat()
            await self.db.branches.insert_one(branch_dict)
            branch_doc = branch_dict
            created["branch"] = True

        zone_seeds = [
            {
                "zone_name": "Soft Play",
                "zone_name_ar": "المنطقة اللينة",
                "zone_type": "SOFTPLAY",
                "capacity_per_slot": 20,
            },
            {
                "zone_name": "Sand Area",
                "zone_name_ar": "منطقة الرمل",
                "zone_type": "SAND",
                "capacity_per_slot": 15,
            },
        ]

        for zone_seed in zone_seeds:
            existing_zone = await self.db.zones.find_one(
                {
                    "branch_id": branch_doc["branch_id"],
                    "zone_name": zone_seed["zone_name"],
                },
                {"_id": 0},
            )
            if existing_zone:
                continue

            zone = Zone(branch_id=branch_doc["branch_id"], **zone_seed)
            zone_dict = zone.model_dump()
            zone_dict["created_at"] = zone_dict["created_at"].isoformat()
            zone_dict["updated_at"] = zone_dict["updated_at"].isoformat()
            await self.db.zones.insert_one(zone_dict)
            created["zones"] += 1

        product_seeds = [
            {
                "name_ar": "ساعة لعب",
                "name_en": "1 hour play",
                "category": "WALK_IN",
                "price": 7.0,
                "duration_hours": 1.0,
            },
            {
                "name_ar": "ساعتان لعب",
                "name_en": "2 hour play",
                "category": "WALK_IN",
                "price": 10.0,
                "duration_hours": 2.0,
            },
            {
                "name_ar": "تذكرة يومية",
                "name_en": "Day pass",
                "category": "OTHER",
                "price": 25.0,
                "description_en": "Full day access",
            },
        ]

        for product_seed in product_seeds:
            existing_product = await self.db.products.find_one(
                {"name_en": product_seed["name_en"]},
                {"_id": 0},
            )
            if existing_product:
                continue

            product = Product(**product_seed)
            product_dict = product.model_dump()
            product_dict["created_at"] = product_dict["created_at"].isoformat()
            product_dict["updated_at"] = product_dict["updated_at"].isoformat()
            await self.db.products.insert_one(product_dict)
            created["products"] += 1

        customer_doc = await self.db.customers.find_one(
            {"guardian.name": "Test Parent", "child_name": "Test Kid"},
            {"_id": 0},
        )
        if not customer_doc:
            customer = Customer(
                card_number="TEST-CARD-0001",
                child_name="Test Kid",
                child_dob=date(2021, 1, 1),
                guardian=GuardianInfo(name="Test Parent", phone="+962700000111", email="parent@test.local"),
                branch_id=branch_doc["branch_id"],
                waiver_accepted=True,
                waiver_accepted_at=datetime.now(timezone.utc),
                notes="Seed customer",
            )
            customer_dict = customer.model_dump()
            customer_dict["created_at"] = customer_dict["created_at"].isoformat()
            customer_dict["updated_at"] = customer_dict["updated_at"].isoformat()
            customer_dict["child_dob"] = customer_dict["child_dob"].isoformat()
            customer_dict["waiver_accepted_at"] = customer_dict["waiver_accepted_at"].isoformat()
            await self.db.customers.insert_one(customer_dict)
            created["customer"] = True

        child_doc = await self.db.children.find_one(
            {"guardian_id": admin_doc["user_id"], "full_name": "Test Kid"},
            {"_id": 0},
        )
        if not child_doc:
            child = Child(
                guardian_id=admin_doc["user_id"],
                full_name="Test Kid",
                birth_date=date(2021, 1, 1),
                medical_notes="Seed child record",
            )
            child_dict = child.model_dump()
            child_dict["created_at"] = child_dict["created_at"].isoformat()
            child_dict["updated_at"] = child_dict["updated_at"].isoformat()
            child_dict["birth_date"] = child_dict["birth_date"].isoformat()
            await self.db.children.insert_one(child_dict)
            created["child"] = True

        return {
            "allowed": True,
            "created": created,
            "demo_accounts": [
                {
                    "role": account["role"],
                    "email": account["email"],
                    "password": account["password"],
                }
                for account in demo_accounts
            ],
        }
