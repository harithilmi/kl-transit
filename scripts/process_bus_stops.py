import pandas as pd
import os
import re

# Create the output directory if it doesn't exist
os.makedirs("src/data/processed", exist_ok=True)

# Read the input files
raw_df = pd.read_csv("src/data/raw/all_bus_stops.csv")
rapid_df = pd.read_csv("src/data/raw/stops_rapid.csv")
mrt_df = pd.read_csv("src/data/raw/stops_mrt.csv")

# Convert stop_id columns to strings
rapid_df["stop_id"] = rapid_df["stop_id"].astype(str)
mrt_df["stop_id"] = mrt_df["stop_id"].astype(str)
raw_df["stop_id"] = raw_df["stop_id"].astype(str)

# After reading the input files, create a name-to-code mapping
mrt_name_to_code = dict(zip(mrt_df["stop_name"], mrt_df["stop_code"]))

def extract_stop_info(stop_name):
    if pd.isna(stop_name):
        return None, stop_name

    # Clean whitespace first
    stop_name = str(stop_name).strip()
    
    # First check if we have a direct mapping from MRT data
    if stop_name in mrt_name_to_code:
        return mrt_name_to_code[stop_name], stop_name

    # Valid prefixes for stop codes
    valid_prefixes = [
        "KL",
        "PJ",
        "SJ",
        "SA",
        "SL",
        "SP",
        "AJ",
        "KS",
        "LG",
        "KJ",
        "PPJ",
        "BD",
    ]

    # Try to find a code that starts with valid prefix and its number
    pattern = f"({'|'.join(valid_prefixes)})\\s*(\\\d+)"
    match = re.search(pattern, stop_name)
    if match:
        prefix = match.group(1)
        number = match.group(2)
        stop_code = f"{prefix}{number}"

        # Remove the prefix and number from the name and clean up
        clean_name = re.sub(pattern, "", stop_name).strip()
        # Remove any leading/trailing spaces and commas
        clean_name = re.sub(r"^[\s,]+|[\s,]+$", "", clean_name)
        return stop_code, clean_name
    return None, stop_name


# Clean and standardize stop codes in reference data
def clean_stop_code(row):
    # Clean whitespace first
    if "stop_name" in row and pd.notna(row["stop_name"]):
        row["stop_name"] = str(row["stop_name"]).strip()
    if "stop_code" in row and pd.notna(row["stop_code"]):
        row["stop_code"] = str(row["stop_code"]).strip()

    # Extract stop code from stop_name if present (for rapid data)
    if "stop_name" in row and pd.notna(row["stop_name"]):
        match = re.search(r"^([A-Z]+\d+)", row["stop_name"])
        if match:
            return match.group(1)
    # Return stop_code if present
    if "stop_code" in row and pd.notna(row["stop_code"]):
        return row["stop_code"]
    return None


# Clean rapid data
rapid_df["clean_code"] = rapid_df.apply(clean_stop_code, axis=1)
rapid_mapping = dict(zip(rapid_df["clean_code"], rapid_df["stop_id"]))

# Clean MRT data
mrt_df["clean_code"] = mrt_df.apply(clean_stop_code, axis=1)
mrt_mapping = dict(zip(mrt_df["clean_code"], mrt_df["stop_id"]))


# Define MRT feeder routes (from the list provided)
MRT_FEEDER_ROUTES = {
    "T413",
    "T117",
    "T459",
    "T305",
    "T407",
    "T400",
    "T512",
    "T802",
    "T807",
    "T455",
    "T111",
    "T411",
    "T562",
    "T586",
    "T819",
    "T565",
    "T820",
    "T569",
    "T101",
    "T816",
    "T506",
    "T412",
    "T104",
    "T543",
    "T509",
    "T105",
    "T453",
    "T107",
    "T564",
    "T457",
    "T460",
    "T110",
    "T458",
    "T803",
    "T852",
    "T804",
    "T103",
    "T508",
    "T510",
    "T560",
    "T812",
    "T505",
    "T511",
    "T561",
    "T544",
    "T100",
    "T772",
    "T567",
    "T408",
    "T801",
    "T545",
    "T821",
    "T817",
    "T106",
    "T154",
    "T809",
    "T813",
    "T401",
    "T121",
    "T115",
    "T568",
    "T588",
    "T542",
    "T815",
    "T108",
    "T465",
    "T419",
    "T409",
    "T563",
    "T462",
    "T352",
    "T410",
    "T461",
    "T811",
    "T119",
    "T155",
    "T180",
    "T114",
    "T417",
    "T566",
    "T814",
    "T507",
    "T810",
    "T504",
    "T805",
    "T818",
    "T463",
    "T118",
    "T808",
    "T152",
    "T113",
    "T456",
    "T109",
    "T587",
    "T464",
    "T415",
    "T559",
    "T414",
    "T102",
    "T418",
    "T112",
    "T451",
    "T589",
    "T402",
    "T416",
    "T585",
    "T454",
}


