"""Seed data (SPEC §11): 3 businesses, 3 task cards, ~40 runs + ~25 stuck events
clustered on café steps 4 and 7, plus pre-written suggestions so /demo needs no key."""
import random
from datetime import datetime, timedelta, timezone


def _t(days_ago: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()


BUSINESSES = [
    {"id": "biz-kopi", "name": "Kopi Rekan", "sector": "cafe", "city": "Jakarta", "logo_seed": "kopi"},
    {"id": "biz-laundry", "name": "Laundry Bersih", "sector": "laundry", "city": "Depok", "logo_seed": "laundry"},
    {"id": "biz-ritel", "name": "Toko Ritel Maju", "sector": "minimarket", "city": "Bandung", "logo_seed": "ritel"},
]


def _step(order, tid, ten, iid, ien, cid, cen, pg, safety=False):
    return {
        "order": order,
        "title": {"id": tid, "en": ten},
        "instruction": {"id": iid, "en": ien},
        "check": {"id": cid, "en": cen},
        "pictogram": pg,
        "image_url": None,
        "sign_video_url": None,
        "safety": safety,
        "simplified": None,
    }


KOPI_STEPS = [
    _step(1, "Siapkan gelas", "Prepare glass", "Ambil gelas bersih dari rak.", "Take a clean glass from the shelf.", "Gelas tidak retak dan kering.", "Glass is not cracked and is dry.", "cup"),
    _step(2, "Isi es", "Add ice", "Isi gelas dengan es batu.", "Fill the glass with ice cubes.", "Es mengisi setengah gelas.", "Ice fills half the glass.", "ice"),
    _step(3, "Tuang susu", "Pour milk", "Tuang susu sampai setengah gelas.", "Pour milk until the glass is half full.", "Susu berhenti di garis tengah.", "Milk stops at the middle line.", "milk"),
    _step(4, "Buat espresso", "Make espresso", "Buat satu shot espresso.", "Make one shot of espresso.", "Espresso berwarna coklat pekat.", "Espresso is dark brown.", "coffee"),
    _step(5, "Panaskan susu", "Steam milk", "Panaskan susu dengan steam wand.", "Heat the milk with the steam wand.", "Susu hangat, tidak mendidih.", "Milk is warm, not boiling.", "hot", safety=True),
    _step(6, "Tuang espresso", "Pour espresso", "Tuang espresso ke atas susu.", "Pour the espresso over the milk.", "Ada lapisan coklat di atas.", "A brown layer sits on top.", "pour"),
    _step(7, "Aduk kopi", "Stir coffee", "Aduk perlahan dengan sendok.", "Stir gently with the spoon.", "Warna kopi menjadi rata.", "The color looks even.", "mix"),
    _step(8, "Tambah gula", "Add sugar", "Tambahkan gula cair jika diminta.", "Add liquid sugar if the customer asks.", "Rasa manis sesuai pesanan.", "Sweetness matches the order.", "sugar"),
    _step(9, "Sajikan", "Serve", "Sajikan dengan sedotan.", "Serve the drink with a straw.", "Sedotan terpasang, gelas bersih.", "Straw is in, glass is clean.", "done"),
]

LAUNDRY_STEPS = [
    _step(1, "Ambil pakaian", "Take clothes", "Ambil pakaian bersih dari keranjang.", "Take clean clothes from the basket.", "Pakaian kering dan bersih.", "Clothes are dry and clean.", "box"),
    _step(2, "Cek nomor", "Check number", "Periksa nomor pesanan pada nota.", "Check the order number on the ticket.", "Nomor cocok dengan nota.", "Number matches the ticket.", "scan"),
    _step(3, "Lipat rapi", "Fold neatly", "Lipat setiap pakaian dengan rapi.", "Fold each item of clothing neatly.", "Lipatan lurus dan rata.", "Folds are straight and even.", "fold"),
    _step(4, "Tumpuk sama", "Stack same", "Tumpuk pakaian pesanan yang sama.", "Stack clothes from the same order.", "Satu tumpukan per pesanan.", "One stack per order.", "sort"),
    _step(5, "Masukkan kantong", "Bag items", "Masukkan pakaian ke dalam kantong.", "Put the clothes into the bag.", "Semua pakaian masuk kantong.", "All clothes are in the bag.", "bag"),
    _step(6, "Tempel label", "Attach label", "Tempel label nomor pada kantong.", "Attach the number label to the bag.", "Label menempel dan terbaca.", "Label sticks and is readable.", "mark"),
    _step(7, "Letakkan di rak", "Place on shelf", "Letakkan kantong di rak pesanan.", "Place the bag on the order shelf.", "Kantong di rak yang benar.", "Bag is on the correct shelf.", "shelf"),
]

RITEL_STEPS = [
    _step(1, "Ambil minuman", "Take drinks", "Ambil minuman dari gudang.", "Take drinks from the storage room.", "Jumlah sesuai daftar isi ulang.", "Amount matches the refill list.", "box"),
    _step(2, "Cek kadaluarsa", "Check expiry", "Periksa tanggal kadaluarsa botol.", "Check the expiry date on bottles.", "Tidak ada botol kadaluarsa.", "No expired bottles remain.", "scan"),
    _step(3, "Bersihkan rak", "Clean shelf", "Bersihkan rak dengan lap.", "Clean the shelf with a cloth.", "Rak bebas debu dan tumpahan.", "Shelf is free of dust and spills.", "clean"),
    _step(4, "Susun botol", "Line bottles", "Susun botol menghadap ke depan.", "Line up bottles facing the front.", "Semua label menghadap depan.", "All labels face the front.", "bottle"),
    _step(5, "Stok lama depan", "Old stock front", "Taruh stok lama di paling depan.", "Put old stock at the very front.", "Tanggal terdekat ada di depan.", "Nearest date sits at the front.", "sort"),
    _step(6, "Rapikan harga", "Tidy prices", "Rapikan label harga di rak.", "Tidy the price tags on the shelf.", "Setiap harga lurus dan benar.", "Each price is straight and correct.", "mark"),
]

CARDS = [
    {
        "id": "card-kopi", "business_id": "biz-kopi",
        "title": {"id": "Membuat Es Kopi Susu", "en": "Make Iced Milk Coffee"},
        "category": "minuman", "estimated_minutes": 6, "steps": KOPI_STEPS,
        "status": "published", "join_code": "KOPI01",
        "created_at": _t(30), "updated_at": _t(1),
    },
    {
        "id": "card-laundry", "business_id": "biz-laundry",
        "title": {"id": "Melipat dan Menandai Pesanan", "en": "Fold and Label Orders"},
        "category": "operasional", "estimated_minutes": 5, "steps": LAUNDRY_STEPS,
        "status": "published", "join_code": "LAUN01",
        "created_at": _t(20), "updated_at": _t(2),
    },
    {
        "id": "card-ritel", "business_id": "biz-ritel",
        "title": {"id": "Mengisi Ulang Rak Minuman", "en": "Restock the Drinks Shelf"},
        "category": "operasional", "estimated_minutes": 4, "steps": RITEL_STEPS,
        "status": "published", "join_code": "RITE01",
        "created_at": _t(15), "updated_at": _t(3),
    },
]

SUGGESTIONS = [
    {
        "id": "sug-1", "task_card_id": "card-kopi", "step_order": 4,
        "text": {
            "id": "Tambahkan foto mesin espresso dan tandai tombol untuk satu shot.",
            "en": "Add a photo of the espresso machine and mark the single-shot button.",
        },
        "generated_at": _t(1),
    },
    {
        "id": "sug-2", "task_card_id": "card-kopi", "step_order": 7,
        "text": {
            "id": "Ganti 'aduk perlahan' dengan 'aduk 3 kali dengan sendok panjang'.",
            "en": "Replace 'stir gently' with 'stir 3 times with the long spoon'.",
        },
        "generated_at": _t(1),
    },
    {
        "id": "sug-3", "task_card_id": "card-kopi", "step_order": 4,
        "text": {
            "id": "Tambahkan tombol audio yang menjelaskan cara membaca takaran espresso.",
            "en": "Add an audio button explaining how to read the espresso measure.",
        },
        "generated_at": _t(1),
    },
]


def build_runs_and_stuck():
    """~40 café runs, faster over time; ~25 stuck events clustered on steps 4 and 7."""
    rng = random.Random(42)
    runs = []
    stuck = []
    n_steps = len(KOPI_STEPS)
    n_runs = 40
    for i in range(n_runs):
        days_ago = 30 - (i * 30 / n_runs)  # oldest first
        # improvement factor: later runs are faster
        speed = 1.0 - (i / n_runs) * 0.45
        durations = []
        for s in range(n_steps):
            base = rng.uniform(15, 35)
            if s in (3, 6):  # steps 4 and 7 are harder (0-indexed)
                base += rng.uniform(20, 45)
            durations.append(round(base * speed, 1))
        started = _t(days_ago)
        finished = (
            datetime.fromisoformat(started) + timedelta(seconds=sum(durations))
        ).isoformat()
        run_id = f"run-kopi-{i:02d}"
        runs.append({
            "id": run_id, "worker_id": f"w-{rng.randint(1, 6)}",
            "task_card_id": "card-kopi", "started_at": started,
            "finished_at": finished, "step_durations": durations,
        })

    # ~25 stuck events clustered on step 4 (order 4) and step 7 (order 7)
    kinds = ["simpler", "picture", "ask"]
    clusters = [4] * 14 + [7] * 9 + [5] * 2  # 25 total, small tail on safety step 5
    for j, order in enumerate(clusters):
        run = rng.choice(runs)
        stuck.append({
            "id": f"stuck-kopi-{j:02d}", "run_id": run["id"],
            "task_card_id": "card-kopi", "step_order": order,
            "kind": rng.choice(kinds), "created_at": run["started_at"],
        })
    return runs, stuck


async def seed(db):
    runs, stuck = build_runs_and_stuck()
    for coll in ("businesses", "task_cards", "runs", "stuck_events", "suggestions"):
        await db[coll].delete_many({})
    await db.businesses.insert_many([dict(b) for b in BUSINESSES])
    await db.task_cards.insert_many([dict(c) for c in CARDS])
    await db.runs.insert_many(runs)
    await db.stuck_events.insert_many(stuck)
    await db.suggestions.insert_many([dict(s) for s in SUGGESTIONS])
    return {
        "businesses": len(BUSINESSES), "task_cards": len(CARDS),
        "runs": len(runs), "stuck_events": len(stuck),
        "suggestions": len(SUGGESTIONS),
    }
