import pandas as pd

# Read both CSV files
df = pd.read_csv('src/data/test.csv')
df2 = pd.read_csv('src/data/test2.csv')

# Create a mapping dictionary from df2 for route_long_name
route_mapping = df2[['route_id', 'route_long_name']].set_index('route_id').to_dict()['route_long_name']

# Update trip_headsign with route_long_name where available
df['trip_headsign'] = df['route_number'].astype(str).map(route_mapping).fillna(df['trip_headsign'])

# Drop duplicates based on route_number, keeping the first occurrence
df = df.drop_duplicates(subset=['route_number'], keep='first')

# Sort by route_number
df = df.sort_values('route_number')

# Write the modified data back to CSV
df.to_csv('src/data/test.csv', index=False)