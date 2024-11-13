import pandas as pd
import json

# Read the CSV file
df = pd.read_csv("src/data/services.csv")

# Convert to dictionary format
services_dict = {}
for _, row in df.iterrows():
    services_dict[row["route_number"]] = {
        "route_name": row["route_name"],
        "route_type": row["route_type"],
    }

# Write to JSON file
with open("src/data/services.json", "w", encoding="utf-8") as f:
    json.dump(services_dict, f, ensure_ascii=False, indent=2)
