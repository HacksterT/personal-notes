## Database Schema

Here's the breakdown of the three sets of fields and their sources:

  Field Sources Analysis

  Set 1: Original CREATE TABLE Statement

  Source: backend/services/storage_service.py:38-53 in _create_tables() method

  Fields (8 total):
  - id - UUID PRIMARY KEY
  - user_id - UUID NOT NULL
  - title - VARCHAR(500) NOT NULL
  - category - VARCHAR(50) NOT NULL
  - content - TEXT NOT NULL
  - summary - TEXT
  - summary_status - VARCHAR(20) DEFAULT 'pending' ❌ Missing from actual DB
  - date_created - TIMESTAMPTZ DEFAULT NOW()

  Set 2: Actual Database Schema

  Source: Live PostgreSQL database (queried above)

  Fields (14 total):
  - All 7 fields from Set 1 (minus summary_status)
  - Plus 7 additional fields that were added manually:
    - word_count - INTEGER
    - passage - TEXT
    - tags - TEXT[]
    - post_tags - TEXT[] (added for social media platform tags)
    - file_type - VARCHAR(100)
    - bible_references - TEXT[]
    - ai_processing_time_seconds - NUMERIC(10,3)

  Set 3: Code Usage Fields

  Source: Various files where fields are referenced but don't exist

  Missing fields referenced in code:
  - date_modified - Referenced in storage_routes.py:122,152,243 but doesn't exist anywhere
  - size_bytes - Calculated in upload handler but never stored
  - summary_status - Defined in CREATE TABLE but missing from actual DB

  The Discrepancy Explained

  What happened: The database schema was manually updated during development (likely via direct SQL       
  commands) to add the 6 missing fields, but the original _create_tables() method was never updated.      
  This is why:

  1. App works - Fields exist in actual database
  2. CREATE TABLE is outdated - Only has original 8 fields
  3. Code references phantom fields - date_modified, size_bytes don't exist anywhere

  The database schema has evolved beyond what the initialization code knows about, creating this
  three-way mismatch.


| Field                         | Type           | Description                 |
| ----------------------------- | ---------     | --------------------------- |
| id                            | UUID          | Primary Key                 |
| user_id                       | UUID          | identifies user             |
| title                         | varchar(500)  | Extracted or generated      |
| category                      | varchar(50)   | Docuemnt category           |
| content                       | Text          | Full sermon/study           |
| date_created                  | TIMESTAMPTZ   |date/timestamp with zone     |
| word_count                    | Integer       | script generated            |
| passage                       | Text          | Main Bible reference        |
| tags                          | Text[]        | code-generated tags         |
| post_tags                     | Text[]        | platform tags (FB,IG,X,LI,TT,YT) |
| file_type                     | varchar(100)  | .txt, .pdf, etc.            |
| bible_references              | Text[]        | code detected refs          |
| ai_processing_time_seconds    | Num(10,3)     | Timing metric               |
| key_themes                    | Text[]        | LLM-generated key takeaways |
| thought_questions             | Text[]        | LLM-generated prompts       |
| last_error                    | Text          | error message for AI        |
| date_modified                 | TIMESTAMPTZ   | code-generated              |
| size_bytes                    | integer       | size of file                |
| processing_status             | varchar(20)   | processing, completed, failed|



## User Profile Schema

### `user_profiles` Table

This table stores all the personalization data for a user. It is linked directly to the main `users` table via the `user_id`.

| Field                         | Type        | Description                                                               |
| ----------------------------- | ----------- | ------------------------------------------------------------------------- |
| user_id                       | UUID        | Primary Key, and Foreign Key to `users.id`.                               |
| full_name                     | VARCHAR(255)| The user's full name.                                                     |
| profile_picture_url           | TEXT        | URL to the user's avatar, hosted in Azure Blob Storage.                   |
| preferred_bible_versions      | TEXT[]      | An array of preferred Bible translations (e.g., `{'NIV', 'ESV'}`).        |
| audience_description          | TEXT        | A free-text description of the user's typical audience.                   |
| year_started_ministry         | INTEGER     | The year the user began their ministry (e.g., `2005`).                     |
| primary_church_affiliation    | VARCHAR(255)| The name of the user's primary church or organization.                    |
| favorite_historical_preacher  | VARCHAR(255)| The user's favorite preacher for stylistic inspiration.                   |
| role_id                       | INTEGER     | Foreign Key to the `roles.id` table.                                      |
| theological_profile_id        | INTEGER     | Foreign Key to the `theological_profiles.id` table.                       |
| speaking_style_id             | INTEGER     | Foreign Key to the `speaking_styles.id` table.                            |
| education_level_id            | INTEGER     | Foreign Key to the `education_levels.id` table.                           |
| created_at                    | TIMESTAMPTZ | Timestamp for when the profile was created.                               |
| updated_at                    | TIMESTAMPTZ | Timestamp for when the profile was last updated.                          |

---

### Lookup Tables

These small, efficient tables hold the pre-defined options for the dropdown menus in the settings page.

#### `roles` Table

| id (PK) | name (VARCHAR)      |
| ------- | ------------------- |
| 1       | Pastor/Minister     |
| 2       | Teacher             |
| 3       | Lay Leader          |
| 4       | Student             |
| 5       | Content Creator     |
| 6       | Evangelist          |

#### `theological_profiles` Table

| id (PK) | name (VARCHAR)      |
| ------- | ------------------- |
| 1       | Baptist             |
| 2       | Methodist           |
| 3       | Lutheran            |
| 4       | Pentecostal         |
| 5       | Presbyterian        |
| 6       | Non-denominational  |

#### `speaking_styles` Table

| id (PK) | name (VARCHAR)      |
| ------- | ------------------- |
| 1       | Expository          |
| 2       | Topical             |
| 3       | Narrative           |
| 4       | Evangelistic        |

#### `education_levels` Table

| id (PK) | name (VARCHAR)      |
| ------- | ------------------- |
| 1       | Self-Taught         |
| 2       | Certificate         |
| 3       | Bachelor's Degree   |
| 4       | Master's Degree (M.Div, M.A.) |
| 5       | Doctorate (Ph.D, D.Min) |
