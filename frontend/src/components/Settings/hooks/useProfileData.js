import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

export const useProfileData = () => {
  // Hardcoded Bible versions (10 most common + Other)
  const bibleVersions = [
    'NIV', 'ESV', 'KJV', 'NKJV', 'NASB', 
    'CSB', 'NLT', 'NRSV', 'AMP', 'MSG', 'Other'
  ];

  // Profile state
  const [profile, setProfile] = useState({
    full_name: '',
    profile_picture_url: '',
    preferred_bible_versions: [],
    other_bible_versions: '',
    other_theological_profile: '',
    audience_description: '',
    year_started_ministry: '',
    primary_church_affiliation: '',
    favorite_historical_preacher: '',
    role_id: '',
    theological_profile_id: '',
    speaking_style_id: '',
    education_level_id: ''
  });

  // Lookup data state
  const [lookupData, setLookupData] = useState({
    roles: [],
    theological_profiles: [],
    speaking_styles: [],
    education_levels: []
  });

  // Loading and saving states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load profile data and lookup data on hook initialization
  useEffect(() => {
    loadData();
  }, []);

  // Load profile and lookup data from API
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [profileResponse, lookupResponse] = await Promise.all([
        fetch(`${apiService.baseURL}/api/profile/`),
        fetch(`${apiService.baseURL}/api/profile/lookup-data`)
      ]);

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(prevProfile => ({
          ...prevProfile,
          ...profileData,
          preferred_bible_versions: profileData.preferred_bible_versions || [],
          year_started_ministry: profileData.year_started_ministry || ''
        }));
        console.log('✅ Profile data loaded successfully');
      } else {
        console.warn('Profile data not found, using defaults');
      }

      if (lookupResponse.ok) {
        const lookupResponseData = await lookupResponse.json();
        setLookupData(lookupResponseData);
        console.log('✅ Lookup data loaded successfully');
      } else {
        console.warn('Lookup data not available');
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      setError('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle multi-select changes (for Bible versions)
  const handleMultiSelectChange = (selectedVersions) => {
    setProfile(prev => ({
      ...prev,
      preferred_bible_versions: selectedVersions
    }));
  };

  // Handle Bible version checkbox changes
  const handleBibleVersionChange = (version, isChecked) => {
    const currentVersions = profile.preferred_bible_versions || [];
    let newVersions;
    
    if (isChecked) {
      newVersions = [...currentVersions, version];
    } else {
      newVersions = currentVersions.filter(v => v !== version);
    }
    
    handleMultiSelectChange(newVersions);
  };

  // Save profile data
  const saveProfile = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${apiService.baseURL}/api/profile/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profile,
          year_started_ministry: profile.year_started_ministry ? parseInt(profile.year_started_ministry) : null,
          role_id: profile.role_id ? parseInt(profile.role_id) : null,
          theological_profile_id: profile.theological_profile_id ? parseInt(profile.theological_profile_id) : null,
          speaking_style_id: profile.speaking_style_id ? parseInt(profile.speaking_style_id) : null,
          education_level_id: profile.education_level_id ? parseInt(profile.education_level_id) : null
        })
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        console.log('✅ Profile saved successfully');
        return { success: true, message: 'Profile saved successfully!' };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to save profile:', errorData);
        setError('Failed to save profile. Please try again.');
        return { success: false, message: 'Failed to save profile' };
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Network error. Please check your connection and try again.');
      return { success: false, message: 'Network error occurred' };
    } finally {
      setSaving(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    return await saveProfile();
  };

  // Check if "Other" theological profile is selected
  const isOtherTheologicalProfile = () => {
    return lookupData.theological_profiles.find(
      p => p.id == profile.theological_profile_id
    )?.name === 'Other';
  };

  // Check if "Other" Bible version is selected
  const isOtherBibleVersionSelected = () => {
    return profile.preferred_bible_versions?.includes('Other');
  };

  return {
    // State
    profile,
    lookupData,
    loading,
    saving,
    error,
    bibleVersions,
    
    // Handlers
    handleInputChange,
    handleMultiSelectChange,
    handleBibleVersionChange,
    handleSubmit,
    saveProfile,
    loadData,
    
    // Utilities
    isOtherTheologicalProfile,
    isOtherBibleVersionSelected,
    
    // Setters for external control
    setProfile,
    setError
  };
};