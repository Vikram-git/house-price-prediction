"""Generate sample houses.csv for local development."""
import numpy as np
import pandas as pd

np.random.seed(42)
n = 220
locations = ["Northridge", "Lakeside", "Downtown", "West End", "Harbor", "Summit"]
prop_types = ["Single Family", "Townhouse", "Condo", "Duplex"]

rows = []
for _ in range(n):
    loc = np.random.choice(locations)
    pt = np.random.choice(prop_types)
    base = {"Northridge": 420, "Lakeside": 380, "Downtown": 510, "West End": 360, "Harbor": 395, "Summit": 440}[loc]
    if pt == "Condo":
        base -= 40
    elif pt == "Townhouse":
        base -= 15
    bedrooms = int(np.random.choice([2, 3, 3, 4, 4, 5]))
    bathrooms = float(bedrooms - np.random.choice([0, 0, 1]))
    sqft = int(np.random.normal(1800 + bedrooms * 220, 280))
    sqft = max(900, min(4200, sqft))
    year = int(np.random.randint(1985, 2024))
    lot = int(np.random.lognormal(7.2, 0.35))
    lot = max(1200, min(15000, lot))
    noise = np.random.normal(0, 22)
    price_k = (
        base
        + bedrooms * 18
        + bathrooms * 12
        + (sqft / 1000) * 95
        + (year - 1990) * 0.9
        + np.log1p(lot) * 3.5
        + noise
    )
    price = int(max(120_000, price_k * 1000))

    rows.append(
        {
            "location": loc,
            "property_type": pt,
            "bedrooms": bedrooms,
            "bathrooms": round(bathrooms, 1),
            "sqft_living": sqft,
            "year_built": year,
            "lot_size": lot,
            "price": price,
        }
    )

df = pd.DataFrame(rows)
out = __file__.replace("generate_sample.py", "houses.csv")
df.to_csv(out, index=False)
print(f"Wrote {len(df)} rows to {out}")
