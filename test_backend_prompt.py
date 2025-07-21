#!/usr/bin/env python3
"""
Test what prompt the backend actually generates
"""

import sys
sys.path.append('backend')

from services.prompt_service import PromptService

# Create the same configuration as the test
prompt_service = PromptService()

# Test configuration - same as the test that succeeded
config = {
    "sermonType": "topical",
    "speakingStyle": "conversational", 
    "sermonLength": "10-15",
    "outputFormat": "outline",
    "content": "Topic: Faith in Difficult Times\n\nKey Scripture: Hebrews 11:1-6\n\nMain points:\n1. What is faith?\n2. How does faith work in trials?\n3. Examples of faithful people"
}

# Generate the prompt
prompt = prompt_service.build_prompt(
    config["sermonType"],
    config["speakingStyle"],
    config["sermonLength"],
    config["outputFormat"],
    config["content"]
)

print("BACKEND GENERATED PROMPT:")
print("=" * 80)
print(prompt)
print("=" * 80)
print(f"Length: {len(prompt)} characters")
print(f"Words: {len(prompt.split())} words")

# Show the difference from test script
test_prompt = """You are an experienced pastor creating a topical sermon in a conversational style.

SERMON SPECIFICATIONS:
- Type: Topical - Address the central theme using multiple scripture passages to support the main points.
- Style: Conversational - Use warm, relatable language. Include personal anecdotes and questions to engage the audience.
- Length: 10-15 minutes (about 1,500-2,000 words). Focus on one main point with clear application.
- Output Format: Outline

FORMATTING REQUIREMENTS:
Format as a detailed outline with:
- Roman numerals for main points (I., II., III.)
- Capital letters for sub-points (A., B., C.)
- Numbers for supporting details (1., 2., 3.)
- Scripture references in parentheses
- Include time estimates for each section

CONTENT TO WORK WITH:
Topic: The Power of Faith in Difficult Times

Key Scripture: Hebrews 11:1-6

Generate a detailed outline that pastors can use directly. Ensure biblical accuracy, practical application, and engaging delivery that connects with people's real-life struggles and encourages spiritual growth."""

print("\nTEST SCRIPT PROMPT:")
print("=" * 80)
print(test_prompt)
print("=" * 80)
print(f"Length: {len(test_prompt)} characters")
print(f"Words: {len(test_prompt.split())} words")

print("\nDIFFERENCE:")
print(f"Backend: {len(prompt)} chars vs Test: {len(test_prompt)} chars")
print(f"Backend is {len(prompt) - len(test_prompt)} characters longer")