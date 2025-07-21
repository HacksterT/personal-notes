"""
Prompt Engineering Service for Sermon Generation
Builds AI prompts based on configuration settings
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class PromptService:
    """Service for building AI prompts from sermon configuration"""
    
    def __init__(self):
        self.base_template = """You are an experienced pastor creating a {sermon_type} sermon in a {speaking_style} style.

SERMON SPECIFICATIONS:
- Type: {sermon_type_title} - {type_guidance}
- Style: {speaking_style_title} - {style_guidance}
- Length: {length_guidance}
- Output Format: {output_format_title}

FORMATTING REQUIREMENTS:
{format_instructions}

CONTENT TO WORK WITH:
[Content provided separately in content field]

Generate a {output_description} that pastors can use directly. Ensure biblical accuracy, practical application, and engaging delivery that connects with people's real-life struggles and encourages spiritual growth."""

    def build_prompt(self, sermon_type: str, speaking_style: str, sermon_length: str, 
                    output_format: str, content: str) -> str:
        """
        Build a complete AI prompt from configuration settings
        
        Args:
            sermon_type: Type of sermon (expository, topical, etc.)
            speaking_style: Delivery style (conversational, authoritative, etc.)
            sermon_length: Target length (10-15, 20-25, etc.)
            output_format: Format type (full, outline, bullets, notes)
            content: The study content and themes to work with
            
        Returns:
            Complete prompt string ready for AI API
        """
        try:
            # Build prompt components
            type_guidance = self._get_type_guidance(sermon_type)
            style_guidance = self._get_style_guidance(speaking_style)
            length_guidance = self._get_length_guidance(sermon_length)
            format_instructions = self._get_format_instructions(output_format)
            
            # Format the prompt
            prompt = self.base_template.format(
                sermon_type=sermon_type,
                speaking_style=speaking_style,
                sermon_type_title=sermon_type.capitalize(),
                speaking_style_title=speaking_style.capitalize(),
                type_guidance=type_guidance,
                style_guidance=style_guidance,
                length_guidance=length_guidance,
                output_format_title=output_format.capitalize(),
                format_instructions=format_instructions,
                output_description=self._get_output_description(output_format)
            )
            
            logger.info(f"Generated prompt for {sermon_type} sermon in {speaking_style} style")
            logger.debug(f"Prompt length: {len(prompt)} characters")
            
            return prompt
            
        except Exception as e:
            logger.error(f"Failed to build prompt: {e}")
            raise ValueError(f"Prompt generation failed: {str(e)}")

    def _get_type_guidance(self, sermon_type: str) -> str:
        """Get specific guidance for sermon type"""
        guidance = {
            'expository': 'Work through the biblical text systematically, explaining meaning and application verse by verse. Focus on the original context, linguistic insights, and clear progression through the passage.',
            
            'topical': 'Address the central theme using multiple scripture passages to support the main points. Build a cohesive argument that draws from various biblical texts to illuminate the topic.',
            
            'narrative': 'Tell the story (biblical or contemporary) with clear lessons and modern applications. Use narrative structure to engage emotions and illustrate spiritual truths through storytelling.',
            
            'textual': 'Focus deeply on the specific text provided, drawing out all theological and practical implications. Examine the passage word by word, considering context, meaning, and application.',
            
            'biographical': 'Follow the biblical character\'s journey, drawing life lessons and spiritual principles. Show how their experiences relate to modern Christian living and spiritual growth.'
        }
        return guidance.get(sermon_type, 'Structure the sermon according to the content provided.')

    def _get_style_guidance(self, speaking_style: str) -> str:
        """Get specific guidance for speaking style"""
        guidance = {
            'conversational': 'Use warm, relatable language that feels like talking to friends. Include personal anecdotes, ask rhetorical questions, and create an intimate atmosphere. Avoid overly formal language.',
            
            'authoritative': 'Use confident, pastoral tone that emphasizes biblical authority and clear doctrinal teaching. Speak with conviction and clarity, establishing credibility through scriptural foundation.',
            
            'storytelling': 'Weave narratives throughout the sermon. Use vivid illustrations, metaphors, and stories to convey truth. Paint pictures with words and help people visualize spiritual concepts.',
            
            'academic': 'Include scholarly insights, original language references, and detailed exegesis. Provide historical context, theological depth, and intellectual rigor while remaining accessible.',
            
            'inspirational': 'Focus on encouragement and motivation. Use uplifting language, hope-filled application, and enthusiastic delivery. Emphasize God\'s love, grace, and transformative power.'
        }
        return guidance.get(speaking_style, 'Use clear, engaging pastoral communication that connects with the audience.')

    def _get_length_guidance(self, sermon_length: str) -> str:
        """Get specific guidance for sermon length"""
        guidance = {
            '10-15': '10-15 minutes (about 1,500-2,000 words). Focus on one main point with clear, direct application. Keep illustrations brief and transitions smooth.',
            
            '20-25': '20-25 minutes (about 2,500-3,500 words). Develop 2-3 main points with balanced teaching and application. Include one substantial illustration per point.',
            
            '30-35': '30-35 minutes (about 4,000-5,000 words). Develop 3-4 main points with detailed illustrations and comprehensive application. Allow for deeper theological exploration.',
            
            '45+': '45+ minutes (about 6,000+ words). Comprehensive teaching with multiple points, extensive illustrations, and thorough application. Include detailed exegesis and practical examples.'
        }
        return guidance.get(sermon_length, '20-25 minutes with balanced content and application.')

    def _get_format_instructions(self, output_format: str) -> str:
        """Get specific formatting instructions"""
        instructions = {
            'full': """Format as a complete sermon manuscript with:
- Clear markdown headings (# for title, ## for main sections, ### for subsections)
- Scripture references in *italics* with version notation
- Main points numbered and fully developed with smooth transitions
- Illustrations and stories in blockquotes or clearly marked sections
- Application sections with practical, actionable steps
- Conclusion that reinforces the main message with memorable closing""",
            
            'outline': """Format as a detailed sermon outline with:
- Roman numerals for main points (I., II., III.)
- Capital letters for major sub-points (A., B., C.)
- Numbers for supporting details and applications (1., 2., 3.)
- Scripture references in parentheses with book, chapter, and verse
- Time estimates in parentheses for each major section
- Brief phrases rather than complete sentences""",
            
            'bullets': """Format as bullet points optimized for extemporaneous speaking:
- Main themes as primary bullets (•)
- Supporting points as indented sub-bullets (  ◦)
- Scripture references in italics with brief context
- Key illustrations noted briefly for speaker reference
- Application points clearly marked and actionable
- Conclusion bullet with memorable closing thought""",
            
            'notes': """Format as notes + outline hybrid with:
- Main points written as complete sentences or short paragraphs
- Supporting details in bullet format beneath each main point
- Illustrations described in 2-3 sentences with key details
- Scripture references with brief explanatory notes
- Application sections in paragraph form with specific steps
- Transition phrases provided between major sections"""
        }
        return instructions.get(output_format, instructions['full'])

    def _get_output_description(self, output_format: str) -> str:
        """Get description of output format for prompt"""
        descriptions = {
            'full': 'complete sermon manuscript',
            'outline': 'detailed sermon outline',
            'bullets': 'bullet point format',
            'notes': 'notes and outline hybrid'
        }
        return descriptions.get(output_format, 'complete sermon')

    def validate_configuration(self, sermon_type: str, speaking_style: str, 
                             sermon_length: str, output_format: str) -> Dict[str, Any]:
        """
        Validate all configuration parameters
        
        Returns:
            Dict with validation results and any errors
        """
        errors = []
        
        # Validate sermon type
        valid_types = ['expository', 'topical', 'narrative', 'textual', 'biographical']
        if sermon_type not in valid_types:
            errors.append(f"Invalid sermon type '{sermon_type}'. Must be one of: {', '.join(valid_types)}")
        
        # Validate speaking style
        valid_styles = ['conversational', 'authoritative', 'storytelling', 'academic', 'inspirational']
        if speaking_style not in valid_styles:
            errors.append(f"Invalid speaking style '{speaking_style}'. Must be one of: {', '.join(valid_styles)}")
        
        # Validate sermon length
        valid_lengths = ['10-15', '20-25', '30-35', '45+']
        if sermon_length not in valid_lengths:
            errors.append(f"Invalid sermon length '{sermon_length}'. Must be one of: {', '.join(valid_lengths)}")
        
        # Validate output format
        valid_formats = ['full', 'outline', 'bullets', 'notes']
        if output_format not in valid_formats:
            errors.append(f"Invalid output format '{output_format}'. Must be one of: {', '.join(valid_formats)}")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'configuration': {
                'sermon_type': sermon_type,
                'speaking_style': speaking_style,
                'sermon_length': sermon_length,
                'output_format': output_format
            }
        }

    def get_prompt_metadata(self, sermon_type: str, speaking_style: str, 
                           sermon_length: str, output_format: str, content: str) -> Dict[str, Any]:
        """
        Get metadata about the generated prompt
        
        Returns:
            Dictionary with prompt statistics and configuration info
        """
        prompt = self.build_prompt(sermon_type, speaking_style, sermon_length, output_format, content)
        
        return {
            'prompt_length': len(prompt),
            'prompt_words': len(prompt.split()),
            'content_length': len(content),
            'configuration': {
                'sermon_type': sermon_type,
                'speaking_style': speaking_style,
                'sermon_length': sermon_length,
                'output_format': output_format
            }
        }