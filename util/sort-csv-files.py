import pandas as pd
import json
import os
import unidecode
from glob import glob

# Sort keys a directive may request via "sort_key". The default is a plain
# case-sensitive comparison of the raw value.
#
# "unidecode_lower" matches normalize_name_for_sorting() in util/validate_commit.py,
# which is what the CI bot uses to check that new entries are inserted in
# alphabetical order. The faculty files use it so that the order the build
# produces and the order CI enforces are the same thing -- otherwise CI rejects
# correctly-placed entries wherever the two disagree (which was the case for 475
# adjacent pairs before this was reconciled).
SORT_KEYS = {
    "unidecode_lower": lambda s: unidecode.unidecode(str(s)).lower().strip(),
}

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
        sort_key_name = directive.get('sort_key')
        if sort_key_name is not None and sort_key_name not in SORT_KEYS:
            raise ValueError(
                f"Unknown sort_key {sort_key_name!r} in {directives_file}; "
                f"known keys: {sorted(SORT_KEYS)}"
            )
        sort_key = SORT_KEYS.get(sort_key_name)

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
                
                if sort_key is None:
                    sorted_df = df.sort_values(by=sort_columns_actual, ascending=sort_orders)
                else:
                    # kind='stable' matters here. The default quicksort is not stable, and
                    # a normalized key creates ties that raw values never had: accent-alias
                    # pairs such as "Eray Tuzun"/"Eray Tüzün" share a key. With an unstable
                    # sort those rows swap on every run, so `make` would emit a spurious
                    # diff each time. Stable sorting keeps tied rows in their existing
                    # order, which makes repeated runs a no-op.
                    # Sort on derived key columns rather than passing a `key=` callable,
                    # so the transform applies only to the columns being sorted and the
                    # stored values are left untouched. Temporary columns are dropped
                    # before writing, so the output schema is unchanged.
                    key_columns = []
                    for col in sort_columns_actual:
                        key_col = f"__sortkey__{col}"
                        df[key_col] = df[col].map(sort_key)
                        key_columns.append(key_col)
                    sorted_df = df.sort_values(
                        by=key_columns, ascending=sort_orders, kind='stable'
                    )
                    sorted_df = sorted_df.drop(columns=key_columns)

                # Write the sorted DataFrame to a temporary file with the specified line ending
                temp_file_path = file_path + '.tmp'
                try:
                    sorted_df = sorted_df.drop(columns=['Unnamed: 1'])
                except Exception:
                    pass
                sorted_df.to_csv(temp_file_path, index=False)
                
                # Replace original file with the temporary file using the correct line endings
                with open(temp_file_path, 'r', newline='\n') as temp_file:
                    with open(file_path, 'w', newline='') as original_file:
                        for line in temp_file:
                            if len(line.strip()) > 0:
                                # Only write non-empty lines.
                                original_file.write(line.rstrip('\n') + line_ending)
                
                os.remove(temp_file_path)
                
                # sorted_df.to_csv(file_path, index=False, line_terminator=line_ending)

# Example usage
if __name__ == "__main__":
    sort_csv_files('sort_directives.json')
