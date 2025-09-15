
import csv
import sys

# Increase the CSV field size limit for large fields
csv.field_size_limit(sys.maxsize)

def clean_csv(input_file, output_file):
    """
    Reads a potentially malformed CSV file and writes a cleaned version.
    It handles quotes inside fields and ensures all fields are properly quoted in the output.
    """
    with open(input_file, 'r', encoding='utf-8', errors='ignore') as infile, open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        # The reader will try to interpret quotes within fields.
        reader = csv.reader(infile, quotechar='"', doublequote=True, skipinitialspace=True)
        # The writer will enclose all fields in quotes, ensuring a consistent format.
        writer = csv.writer(outfile, quoting=csv.QUOTE_ALL)
        
        for row in reader:
            try:
                writer.writerow(row)
            except csv.Error as e:
                # Skip any rows that still cause errors after the initial parsing.
                print(f"Skipping problematic row: {row} - Error: {e}")
                continue

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python clean_csv.py <input_file> <output_file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    clean_csv(input_file, output_file)
