#!/usr/bin/env python3
"""
Script to import subject lines from CSV file into Supabase database.
Usage: python import-subject-lines.py <csv_file_path>
"""

import sys
import csv
import os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

def parse_date(date_str):
    """Parse date string in format '9/24/2025 16:04' to ISO date string."""
    try:
        # Parse the date part (before the space)
        date_part = date_str.split(' ')[0]
        date_obj = datetime.strptime(date_part, '%m/%d/%Y').date()
        return date_obj.isoformat()  # Convert to ISO string for JSON serialization
    except:
        return None

def parse_decimal(value_str):
    """Parse decimal string to float, return None if invalid."""
    try:
        return float(value_str) if value_str else None
    except:
        return None

def parse_bigint(value_str):
    """Parse bigint string to int, return None if invalid."""
    try:
        return int(value_str) if value_str else None
    except:
        return None

def import_subject_lines(csv_file_path):
    """Import subject lines from CSV file."""
    
    # Initialize Supabase client
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("Error: Missing Supabase environment variables")
        print("Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        return
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    print(f"Importing subject lines from {csv_file_path}...")
    
    imported_count = 0
    error_count = 0
    
    try:
        # Try different encodings
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1', 'utf-8-sig']
        file = None
        used_encoding = None
        
        for encoding in encodings:
            try:
                file = open(csv_file_path, 'r', encoding=encoding)
                # Test reading a few lines to make sure it works
                file.readline()
                file.seek(0)  # Reset to beginning
                used_encoding = encoding
                print(f"Successfully opened file with encoding: {encoding}")
                break
            except (UnicodeDecodeError, UnicodeError):
                if file:
                    file.close()
                continue
        
        if not file:
            print("Error: Could not read file with any supported encoding")
            return
        
        reader = csv.DictReader(file)
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 because of header
            try:
                # Map CSV columns to database fields
                subject_data = {
                    'subject_line': row['Subject'],
                    'open_rate': parse_decimal(row['Read Rate']),  # Using Read Rate as open_rate
                    'date_sent': parse_date(row['Date']),
                    'company': row['Company'],
                    'sub_industry': row['Sub-Industry'],
                    'mailing_type': row['Mailing Type'],
                    'inbox_rate': parse_decimal(row['Inbox Rate']),
                    'spam_rate': parse_decimal(row['Spam Rate']),
                    'read_rate': parse_decimal(row['Read Rate']),
                    'read_delete_rate': parse_decimal(row['Read & Delete Rate']),
                    'delete_without_read_rate': parse_decimal(row['Delete Without Read Rate']),
                    'projected_volume': parse_bigint(row['Projected Volume'])
                }
                
                # Skip rows with missing essential data
                if not subject_data['subject_line'] or subject_data['open_rate'] is None:
                    print(f"Warning: Skipping row {row_num} - missing subject or read rate")
                    error_count += 1
                    continue
                
                # Insert into database
                result = supabase.table('subject_lines').insert(subject_data).execute()
                
                if result.data:
                    imported_count += 1
                    if imported_count % 100 == 0:
                        print(f"Imported {imported_count} subject lines...")
                else:
                    print(f"Error inserting row {row_num}")
                    error_count += 1
                    
            except Exception as e:
                print(f"Error processing row {row_num}: {e}")
                error_count += 1
                continue
        
        # Close the file
        file.close()
    
    except FileNotFoundError:
        print(f"Error: File {csv_file_path} not found")
        return
    except Exception as e:
        print(f"Error reading file: {e}")
        return
    
    print(f"\nImport completed!")
    print(f"Successfully imported: {imported_count} subject lines")
    print(f"Errors: {error_count} rows")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python import-subject-lines.py <csv_file_path>")
        print("Example: python import-subject-lines.py subject-lines.csv")
        sys.exit(1)
    
    csv_file_path = sys.argv[1]
    import_subject_lines(csv_file_path)
