import csv
import os
import requests
import urllib.parse

def get_lat_long(university, countryabbrv):
    url = 'https://api.opencagedata.com/geocode/v1/json'
    api_key = os.environ['OPENCAGE_API_KEY']
    params = {
        'q': urllib.parse.quote_plus(university),
        'countrycode': countryabbrv,
        'key': api_key
    }
    response = requests.get(url, params=params).json()
    if response['total_results'] > 0:
        lat = response['results'][0]['geometry']['lat']
        lng = response['results'][0]['geometry']['lng']
        return (lat, lng)
    else:
        return None

# Next, open the input and output CSV files
with open('country-info.csv', 'r') as input_file, open('geolocation.csv', 'w', newline='') as output_file:
    # Define the input and output CSV readers/writers
    reader = csv.DictReader(input_file)
    writer = csv.DictWriter(output_file, fieldnames=['institution', 'latitude', 'longitude'])

    # Write the header row to the output file
    writer.writeheader()

    # Loop over the input rows and invoke the get_lat_long function on each row
    for row in reader:
        institution = row['institution']
        region = row['region']
        countryabbrv = row['countryabbrv']

        lat_long = get_lat_long(institution, countryabbrv)

        # If we found a latitude and longitude, write them to the output file
        if lat_long is not None:
            print(institution, lat_long)
            writer.writerow({
                'institution': institution,
                'latitude': lat_long[0],
                'longitude': lat_long[1]
            })

# Open the country-info.csv file and store the institutions in a set
with open('country-info.csv', 'r') as country_file:
    country_reader = csv.DictReader(country_file)
    visited_institution = {row['institution'] for row in country_reader}

# Open the csrankings.csv file and iterate over each row
with open('csrankings.csv', 'r') as csrankings_file, open('geolocation.csv', 'a', newline='') as output_file:
    csrankings_reader = csv.DictReader(csrankings_file)
    writer = csv.DictWriter(output_file, fieldnames=['institution', 'latitude', 'longitude'])

    for row in csrankings_reader:
        institution = row['affiliation']
        
        # Check if the institution is in the country-info.csv file
        if institution in visited_institution:
            continue

        visited_institution.add(institution)
        
        lat_long = get_lat_long(institution, "us")
        
        # If we found a latitude and longitude, print them (or do something else with them)
        if lat_long is not None:
            print(f'{institution}: {lat_long}')
            writer.writerow({
                'institution': institution,
                'latitude': lat_long[0],
                'longitude': lat_long[1]
            })
            
