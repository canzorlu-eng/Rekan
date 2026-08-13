import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / ".env")

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = _client[os.environ["DB_NAME"]]


def strip_id(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc = dict(doc)
        doc.pop("_id", None)
    return doc
