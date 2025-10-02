#!/usr/bin/env python3
"""
Script to generate embeddings for all subject lines in the database.
This script fetches all subject lines and generates embeddings using OpenAI's text-embedding-ada-002 model.
"""

import os
import sys
import asyncio
import aiohttp
import json
from typing import List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

class EmbeddingGenerator:
    def __init__(self):
        # Initialize Supabase client
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        
        if not all([self.supabase_url, self.supabase_key, self.openai_api_key]):
            print("Error: Missing required environment variables")
            print("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY")
            sys.exit(1)
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.batch_size = 100  # Process embeddings in batches
        self.delay_between_batches = 1  # Seconds to wait between batches to respect rate limits
    
    async def generate_embedding(self, session: aiohttp.ClientSession, text: str) -> List[float]:
        """Generate embedding for a single text using OpenAI API"""
        headers = {
            'Authorization': f'Bearer {self.openai_api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'input': text,
            'model': 'text-embedding-ada-002'
        }
        
        try:
            async with session.post(
                'https://api.openai.com/v1/embeddings',
                headers=headers,
                json=data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return result['data'][0]['embedding']
                else:
                    print(f"Error generating embedding: {response.status}")
                    return None
        except Exception as e:
            print(f"Exception generating embedding: {e}")
            return None
    
    async def process_batch(self, session: aiohttp.ClientSession, batch: List[Dict[str, Any]]) -> None:
        """Process a batch of subject lines and generate embeddings"""
        print(f"Processing batch of {len(batch)} subject lines...")
        
        # Generate embeddings for all items in the batch
        tasks = []
        for item in batch:
            task = self.generate_embedding(session, item['subject_line'])
            tasks.append((item['id'], task))
        
        # Wait for all embeddings to complete
        results = []
        for subject_line_id, task in tasks:
            embedding = await task
            if embedding:
                results.append({
                    'subject_line_id': subject_line_id,
                    'embedding': embedding
                })
        
        # Insert embeddings into database
        if results:
            try:
                response = self.supabase.table('subject_line_embeddings').insert(results).execute()
                if response.data:
                    print(f"✅ Inserted {len(results)} embeddings")
                else:
                    print(f"❌ Failed to insert embeddings: {response}")
            except Exception as e:
                print(f"❌ Database error: {e}")
        else:
            print("⚠️ No embeddings generated for this batch")
    
    async def generate_all_embeddings(self):
        """Generate embeddings for all subject lines in the database"""
        print("🚀 Starting embedding generation...")
        
        # First, check if embeddings already exist
        existing_embeddings = self.supabase.table('subject_line_embeddings').select('subject_line_id').execute()
        existing_ids = {row['subject_line_id'] for row in existing_embeddings.data} if existing_embeddings.data else set()
        
        # Get all subject lines
        print("📊 Fetching subject lines from database...")
        response = self.supabase.table('subject_lines').select('id, subject_line').execute()
        
        if not response.data:
            print("❌ No subject lines found in database")
            return
        
        all_subject_lines = response.data
        print(f"📈 Found {len(all_subject_lines)} subject lines")
        
        # Filter out already processed subject lines
        unprocessed = [sl for sl in all_subject_lines if sl['id'] not in existing_ids]
        
        if not unprocessed:
            print("✅ All subject lines already have embeddings")
            return
        
        print(f"🔄 Processing {len(unprocessed)} new subject lines...")
        
        # Process in batches
        async with aiohttp.ClientSession() as session:
            for i in range(0, len(unprocessed), self.batch_size):
                batch = unprocessed[i:i + self.batch_size]
                await self.process_batch(session, batch)
                
                # Wait between batches to respect rate limits
                if i + self.batch_size < len(unprocessed):
                    print(f"⏳ Waiting {self.delay_between_batches}s before next batch...")
                    await asyncio.sleep(self.delay_between_batches)
        
        print("🎉 Embedding generation completed!")
        
        # Show final statistics
        final_count = self.supabase.table('subject_line_embeddings').select('id', count='exact').execute()
        print(f"📊 Total embeddings in database: {final_count.count}")

async def main():
    generator = EmbeddingGenerator()
    await generator.generate_all_embeddings()

if __name__ == "__main__":
    asyncio.run(main())
