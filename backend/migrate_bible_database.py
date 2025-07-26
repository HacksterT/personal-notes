#!/usr/bin/env python3
"""
Bible Content Cache Database Migration Script
Creates the bible_content_cache database schema for Phase 8 implementation.

This script sets up the database structure for personal use Bible caching
with compliance tracking and session cache architecture.
"""

import asyncio
import asyncpg
import os
from typing import Dict, List, Tuple

# Database connection configuration
BIBLE_DB_CONFIG = {
    'user': 'bible_user',
    'password': 'bible_password', 
    'database': 'bible_content_cache',
    'host': 'bible-cache-db',
    'port': 5432
}

class BibleDatabaseMigrator:
    def __init__(self):
        self.connection = None
        
    async def connect(self):
        """Connect to the Bible cache database"""
        try:
            self.connection = await asyncpg.connect(**BIBLE_DB_CONFIG)
            print("✅ Connected to bible_content_cache database")
        except Exception as e:
            print(f"❌ Failed to connect to database: {e}")
            raise
            
    async def disconnect(self):
        """Close database connection"""
        if self.connection:
            await self.connection.close()
            print("📤 Disconnected from database")
            
    async def create_schema(self):
        """Create the bible_cache schema and all tables"""
        print("🔨 Creating bible_cache schema...")
        
        # Create schema
        await self.connection.execute("CREATE SCHEMA IF NOT EXISTS bible_cache;")
        
        # 1. Create versions table
        versions_sql = """
        CREATE TABLE IF NOT EXISTS bible_cache.versions (
            id SERIAL PRIMARY KEY,
            code VARCHAR(10) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            source VARCHAR(50) NOT NULL,
            license_type VARCHAR(20) DEFAULT 'personal_use',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW()
        );
        """
        await self.connection.execute(versions_sql)
        print("✅ Created versions table")
        
        # 2. Create books table
        books_sql = """
        CREATE TABLE IF NOT EXISTS bible_cache.books (
            id SERIAL PRIMARY KEY,
            book_number INTEGER NOT NULL,
            book_name VARCHAR(50) NOT NULL,
            book_abbrev VARCHAR(10) NOT NULL,
            testament VARCHAR(2) NOT NULL,
            category VARCHAR(20) NOT NULL,
            color_code VARCHAR(20) NOT NULL,
            total_chapters INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(book_number)
        );
        """
        await self.connection.execute(books_sql)
        print("✅ Created books table")
        
        # 3. Create chapters table
        chapters_sql = """
        CREATE TABLE IF NOT EXISTS bible_cache.chapters (
            id SERIAL PRIMARY KEY,
            version_id INTEGER REFERENCES bible_cache.versions(id) ON DELETE CASCADE,
            book_id INTEGER REFERENCES bible_cache.books(id) ON DELETE CASCADE,
            chapter_number INTEGER NOT NULL,
            
            -- API Response Data
            api_reference VARCHAR(50) NOT NULL,
            api_url TEXT,
            raw_html TEXT,
            
            -- Parsed Content (JSONB for flexibility)
            verses JSONB NOT NULL,
            verse_count INTEGER NOT NULL,
            
            -- Metadata
            downloaded_at TIMESTAMP DEFAULT NOW(),
            accessed_count INTEGER DEFAULT 1,
            last_accessed TIMESTAMP DEFAULT NOW(),
            
            UNIQUE(version_id, book_id, chapter_number),
            CHECK(chapter_number > 0)
        );
        """
        await self.connection.execute(chapters_sql)
        print("✅ Created chapters table")
        
        # 4. Create usage_logs table
        usage_logs_sql = """
        CREATE TABLE IF NOT EXISTS bible_cache.usage_logs (
            id SERIAL PRIMARY KEY,
            action VARCHAR(20) NOT NULL,
            version_code VARCHAR(10),
            book_name VARCHAR(50),
            chapter_number INTEGER,
            verse_count INTEGER DEFAULT 0,
            access_method VARCHAR(20),
            created_at TIMESTAMP DEFAULT NOW()
        );
        """
        await self.connection.execute(usage_logs_sql)
        print("✅ Created usage_logs table")
        
        # 5. Create compliance_summary table
        compliance_sql = """
        CREATE TABLE IF NOT EXISTS bible_cache.compliance_summary (
            id SERIAL PRIMARY KEY,
            total_verses_stored INTEGER DEFAULT 0,
            total_chapters_stored INTEGER DEFAULT 0,
            personal_use_limit INTEGER DEFAULT 500,
            license_mode VARCHAR(20) DEFAULT 'personal_use',
            last_updated TIMESTAMP DEFAULT NOW(),
            is_compliant BOOLEAN GENERATED ALWAYS AS (total_verses_stored <= personal_use_limit) STORED
        );
        """
        await self.connection.execute(compliance_sql)
        print("✅ Created compliance_summary table")
        
    async def create_indexes(self):
        """Create performance indexes"""
        print("📊 Creating database indexes...")
        
        index_queries = [
            "CREATE INDEX IF NOT EXISTS idx_chapters_lookup ON bible_cache.chapters(version_id, book_id, chapter_number);",
            "CREATE INDEX IF NOT EXISTS idx_books_abbrev ON bible_cache.books(book_abbrev);", 
            "CREATE INDEX IF NOT EXISTS idx_books_category ON bible_cache.books(category, testament);",
            "CREATE INDEX IF NOT EXISTS idx_chapters_accessed ON bible_cache.chapters(last_accessed DESC);",
            "CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON bible_cache.usage_logs(created_at DESC);",
            "CREATE INDEX IF NOT EXISTS idx_versions_active ON bible_cache.versions(is_active, code);"
        ]
        
        for query in index_queries:
            await self.connection.execute(query)
            
        print("✅ Created all indexes")
        
    async def populate_versions(self):
        """Insert initial Bible versions for personal use"""
        print("📚 Populating versions table...")
        
        versions_data = [
            ('NLT', 'New Living Translation', 'Contemporary English translation', 'nlt_api', 'personal_use', True),
            ('KJV', 'King James Version', 'Traditional English translation', 'nlt_api', 'personal_use', True)
        ]
        
        for code, name, description, source, license_type, is_active in versions_data:
            await self.connection.execute("""
                INSERT INTO bible_cache.versions (code, name, description, source, license_type, is_active)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (code) DO NOTHING
            """, code, name, description, source, license_type, is_active)
            
        print("✅ Populated versions table")
        
    async def populate_books(self):
        """Insert all 66 Bible books with categories and color coding"""
        print("📖 Populating books table with all 66 books...")
        
        # Old Testament Books
        old_testament_books = [
            # Torah (Blue)
            (1, 'Genesis', 'GEN', 'OT', 'Torah', 'blue', 50),
            (2, 'Exodus', 'EXO', 'OT', 'Torah', 'blue', 40),
            (3, 'Leviticus', 'LEV', 'OT', 'Torah', 'blue', 27),
            (4, 'Numbers', 'NUM', 'OT', 'Torah', 'blue', 36),
            (5, 'Deuteronomy', 'DEU', 'OT', 'Torah', 'blue', 34),
            
            # History (Green)
            (6, 'Joshua', 'JOS', 'OT', 'History', 'green', 24),
            (7, 'Judges', 'JDG', 'OT', 'History', 'green', 21),
            (8, 'Ruth', 'RUT', 'OT', 'History', 'green', 4),
            (9, '1 Samuel', '1SA', 'OT', 'History', 'green', 31),
            (10, '2 Samuel', '2SA', 'OT', 'History', 'green', 24),
            (11, '1 Kings', '1KI', 'OT', 'History', 'green', 22),
            (12, '2 Kings', '2KI', 'OT', 'History', 'green', 25),
            (13, '1 Chronicles', '1CH', 'OT', 'History', 'green', 29),
            (14, '2 Chronicles', '2CH', 'OT', 'History', 'green', 36),
            (15, 'Ezra', 'EZR', 'OT', 'History', 'green', 10),
            (16, 'Nehemiah', 'NEH', 'OT', 'History', 'green', 13),
            (17, 'Esther', 'EST', 'OT', 'History', 'green', 10),
            
            # Wisdom (Purple)
            (18, 'Job', 'JOB', 'OT', 'Wisdom', 'purple', 42),
            (19, 'Psalms', 'PSA', 'OT', 'Wisdom', 'purple', 150),
            (20, 'Proverbs', 'PRO', 'OT', 'Wisdom', 'purple', 31),
            (21, 'Ecclesiastes', 'ECC', 'OT', 'Wisdom', 'purple', 12),
            (22, 'Song of Songs', 'SNG', 'OT', 'Wisdom', 'purple', 8),
            
            # Major Prophets (Orange)
            (23, 'Isaiah', 'ISA', 'OT', 'Major Prophets', 'orange', 66),
            (24, 'Jeremiah', 'JER', 'OT', 'Major Prophets', 'orange', 52),
            (25, 'Lamentations', 'LAM', 'OT', 'Major Prophets', 'orange', 5),
            (26, 'Ezekiel', 'EZK', 'OT', 'Major Prophets', 'orange', 48),
            (27, 'Daniel', 'DAN', 'OT', 'Major Prophets', 'orange', 12),
            
            # Minor Prophets (Yellow)
            (28, 'Hosea', 'HOS', 'OT', 'Minor Prophets', 'yellow', 14),
            (29, 'Joel', 'JOL', 'OT', 'Minor Prophets', 'yellow', 3),
            (30, 'Amos', 'AMO', 'OT', 'Minor Prophets', 'yellow', 9),
            (31, 'Obadiah', 'OBA', 'OT', 'Minor Prophets', 'yellow', 1),
            (32, 'Jonah', 'JON', 'OT', 'Minor Prophets', 'yellow', 4),
            (33, 'Micah', 'MIC', 'OT', 'Minor Prophets', 'yellow', 7),
            (34, 'Nahum', 'NAH', 'OT', 'Minor Prophets', 'yellow', 3),
            (35, 'Habakkuk', 'HAB', 'OT', 'Minor Prophets', 'yellow', 3),
            (36, 'Zephaniah', 'ZEP', 'OT', 'Minor Prophets', 'yellow', 3),
            (37, 'Haggai', 'HAG', 'OT', 'Minor Prophets', 'yellow', 2),
            (38, 'Zechariah', 'ZEC', 'OT', 'Minor Prophets', 'yellow', 14),
            (39, 'Malachi', 'MAL', 'OT', 'Minor Prophets', 'yellow', 4),
        ]
        
        # New Testament Books
        new_testament_books = [
            # Gospels (Teal)
            (40, 'Matthew', 'MAT', 'NT', 'Gospels', 'teal', 28),
            (41, 'Mark', 'MRK', 'NT', 'Gospels', 'teal', 16),
            (42, 'Luke', 'LUK', 'NT', 'Gospels', 'teal', 24),
            (43, 'John', 'JHN', 'NT', 'Gospels', 'teal', 21),
            
            # NT History (Green)
            (44, 'Acts', 'ACT', 'NT', 'NT History', 'green', 28),
            
            # Epistles (Brown)
            (45, 'Romans', 'ROM', 'NT', 'Epistles', 'brown', 16),
            (46, '1 Corinthians', '1CO', 'NT', 'Epistles', 'brown', 16),
            (47, '2 Corinthians', '2CO', 'NT', 'Epistles', 'brown', 13),
            (48, 'Galatians', 'GAL', 'NT', 'Epistles', 'brown', 6),
            (49, 'Ephesians', 'EPH', 'NT', 'Epistles', 'brown', 6),
            (50, 'Philippians', 'PHP', 'NT', 'Epistles', 'brown', 4),
            (51, 'Colossians', 'COL', 'NT', 'Epistles', 'brown', 4),
            (52, '1 Thessalonians', '1TH', 'NT', 'Epistles', 'brown', 5),
            (53, '2 Thessalonians', '2TH', 'NT', 'Epistles', 'brown', 3),
            (54, '1 Timothy', '1TI', 'NT', 'Epistles', 'brown', 6),
            (55, '2 Timothy', '2TI', 'NT', 'Epistles', 'brown', 4),
            (56, 'Titus', 'TIT', 'NT', 'Epistles', 'brown', 3),
            (57, 'Philemon', 'PHM', 'NT', 'Epistles', 'brown', 1),
            (58, 'Hebrews', 'HEB', 'NT', 'Epistles', 'brown', 13),
            (59, 'James', 'JAS', 'NT', 'Epistles', 'brown', 5),
            (60, '1 Peter', '1PE', 'NT', 'Epistles', 'brown', 5),
            (61, '2 Peter', '2PE', 'NT', 'Epistles', 'brown', 3),
            (62, '1 John', '1JN', 'NT', 'Epistles', 'brown', 5),
            (63, '2 John', '2JN', 'NT', 'Epistles', 'brown', 1),
            (64, '3 John', '3JN', 'NT', 'Epistles', 'brown', 1),
            (65, 'Jude', 'JUD', 'NT', 'Epistles', 'brown', 1),
            
            # Apocalyptic (Red)
            (66, 'Revelation', 'REV', 'NT', 'Apocalyptic', 'red', 22),
        ]
        
        all_books = old_testament_books + new_testament_books
        
        for book_data in all_books:
            book_number, book_name, book_abbrev, testament, category, color_code, total_chapters = book_data
            await self.connection.execute("""
                INSERT INTO bible_cache.books 
                (book_number, book_name, book_abbrev, testament, category, color_code, total_chapters)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (book_number) DO NOTHING
            """, book_number, book_name, book_abbrev, testament, category, color_code, total_chapters)
            
        print("✅ Populated books table with all 66 books")
        
    async def initialize_compliance_summary(self):
        """Initialize compliance summary record"""
        print("📋 Initializing compliance summary...")
        
        await self.connection.execute("""
            INSERT INTO bible_cache.compliance_summary 
            (total_verses_stored, total_chapters_stored, license_mode)
            VALUES (0, 0, 'personal_use')
            ON CONFLICT DO NOTHING
        """)
        
        print("✅ Initialized compliance summary")
        
    async def run_migration(self):
        """Run the complete database migration"""
        print("🚀 Starting Bible Cache Database Migration...")
        print("=" * 50)
        
        try:
            await self.connect()
            await self.create_schema()
            await self.create_indexes()
            await self.populate_versions()
            await self.populate_books()  
            await self.initialize_compliance_summary()
            
            print("=" * 50)
            print("✅ Bible Cache Database Migration Completed Successfully!")
            print("\nDatabase Summary:")
            print("• Schema: bible_cache")
            print("• Tables: versions, books, chapters, usage_logs, compliance_summary")  
            print("• Indexes: 6 performance indexes created")
            print("• Books: 66 books (39 OT, 27 NT) with categories")
            print("• Versions: NLT, KJV configured for personal use")
            print("• Compliance: 500 verse limit tracking enabled")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            raise
        finally:
            await self.disconnect()

async def main():
    """Main migration function"""
    migrator = BibleDatabaseMigrator()
    await migrator.run_migration()

if __name__ == "__main__":
    asyncio.run(main())