# Function to get correct stop_id from mappings
def get_correct_stop_id(row):
    if pd.isna(row["stop_code"]):
        # If the stop_id itself is a valid stop code, use it to look up the mapping
        if isinstance(row["stop_id"], str):
            if row["stop_id"] in rapid_mapping:
                return rapid_mapping[row["stop_id"]]
            if row["stop_id"] in mrt_mapping:
                return mrt_mapping[row["stop_id"]]
        
        # If stop_id is numeric and starts with 1, keep it (Rapid Bus stops)
        if str(row["stop_id"]).isdigit() and str(row["stop_id"]).startswith("1"):
            return row["stop_id"]
        # If stop_id starts with 12, it's an MRT stop
        if str(row["stop_id"]).startswith("12"):
            return row["stop_id"]
        return None

    # Check if this is an MRT feeder route
    route_id = row.get("route_id", "")
    is_mrt_feeder = route_id in MRT_FEEDER_ROUTES

    if is_mrt_feeder:
        # Try MRT stations first for MRT feeder routes
        if row["stop_code"] in mrt_mapping:
            return mrt_mapping[row["stop_code"]]
        # Then try rapid stations as fallback
        if row["stop_code"] in rapid_mapping:
            return rapid_mapping[row["stop_code"]]
    else:
        # For other routes, prioritize Rapid mapping
        if row["stop_code"] in rapid_mapping:
            return rapid_mapping[row["stop_code"]]
        if row["stop_code"] in mrt_mapping:
            return mrt_mapping[row["stop_code"]]

    # If stop_id is numeric and starts with 1 or 12, keep it
    if str(row["stop_id"]).isdigit() and (str(row["stop_id"]).startswith("1")):
        return row["stop_id"]

    return None


# Create stops.csv with unique stop information
stops_output = (
    raw_df[["stop_id", "stop_name", "street_name", "latitude", "longitude"]]
    .drop_duplicates(subset=["stop_id"])
    .copy()
)

# Add stop_codes column and clean names
stops_output[["stop_code", "stop_name"]] = pd.DataFrame(
    stops_output["stop_name"].apply(extract_stop_info).tolist(),
    index=stops_output.index,
)

# Update stop_ids where possible
stops_output["new_stop_id"] = stops_output.apply(get_correct_stop_id, axis=1)
# Replace stop_id with new_stop_id where available
stops_output.loc[stops_output["new_stop_id"].notna(), "stop_id"] = stops_output[
    "new_stop_id"
]
stops_output = stops_output.drop("new_stop_id", axis=1)

# Reorder columns
stops_output = stops_output[
    ["stop_id", "stop_code", "stop_name", "street_name", "latitude", "longitude"]
]

# Create services.csv with route information
services_output = raw_df[["route_number", "stop_id", "direction", "zone"]].copy()

# Add sequence number within each route+direction combination
services_output.loc[:, "sequence"] = (
    services_output.groupby(["route_number", "direction"]).cumcount() + 1
)

# Create a mapping dictionary from stop_code to stop_id using the final stops_output
stop_code_to_id = dict(zip(stops_output["stop_code"], stops_output["stop_id"]))


# Function to get stop_id from stop_code
def get_stop_id(stop_code):
    if pd.isna(stop_code):
        return None
    # Try rapid mapping first
    if stop_code in rapid_mapping:
        return rapid_mapping[stop_code]
    # Then try MRT mapping
    if stop_code in mrt_mapping:
        return mrt_mapping[stop_code]
    # Finally try our processed stops mapping
    if stop_code in stop_code_to_id:
        return stop_code_to_id[stop_code]
    return None


# Update stop_ids in services_output and stops_output
services_output["stop_id"] = services_output["stop_id"].apply(
    lambda x: get_stop_id(x) if isinstance(x, str) and not x.startswith("1") else x
)
stops_output["stop_id"] = stops_output["stop_id"].apply(
    lambda x: get_stop_id(x) if isinstance(x, str) and not x.startswith("1") else x
)

# Instead of removing rows, print the invalid stop_ids
invalid_stops = services_output[services_output["stop_id"].isna()]
if not invalid_stops.empty:
    print("\nFound invalid stop_ids in the following routes:")
    for _, row in invalid_stops.iterrows():
        print(
            f"Route {row['route_number']}, Direction {row['direction']}, Zone {row['zone']}"
        )

# Print invalid stops information
invalid_stops = stops_output[stops_output["stop_id"].isna()]
if not invalid_stops.empty:
    print("\nFound invalid stops:")
    for _, stop in invalid_stops.iterrows():
        print(f"Name: {stop['stop_name']}")
        print(f"Code: {stop['stop_code']}")
        print(f"Location: ({stop['latitude']}, {stop['longitude']})")
        print(f"Street: {stop['street_name']}")
        print("---")

# Save the files
stops_output.to_csv("src/data/processed/stops.csv", index=False)
services_output.to_csv("src/data/processed/services.csv", index=False)

print("\nFiles created successfully in src/data/processed/!")
