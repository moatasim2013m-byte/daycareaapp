from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import OperationFailure
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Load environment
load_dotenv()

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "daycare_db")

client = None
db = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global client, db

    if not MONGO_URL:
        print("Warning: MONGO_URL is not configured; API will start without database connectivity")
        client = None
        db = None
    else:
        try:
            # Startup
            client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
            db = client[DB_NAME]

            # Validate connection and create indexes
            await client.admin.command("ping")
            await create_indexes()

            print(f"Connected to MongoDB: {DB_NAME}")
        except Exception as exc:
            print(f"Warning: MongoDB startup failed: {exc}")
            client = None
            db = None

    yield

    # Shutdown
    if client is not None:
        client.close()
        print("MongoDB connection closed")


async def create_indexes():
    """Create required indexes for performance"""
    # Users
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    
    # Children
    await db.children.create_index("child_id", unique=True)
    await db.children.create_index("guardian_id")
    
    # Products
    await db.products.create_index("product_id", unique=True)
    await db.products.create_index("category")
    
    # Orders
    await db.orders.create_index("order_id", unique=True)
    await db.orders.create_index("order_number", unique=True)
    await db.orders.create_index("guardian_id")
    await db.orders.create_index([("status", 1), ("created_at", -1)])
    
    # Sessions - critical for active session queries
    await db.sessions.create_index("session_id", unique=True)
    await db.sessions.create_index("child_id")
    await db.sessions.create_index("state")
    await db.sessions.create_index([("state", 1), ("checkin_at", -1)])
    await db.sessions.create_index([("child_id", 1), ("state", 1)])

    # Check-in sessions (reception operations)
    await db.checkin_sessions.create_index("session_id", unique=True)
    await db.checkin_sessions.create_index([("status", 1), ("branch_id", 1), ("check_in_time", -1)])
    await db.checkin_sessions.create_index([("customer_id", 1), ("status", 1)])
    await db.checkin_sessions.create_index([("check_out_time", -1), ("status", 1)])
    await db.checkin_sessions.create_index([("branch_id", 1), ("check_in_time", -1)])

    # Subscriptions
    await db.subscriptions.create_index("subscription_id", unique=True)
    await db.subscriptions.create_index("child_id")
    await db.subscriptions.create_index([("child_id", 1), ("status", 1)])
    
    # Visit Packs
    await db.visit_packs.create_index("pack_id", unique=True)
    await db.visit_packs.create_index("child_id")
    await db.visit_packs.create_index([("child_id", 1), ("status", 1)])
    
    # Entitlement Usage
    await db.entitlement_usage.create_index("usage_id", unique=True)
    await db.entitlement_usage.create_index([("subscription_id", 1), ("usage_date", 1)])
    
    # Audit logs: unique only when audit_id exists and is non-null string
    try:
        await db.audit_logs.create_index(
            "audit_id",
            unique=True,
            partialFilterExpression={
                "audit_id": {"$exists": True, "$type": "string", "$ne": None}
            },
        )
    except OperationFailure as exc:
        if exc.code in (85, 86):
            try:
                await db.audit_logs.drop_index("audit_id_1")
            except Exception as drop_exc:
                print(f"Warning: could not drop legacy audit_id index: {drop_exc}")
            try:
                await db.audit_logs.create_index(
                    "audit_id",
                    unique=True,
                    partialFilterExpression={
                        "audit_id": {"$exists": True, "$type": "string", "$ne": None}
                    },
                )
            except Exception as recreate_exc:
                print(f"Warning: could not create partial unique audit_id index: {recreate_exc}")
        else:
            print(f"Warning: audit_id index creation skipped: {exc}")
    await db.audit_logs.create_index([("entity_type", 1), ("entity_id", 1), ("created_at", -1)])
    
    # Payments
    await db.payments.create_index("payment_id", unique=True)
    await db.payments.create_index("order_id")


# Create FastAPI app
app = FastAPI(
    title="Daycare Management System",
    description="نظام إدارة الحضانة - Daycare + Sand Area Management",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "حدث خطأ في النظام"
            }
        }
    )


# Import routers
from routers import auth, children, products, orders, subscriptions, sessions, entitlements, reports, users, branches, zones, checkin, customers


# Create API router with /api prefix
from fastapi import APIRouter
api_router = APIRouter(prefix="/api")

# Include all routers
api_router.include_router(auth.router)
api_router.include_router(children.router)
api_router.include_router(customers.router)
api_router.include_router(products.router)
api_router.include_router(orders.router)
api_router.include_router(subscriptions.router)
api_router.include_router(sessions.router)
api_router.include_router(checkin.router)
api_router.include_router(entitlements.router)
api_router.include_router(reports.router)
api_router.include_router(users.router)
api_router.include_router(branches.router)
api_router.include_router(zones.router)

# Mount API router
app.include_router(api_router)


# Health check
@app.get("/api/")
async def health_check():
    return {
        "message": "Daycare Management System API",
        "status": "operational",
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health():
    return {"status": "healthy", "database": "connected" if db is not None else "disconnected"}
