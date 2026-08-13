"""`make seed` entrypoint — wipes and reseeds MongoDB (SPEC §11)."""
import asyncio

from db import db
from services.seed_data import seed


async def _main():
    counts = await seed(db)
    print("Seeded:", counts)


if __name__ == "__main__":
    asyncio.run(_main())
