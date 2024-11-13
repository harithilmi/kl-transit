 # This script is to clean the stop names in both CSV and JSON files

import pandas as pd
import json
import re
from name_rules import NAME_RULES

def clean_street_name(street):
    if pd.isna(street):
        return street

    # Remove leading/trailing spaces
    street = street.strip()

    # Split into words
    words = street.split()

    # Process each word
    processed_words = []
    for word in words:
        word_upper = word.upper()
        # Check if it's a street type
        if word_upper in NAME_RULES["street_types"]:
            processed_words.append(NAME_RULES["street_types"][word_upper])
        else:
            processed_words.append(word.capitalize())

    return " ".join(processed_words)

def clean_stop_name(name):
    # Handle NaN values
    if pd.isna(name):
        return name

    # Remove leading/trailing spaces
    name = str(name).strip()

    # Remove prefix like (M), (M1)
    name = re.sub(r"\(M\d?\)\s*", "", name)

    def process_word(word):
        word_upper = word.upper()
        if word_upper in NAME_RULES["uppercase"]:
            return word_upper
        # Handle abbreviations like "Jln" -> "Jalan"
        elif word_upper in NAME_RULES["street_types"]:
            return NAME_RULES["street_types"][word_upper]
        else:
            return word.capitalize()

    def process_bracketed_text(match):
        inner_text = match.group(1).strip()

        # Special case: single letter in brackets should be capitalized
        if len(inner_text) == 1:
            return f" ({inner_text.upper()}) "  # Add spaces around brackets

        # Split the inner text and process each word
        words = inner_text.split()
        processed_words = [process_word(word) for word in words]
        return f" ({' '.join(processed_words)}) "  # Add spaces around brackets

    # First process text in brackets
    processed_name = re.sub(r"\(([^)]+)\)", process_bracketed_text, name)

    # Then process the rest of the text
    # Split by brackets to avoid processing bracket content again
    parts = re.split(r"(\s?\([^)]+\)\s?)", processed_name)

    result = []
    for part in parts:
        if "(" in part and ")" in part:
            # Already processed bracketed text
            result.append(part)
        else:
            # Process non-bracketed text
            words = []
            # Split by slashes and hyphens, preserving them
            subparts = re.split(r"([/-])", part)
            for subpart in subparts:
                if subpart in ["/", "-"]:
                    words.append(subpart)
                else:
                    # Process each word in the subpart
                    processed_words = [process_word(word) for word in subpart.split()]
                    words.append(" ".join(processed_words))
            result.append("".join(words))

    # Clean up multiple spaces and trim
    final_result = " ".join("".join(result).split())

    return final_result

# Clean CSV files
df = pd.read_csv("src/data/processed/stops.csv")

# Keep original names for reference
df["stop_name_old"] = df["stop_name"]
df["street_name_old"] = df["street_name"]

# Clean both stop_name and street_name
df["stop_name"] = df["stop_name"].apply(clean_stop_name)
df["street_name"] = df["street_name"].apply(clean_street_name)

# Save the updated CSV
df.to_csv("src/data/processed/stops.csv", index=False)

# Clean JSON files
# Update stops.min.json
with open('src/data/processed/stops.min.json', 'r', encoding='utf-8') as f:
    stops_json = json.load(f)

# Clean names in stops.min.json
for stop_id, stop_data in stops_json.items():
    stop_data[2] = clean_stop_name(stop_data[2])  # Clean stop name
    stop_data[3] = clean_street_name(stop_data[3])  # Clean street name

# Save the updated JSON
with open('src/data/processed/stops.min.json', 'w', encoding='utf-8') as f:
    json.dump(stops_json, f, ensure_ascii=False, separators=(',', ':'))

print("Files updated successfully!")