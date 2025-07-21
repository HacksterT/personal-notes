#!/usr/bin/env python3
"""
Database migration script to add missing fields to content_items table
Run this before starting the application to ensure schema compatibility
"""

import asyncio
import asyncpg
import logging
import os

logger = logging.getLogger(__name__)

async def migrate_database():
    """Add missing fields to content_items table"""
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL', 'postgresql://dev_user:dev_password@localhost:5432/sermon_organizer_dev')
    
    try:
        conn = await asyncpg.connect(database_url)
        
        # Check existing columns
        existing_columns = await conn.fetch("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'content_items'
            ORDER BY ordinal_position
        """)
        
        existing_column_names = {row['column_name'] for row in existing_columns}
        
        print("Existing columns:")
        for col in existing_columns:
            print(f"  - {col['column_name']}: {col['data_type']} ({'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'})")
        
        # Define new columns to add
        new_columns = [
            ("key_themes", "TEXT[]"),
            ("thought_questions", "TEXT[]"),
            ("last_error", "TEXT"),
            ("date_modified", "TIMESTAMPTZ DEFAULT NOW()"),
            ("size_bytes", "INTEGER"),
            ("processing_status", "VARCHAR(20) DEFAULT 'pending'")
        ]
        
        # Add missing columns
        for column_name, column_type in new_columns:
            if column_name not in existing_column_names:
                print(f"Adding column: {column_name}")
                await conn.execute(f"""
                    ALTER TABLE content_items 
                    ADD COLUMN {column_name} {column_type}
                """)
            else:
                print(f"Column {column_name} already exists")
        
        # Remove deprecated columns if they exist
        deprecated_columns = ["summary", "summary_status"]
        for column_name in deprecated_columns:
            if column_name in existing_column_names:
                print(f"Removing deprecated column: {column_name}")
                await conn.execute(f"""
                    ALTER TABLE content_items 
                    DROP COLUMN IF EXISTS {column_name}
                """)
        
        # Set default values for existing rows
        await conn.execute("""
            UPDATE content_items 
            SET date_modified = date_created,
                processing_status = 'completed'
            WHERE date_modified IS NULL
        """)
        
        print("Database migration completed successfully!")
        
        # Show final schema
        final_columns = await conn.fetch("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'content_items'
            ORDER BY ordinal_position
        """)
        
        print("\nFinal schema:")
        for col in final_columns:
            default = col['column_default'] if col['column_default'] else ''
            print(f"  - {col['column_name']}: {col['data_type']} ({'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'}) {default}")
        
        await conn.close()
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(migrate_database())