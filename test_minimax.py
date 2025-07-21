#!/usr/bin/env python3
"""
Test MiniMax API directly to isolate issues
"""

import requests
import json
import os

# Try to load dotenv if available, otherwise use os.environ directly
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Note: python-dotenv not installed, using system environment variables")

# Get API key from environment
API_KEY = os.getenv("MINIMAX_API_KEY")

def test_basic_request():
    """Test basic MiniMax API call"""
    print("Testing basic MiniMax API call...")
    
    url = "https://api.minimax.io/v1/text/chatcompletion_v2"
    
    payload = {
        "model": "MiniMax-M1",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant."
            },
            {
                "role": "user", 
                "content": "Hello, how are you?"
            }
        ],
        "max_tokens": 100,
        "temperature": 0.7
    }
    
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if 'choices' in data and len(data['choices']) > 0:
                print(f"✅ SUCCESS: {data['choices'][0]['message']['content']}")
            else:
                print(f"⚠️  No choices in response: {data}")
        else:
            print(f"❌ FAILED: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_function_calling():
    """Test function calling with MiniMax"""
    print("\nTesting function calling...")
    
    url = "https://api.minimax.io/v1/text/chatcompletion_v2"
    
    payload = {
        "model": "MiniMax-M1",
        "messages": [
            {
                "role": "system",
                "content": "You are a theological content analyzer. Call the analyze_theological_content function with your analysis."
            },
            {
                "role": "user",
                "content": "Analyze this sermon excerpt: 'God's love for us is unconditional and eternal. Through Christ, we find redemption and hope.'"
            }
        ],
        "tools": [
            {
                "type": "function",
                "function": {
                    "name": "analyze_theological_content",
                    "description": "Analyze theological content to extract key themes and generate thought questions",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "key_themes": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Exactly 3 key theological themes"
                            },
                            "thought_questions": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Exactly 2 thought questions"
                            }
                        },
                        "required": ["key_themes", "thought_questions"]
                    }
                }
            }
        ],
        "tool_choice": "auto",
        "max_tokens": 1000,
        "temperature": 0.7
    }
    
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if 'choices' in data and len(data['choices']) > 0:
                choice = data['choices'][0]
                if 'tool_calls' in choice.get('message', {}):
                    print("✅ FUNCTION CALLING SUCCESS!")
                    for tool_call in choice['message']['tool_calls']:
                        print(f"Function: {tool_call['function']['name']}")
                        print(f"Arguments: {tool_call['function']['arguments']}")
                else:
                    print(f"⚠️  No tool calls, regular response: {choice.get('message', {}).get('content', 'No content')}")
            else:
                print(f"⚠️  No choices in response: {data}")
        else:
            print(f"❌ FAILED: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_sermon_generation():
    """Test sermon generation (long-form content)"""
    print("\nTesting sermon generation...")
    
    url = "https://api.minimax.io/v1/text/chatcompletion_v2"
    
    # Sample sermon prompt similar to what the backend sends
    sermon_prompt = """You are an experienced pastor creating a topical sermon in a conversational style.

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

    payload = {
        "model": "MiniMax-M1",
        "messages": [
            {
                "role": "user",
                "content": sermon_prompt
            }
        ],
        "temperature": 0.7,
        "max_tokens": 2000,  # Smaller for testing
        "top_p": 0.9
    }
    
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        print("Sending sermon generation request...")
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if 'choices' in data and len(data['choices']) > 0:
                sermon_content = data['choices'][0]['message']['content']
                print(f"✅ SERMON GENERATION SUCCESS!")
                print(f"Generated {len(sermon_content)} characters")
                print(f"First 500 chars: {sermon_content[:500]}...")
            else:
                print(f"⚠️  No choices in response: {data}")
        else:
            print(f"❌ FAILED: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_backend_endpoints():
    """Test our backend API endpoints"""
    print("\nTesting backend sermon generation endpoint...")
    
    # Test sermon generation endpoint
    url = "http://localhost:8000/api/sermon/generate"
    
    payload = {
        "sermonType": "topical",
        "speakingStyle": "conversational", 
        "sermonLength": "10-15",
        "outputFormat": "outline",
        "content": "Topic: Faith in Difficult Times\n\nKey Scripture: Hebrews 11:1-6\n\nMain points:\n1. What is faith?\n2. How does faith work in trials?\n3. Examples of faithful people"
    }
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    try:
        print("Testing backend sermon generation...")
        response = requests.post(url, headers=headers, json=payload, timeout=180)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ BACKEND SERMON SUCCESS!")
                print(f"Generated sermon length: {len(data.get('sermon', ''))} characters")
                print(f"Metadata: {data.get('metadata', {})}")
            else:
                print(f"⚠️  Backend returned success=False: {data}")
        else:
            print(f"❌ BACKEND FAILED: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ BACKEND ERROR: {e}")

def test_account_info():
    """Test account/billing endpoint if available"""
    print("\nTesting account access...")
    
    # Try a minimal request to check account status
    url = "https://api.minimax.io/v1/text/chatcompletion_v2"
    
    payload = {
        "model": "MiniMax-M1",
        "messages": [{"role": "user", "content": "hi"}],
        "max_tokens": 1
    }
    
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        print(f"Minimal request - Status: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    print("MiniMax API Test Script")
    print("=" * 50)
    
    if not API_KEY:
        print("❌ ERROR: MINIMAX_API_KEY not found!")
        print("Please set MINIMAX_API_KEY environment variable or ensure .env file is properly loaded")
        print("Current working directory:", os.getcwd())
        print("Available env vars starting with MINIMAX:", [k for k in os.environ.keys() if k.startswith('MINIMAX')])
        exit(1)
    
    print(f"✅ API Key found: {API_KEY[:20]}...{API_KEY[-10:]}")
    
    test_account_info()
    test_basic_request() 
    test_function_calling()
    test_sermon_generation()
    test_backend_endpoints()
    
    print("\n" + "=" * 50)
    print("Test complete!")