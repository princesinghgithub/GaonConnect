// src/components/admin/Settings/Settings.jsx
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { FaSave } from 'react-icons/fa';

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await adminAPI.getSettings();
      setSettings(response.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch settings');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateSettings(settings);
      toast.success('Settings updated successfully');
      setSaving(false);
    } catch (error) {
      toast.error('Failed to update settings');
      setSaving(false);
    }
  };

  const updateSetting = (category, field, value) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [field]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <FaSave />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Commission Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Commission Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission Type
            </label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings?.commission?.type || 'percentage'}
              onChange={(e) => updateSetting('commission', 'type', e.target.value)}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission Value (%)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings?.commission?.percentage || 0}
              onChange={(e) =>
                updateSetting('commission', 'percentage', parseFloat(e.target.value))
              }
            />
          </div>
        </div>
      </div>

      {/* Pricing Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Base Pricing Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Fare (₹)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings?.pricing?.baseFare || 0}
              onChange={(e) =>
                updateSetting('pricing', 'baseFare', parseFloat(e.target.value))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Per KM (₹)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings?.pricing?.perKm || 0}
              onChange={(e) =>
                updateSetting('pricing', 'perKm', parseFloat(e.target.value))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Per Minute (₹)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings?.pricing?.perMinute || 0}
              onChange={(e) =>
                updateSetting('pricing', 'perMinute', parseFloat(e.target.value))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Fare (₹)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings?.pricing?.minimumFare || 0}
              onChange={(e) =>
                updateSetting('pricing', 'minimumFare', parseFloat(e.target.value))
              }
            />
          </div>
        </div>
      </div>

      {/* Vehicle Type Specific Pricing */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Vehicle Type Pricing</h2>
        
        {/* Auto Pricing */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Auto Rickshaw</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Fare (₹)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings?.pricing?.auto?.baseFare || 0}
                onChange={(e) => {
                  const newPricing = {
                    ...settings.pricing,
                    auto: {
                      ...settings.pricing.auto,
                      baseFare: parseFloat(e.target.value),
                    },
                  };
                  setSettings({ ...settings, pricing: newPricing });
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Per KM (₹)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings?.pricing?.auto?.perKm || 0}
                onChange={(e) => {
                  const newPricing = {
                    ...settings.pricing,
                    auto: {
                      ...settings.pricing.auto,
                      perKm: parseFloat(e.target.value),
                    },
                  };
                  setSettings({ ...settings, pricing: newPricing });
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Per Minute (₹)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings?.pricing?.auto?.perMinute || 0}
                onChange={(e) => {
                  const newPricing = {
                    ...settings.pricing,
                    auto: {
                      ...settings.pricing.auto,
                      perMinute: parseFloat(e.target.value),
                    },
                  };
                  setSettings({ ...settings, pricing: newPricing });
                }}
              />
            </div>
          </div>
        </div>

        {/* Bike Pricing */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Bike</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Fare (₹)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings?.pricing?.bike?.baseFare || 0}
                onChange={(e) => {
                  const newPricing = {
                    ...settings.pricing,
                    bike: {
                      ...settings.pricing.bike,
                      baseFare: parseFloat(e.target.value),
                    },
                  };
                  setSettings({ ...settings, pricing: newPricing });
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Per KM (₹)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings?.pricing?.bike?.perKm || 0}
                onChange={(e) => {
                  const newPricing = {
                    ...settings.pricing,
                    bike: {
                      ...settings.pricing.bike,
                      perKm: parseFloat(e.target.value),
                    },
                  };
                  setSettings({ ...settings, pricing: newPricing });
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Per Minute (₹)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings?.pricing?.bike?.perMinute || 0}
                onChange={(e) => {
                  const newPricing = {
                    ...settings.pricing,
                    bike: {
                      ...settings.pricing.bike,
                      perMinute: parseFloat(e.target.value),
                    },
                  };
                  setSettings({ ...settings, pricing: newPricing });
                }}
              />
            </div>
          </div>
        </div>

        {/* Car Pricing */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Car</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Fare (₹)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings?.pricing?.car?.baseFare || 0}
                onChange={(e) => {
                  const newPricing = {
                    ...settings.pricing,
                    car: {
                      ...settings.pricing.car,
                      baseFare: parseFloat(e.target.value),
                    },
                  };
                  setSettings({ ...settings, pricing: newPricing });
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Per KM (₹)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings?.pricing?.car?.perKm || 0}
                onChange={(e) => {
                  const newPricing = {
                    ...settings.pricing,
                    car: {
                      ...settings.pricing.car,
                      perKm: parseFloat(e.target.value),
                    },
                  };
                  setSettings({ ...settings, pricing: newPricing });
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Per Minute (₹)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings?.pricing?.car?.perMinute || 0}
                onChange={(e) => {
                  const newPricing = {
                    ...settings.pricing,
                    car: {
                      ...settings.pricing.car,
                      perMinute: parseFloat(e.target.value),
                    },
                  };
                  setSettings({ ...settings, pricing: newPricing });
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Cancellation Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Cancellation Fee (₹)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings?.cancellation?.userFee || 0}
              onChange={(e) =>
                updateSetting('cancellation', 'userFee', parseFloat(e.target.value))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Driver Cancellation Fee (₹)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings?.cancellation?.driverFee || 0}
              onChange={(e) =>
                updateSetting('cancellation', 'driverFee', parseFloat(e.target.value))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Free Cancellation Time (minutes)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings?.cancellation?.timeLimit || 0}
              onChange={(e) =>
                updateSetting('cancellation', 'timeLimit', parseInt(e.target.value))
              }
            />
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">General Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings?.general?.currency || 'INR'}
              onChange={(e) => updateSetting('general', 'currency', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency Symbol
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings?.general?.currencySymbol || '₹'}
              onChange={(e) =>
                updateSetting('general', 'currencySymbol', e.target.value)
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Support Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings?.general?.supportEmail || ''}
              onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Support Phone
            </label>
            <input
              type="tel"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings?.general?.supportPhone || ''}
              onChange={(e) => updateSetting('general', 'supportPhone', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Save Button at Bottom */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg font-semibold"
        >
          <FaSave />
          <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;