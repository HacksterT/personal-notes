// Tag Category System Constants
// Shared between TagSettings and LibraryStacks components

export const tagCategories = {
  'area_of_focus': {
    name: 'Area of Focus',
    color: 'green',
    colorClass: 'bg-green-600',
    colorClassLight: 'bg-green-400',
    limit: 2,
    description: 'Theological and topical focus areas'
  },
  'content_purpose': {
    name: 'Content Purpose', 
    color: 'blue',
    colorClass: 'bg-blue-600',
    colorClassLight: 'bg-blue-400',
    limit: 2,
    description: 'Intended use and audience'
  },
  'tone_style': {
    name: 'Tone/Style',
    color: 'orange', 
    colorClass: 'bg-orange-600',
    colorClassLight: 'bg-orange-400',
    limit: 2,
    description: 'Communication style and approach'
  },
  'custom': {
    name: 'Custom',
    color: 'purple',
    colorClass: 'bg-purple-600',
    colorClassLight: 'bg-purple-400',
    limit: 1,
    description: 'User-defined flexible tagging'
  }
};

// Prescriptive tag library (preloaded tags)
export const prescriptiveTags = {
  'area_of_focus': [
    'Salvation & Grace',
    'Prayer & Worship',
    'Faith & Trust', 
    'Love & Relationships',
    'Hope & Comfort',
    'Discipleship & Growth',
    'Scripture Study',
    'Service & Mission'
  ],
  'content_purpose': [
    'Teaching & Education',
    'Personal Reflection',
    'Evangelism & Outreach',
    'Pastoral Care',
    'Youth Ministry',
    'Small Group Study',
    'Sermon Preparation',
    'Devotional Reading'
  ],
  'tone_style': [
    'Expository & Scholarly',
    'Inspirational & Uplifting',
    'Practical & Applicable',
    'Contemplative & Reflective',
    'Conversational & Accessible',
    'Prophetic & Challenging',
    'Narrative & Story-driven',
    'Interactive & Discussion-based'
  ],
  'custom': [] // User-defined tags managed in localStorage
};

// Helper function to determine which category a tag belongs to
export const getTagCategory = (tagName) => {
  for (const [categoryKey, tags] of Object.entries(prescriptiveTags)) {
    if (tags.some(prescriptiveTag => 
      prescriptiveTag.toLowerCase() === tagName.toLowerCase()
    )) {
      return categoryKey;
    }
  }
  // If not found in prescriptive tags, assume it's custom
  return 'custom';
};

// Helper function to organize tags by category
export const organizeTagsByCategory = (tags = []) => {
  const organized = {
    area_of_focus: [],
    content_purpose: [],
    tone_style: [],
    custom: []
  };

  tags.forEach(tag => {
    const category = getTagCategory(tag);
    organized[category].push(tag);
  });

  return organized;
};

// Helper function to flatten organized tags back to array
export const flattenOrganizedTags = (organizedTags) => {
  return [
    ...organizedTags.area_of_focus,
    ...organizedTags.content_purpose,
    ...organizedTags.tone_style,
    ...organizedTags.custom
  ];
};