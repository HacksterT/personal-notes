import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

const ProfileSettings = () => {
  // Hardcoded Bible versions (10 most common + Other)
  const bibleVersions = [
    'NIV', 'ESV', 'KJV', 'NKJV', 'NASB', 
    'CSB', 'NLT', 'NRSV', 'AMP', 'MSG', 'Other'
  ];

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

  const [lookupData, setLookupData] = useState({
    roles: [],
    theological_profiles: [],
    speaking_styles: [],
    education_levels: []
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load profile data and lookup data on component mount
  useEffect(() => {
    const loadData = async () => {
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
        }

        if (lookupResponse.ok) {
          const lookupResponseData = await lookupResponse.json();
          setLookupData(lookupResponseData);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelectChange = (selectedVersions) => {
    setProfile(prev => ({
      ...prev,
      preferred_bible_versions: selectedVersions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

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
        // Could add a success message here
      } else {
        console.error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-brass-light">Loading profile...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-cormorant text-brass mb-6">AI Personalization</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-brass-light mb-1">Full Name</label>
            <input 
              type="text" 
              id="full_name" 
              name="full_name"
              value={profile.full_name || ''}
              onChange={handleInputChange}
              className="w-full bg-library-dark border-brass/30 rounded-md p-2 text-brass-light focus:ring-brass focus:border-brass [&>option]:bg-library-dark [&>option]:text-brass-light" 
              placeholder="John Doe" 
            />
          </div>
          <div>
            <label htmlFor="profile_picture_url" className="block text-sm font-medium text-brass-light mb-1">Profile Picture URL</label>
            <input 
              type="text" 
              id="profile_picture_url" 
              name="profile_picture_url"
              value={profile.profile_picture_url || ''}
              onChange={handleInputChange}
              className="w-full bg-library-dark border-brass/30 rounded-md p-2 text-brass-light focus:ring-brass focus:border-brass [&>option]:bg-library-dark [&>option]:text-brass-light" 
              placeholder="https://example.com/avatar.png" 
            />
          </div>
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role_id" className="block text-sm font-medium text-brass-light mb-1">Role</label>
          <select 
            id="role_id" 
            name="role_id"
            value={profile.role_id || ''}
            onChange={handleInputChange}
            className="w-full bg-library-dark border-brass/30 rounded-md p-2 text-brass-light focus:ring-brass focus:border-brass [&>option]:bg-library-dark [&>option]:text-brass-light"
          >
            <option value="">Select a role...</option>
            {lookupData.roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </div>

        {/* Ministry Experience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="year_started_ministry" className="block text-sm font-medium text-brass-light mb-1">Year Started Ministry</label>
            <input 
              type="number" 
              id="year_started_ministry" 
              name="year_started_ministry"
              value={profile.year_started_ministry || ''}
              onChange={handleInputChange}
              className="w-full bg-library-dark border-brass/30 rounded-md p-2 text-brass-light focus:ring-brass focus:border-brass [&>option]:bg-library-dark [&>option]:text-brass-light" 
              placeholder="2005" 
            />
          </div>
          <div>
            <label htmlFor="primary_church_affiliation" className="block text-sm font-medium text-brass-light mb-1">Primary Church Affiliation</label>
            <input 
              type="text" 
              id="primary_church_affiliation" 
              name="primary_church_affiliation"
              value={profile.primary_church_affiliation || ''}
              onChange={handleInputChange}
              className="w-full bg-library-dark border-brass/30 rounded-md p-2 text-brass-light focus:ring-brass focus:border-brass [&>option]:bg-library-dark [&>option]:text-brass-light" 
              placeholder="First Baptist Church" 
            />
          </div>
        </div>

        {/* AI Preferences */}
        <div>
          <label className="block text-sm font-medium text-brass-light mb-3">Preferred Bible Version(s)</label>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {bibleVersions.map(version => (
              <label key={version} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={version}
                  checked={profile.preferred_bible_versions?.includes(version) || false}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    const currentVersions = profile.preferred_bible_versions || [];
                    let newVersions;
                    
                    if (isChecked) {
                      newVersions = [...currentVersions, version];
                    } else {
                      newVersions = currentVersions.filter(v => v !== version);
                    }
                    
                    handleMultiSelectChange(newVersions);
                  }}
                  className="w-4 h-4 text-brass bg-library-dark/50 border-brass/30 rounded focus:ring-brass focus:ring-2"
                />
                <span className="text-sm text-brass-light">{version}</span>
              </label>
            ))}
          </div>
          
          {/* Free text field for "Other" - only shows when "Other" is checked */}
          {profile.preferred_bible_versions?.includes('Other') && (
            <div className="mt-3">
              <input
                type="text"
                placeholder="Please specify other Bible version(s)..."
                value={profile.other_bible_versions || ''}
                onChange={(e) => {
                  setProfile(prev => ({
                    ...prev,
                    other_bible_versions: e.target.value
                  }));
                }}
                className="w-full bg-library-dark border-brass/30 rounded-md p-2 text-brass-light focus:ring-brass focus:border-brass [&>option]:bg-library-dark [&>option]:text-brass-light"
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="theological_profile_id" className="block text-sm font-medium text-brass-light mb-1">Theological Profile</label>
          <select 
            id="theological_profile_id" 
            name="theological_profile_id"
            value={profile.theological_profile_id || ''}
            onChange={handleInputChange}
            className="w-full bg-library-dark border-brass/30 rounded-md p-2 text-brass-light focus:ring-brass focus:border-brass [&>option]:bg-library-dark [&>option]:text-brass-light"
          >
            <option value="">Select a profile...</option>
            {lookupData.theological_profiles.map(profileOption => (
              <option key={profileOption.id} value={profileOption.id}>{profileOption.name}</option>
            ))}
          </select>
          
          {/* Free text field for "Other" theological profile - only shows when "Other" is selected */}
          {lookupData.theological_profiles.find(p => p.id == profile.theological_profile_id)?.name === 'Other' && (
            <div className="mt-3">
              <input
                type="text"
                placeholder="Please specify your theological background..."
                value={profile.other_theological_profile || ''}
                onChange={(e) => {
                  setProfile(prev => ({
                    ...prev,
                    other_theological_profile: e.target.value
                  }));
                }}
                className="w-full bg-library-dark border-brass/30 rounded-md p-2 text-brass-light focus:ring-brass focus:border-brass [&>option]:bg-library-dark [&>option]:text-brass-light"
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="speaking_style_id" className="block text-sm font-medium text-brass-light mb-1">Primary Speaking Style</label>
          <select 
            id="speaking_style_id" 
            name="speaking_style_id"
            value={profile.speaking_style_id || ''}
            onChange={handleInputChange}
            className="w-full bg-library-dark border-brass/30 rounded-md p-2 text-brass-light focus:ring-brass focus:border-brass [&>option]:bg-library-dark [&>option]:text-brass-light"
          >
            <option value="">Select a style...</option>
            {lookupData.speaking_styles.map(style => (
              <option key={style.id} value={style.id}>{style.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="education_level_id" className="block text-sm font-medium text-brass-light mb-1">Education Level</label>
          <select 
            id="education_level_id" 
            name="education_level_id"
            value={profile.education_level_id || ''}
            onChange={handleInputChange}
            className="w-full bg-library-dark border-brass/30 rounded-md p-2 text-brass-light focus:ring-brass focus:border-brass [&>option]:bg-library-dark [&>option]:text-brass-light"
          >
            <option value="">Select education level...</option>
            {lookupData.education_levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="favorite_historical_preacher" className="block text-sm font-medium text-brass-light mb-1">Favorite Historical Preacher</label>
          <input 
            type="text" 
            id="favorite_historical_preacher" 
            name="favorite_historical_preacher"
            value={profile.favorite_historical_preacher || ''}
            onChange={handleInputChange}
            className="w-full bg-library-dark border-brass/30 rounded-md p-2 text-brass-light focus:ring-brass focus:border-brass [&>option]:bg-library-dark [&>option]:text-brass-light" 
            placeholder="Charles Spurgeon" 
          />
        </div>

        <div>
          <label htmlFor="audience_description" className="block text-sm font-medium text-brass-light mb-1">Describe Your Typical Audience</label>
          <textarea 
            id="audience_description" 
            name="audience_description"
            rows="3" 
            value={profile.audience_description || ''}
            onChange={handleInputChange}
            className="w-full bg-library-dark border-brass/30 rounded-md p-2 text-brass-light focus:ring-brass focus:border-brass [&>option]:bg-library-dark [&>option]:text-brass-light" 
            placeholder="e.g., A mix of young families and older members in a suburban community."
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-brass hover:bg-brass/80 text-library-dark font-bold py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
