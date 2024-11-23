import pandas as pd
import json
import os
from glob import glob

def get_line_ending(file_path):
    with open(file_path, 'rb') as f:
        first_line = f.readline()
        if b'\r\n' in first_line:
            return '\r\n'
        elif b'\r' in first_line:
            return '\r'
        else:
            return '\n'

def sort_csv_files(directives_file):
    with open(directives_file, 'r') as f:
        directives = json.load(f)
    
    for directive in directives:
        files = directive['files']
        sort_columns = directive['sort_columns']
        sort_orders = directive.get('sort_orders', [True] * len(sort_columns))
        
        for file_pattern in files:
            for file_path in glob(file_pattern):
                print(f"Processing {file_path}")
                line_ending = get_line_ending(file_path)
                df = pd.read_csv(file_path)
                
                # Convert column indexes to names if specified as numbers
                columns = df.columns
                sort_columns_actual = [
                    columns[col] if isinstance(col, int) else col
                    for col in sort_columns
                ]
                
                sorted_df = df.sort_values(by=sort_columns_actual, ascending=sort_orders)

                # Write the sorted DataFrame to a temporary file with the specified line ending
                temp_file_path = file_path + '.tmp'
                sorted_df.to_csv(temp_file_path, index=False)
                
                # Replace original file with the temporary file using the correct line endings
                with open(temp_file_path, 'r', newline='\n') as temp_file:
                    with open(file_path, 'w', newline='') as original_file:
                        for line in temp_file:
                            original_file.write(line.rstrip('\n') + line_ending)
                
                os.remove(temp_file_path)
                
                # sorted_df.to_csv(file_path, index=False, line_terminator=line_ending)

# Example usage
if __name__ == "__main__":
    sort_csv_files('sort_directives.json')
