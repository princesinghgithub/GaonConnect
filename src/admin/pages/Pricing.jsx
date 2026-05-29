import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { FaTaxi, FaMotorcycle, FaCar, FaBolt, FaCalculator, FaClock } from 'react-icons/fa';

const VEHICLE_TYPES = [
  { key: 'auto', label: 'Auto Rickshaw', icon: <FaTaxi /> },
  { key: 'bike', label: 'Bike',          icon: <FaMotorcycle /> },
  { key: 'car',  label: 'Car',           icon: <FaCar /> },
];

const defaultVehicle = { baseFare: 0, perKmRate: 0, minimumFare: 0 };
const TS_KEY = 'gcPricingLastSaved';

const loadTimestamps = () => {
  try { return JSON.parse(localStorage.getItem(TS_KEY) || '{}'); }
  catch { return {}; }
};

const Pricing = () => {
  const [vehicles,   setVehicles]   = useState({ auto: { ...defaultVehicle }, bike: { ...defaultVehicle }, car: { ...defaultVehicle } });
  const [surge,      setSurge]      = useState({ enabled: false, multiplier: 1.5, reason: '' });
  const [commission, setCommission] = useState({ percentage: 10 });
  const [saving,     setSaving]     = useState({});
  const [loading,    setLoading]    = useState(true);
  const [timestamps, setTimestamps] = useState(loadTimestamps);
  const [calcDist,   setCalcDist]   = useState(5);

  useEffect(() => {
    adminAPI.getPricing()
      .then((res) => {
        const data = res.data?.data || {};
        if (data.vehicles)          setVehicles((prev) => ({ ...prev, ...data.vehicles }));
        if (data.surge?.highDemand) setSurge(data.surge.highDemand);
        if (data.commission)        setCommission(data.commission);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveTimestamp = (key) => {
    const current = loadTimestamps();
    const updated = { ...current, [key]: new Date().toISOString() };
    localStorage.setItem(TS_KEY, JSON.stringify(updated));
    setTimestamps(updated);
  };

  const calcFare = (type, km) => {
    const v = vehicles[type];
    return Math.max(v.minimumFare, v.baseFare + v.perKmRate * km);
  };

  const saveVehicle = async (type) => {
    const { baseFare, minimumFare } = vehicles[type];
    if (minimumFare < baseFare) {
      toast.error(`Minimum fare (₹${minimumFare}) cannot be less than base fare (₹${baseFare})`);
      return;
    }
    setSaving((s) => ({ ...s, [type]: true }));
    try {
      const { perKmRate } = vehicles[type];
      await adminAPI.updateVehiclePricing(type, baseFare, perKmRate, minimumFare);
      toast.success(`${type} pricing updated`);
      saveTimestamp(type);
    } catch {
      toast.error('Failed to update pricing');
    } finally {
      setSaving((s) => ({ ...s, [type]: false }));
    }
  };

  const saveSurge = async () => {
    setSaving((s) => ({ ...s, surge: true }));
    try {
      await adminAPI.updateSurge(surge.enabled, surge.multiplier, surge.reason);
      toast.success(surge.enabled ? 'Surge pricing enabled' : 'Surge pricing disabled');
      saveTimestamp('surge');
    } catch {
      toast.error('Failed to update surge');
    } finally {
      setSaving((s) => ({ ...s, surge: false }));
    }
  };

  const saveCommission = async () => {
    setSaving((s) => ({ ...s, commission: true }));
    try {
      await adminAPI.updateCommission(commission.percentage);
      toast.success('Commission updated');
      saveTimestamp('commission');
    } catch {
      toast.error('Failed to update commission');
    } finally {
      setSaving((s) => ({ ...s, commission: false }));
    }
  };

  const setVehicleField = (type, field, value) =>
    setVehicles((v) => ({ ...v, [type]: { ...v[type], [field]: value } }));

  const lastSaved = (key) => {
    const ts = timestamps[key];
    if (!ts) return null;
    return (
      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
        <FaClock className="text-gray-300" />
        Saved {new Date(ts).toLocaleString()}
      </p>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800">Pricing Control</h1>

      {/* Vehicle Type Pricing */}
      {VEHICLE_TYPES.map(({ key, label, icon }) => (
        <div key={key} className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <span className="text-orange-500 text-2xl">{icon}</span>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{label}</h2>
                {lastSaved(key)}
              </div>
            </div>
            <button
              onClick={() => saveVehicle(key)}
              disabled={saving[key]}
              className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium"
            >
              {saving[key] ? 'Saving...' : 'Save'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { field: 'baseFare',    label: 'Base Fare (₹)' },
              { field: 'perKmRate',   label: 'Per KM Rate (₹)' },
              { field: 'minimumFare', label: 'Minimum Fare (₹)' },
            ].map(({ field, label: lbl }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-600 mb-1">{lbl}</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                    field === 'minimumFare' && vehicles[key].minimumFare < vehicles[key].baseFare
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  value={vehicles[key][field]}
                  onChange={(e) => setVehicleField(key, field, parseFloat(e.target.value) || 0)}
                />
              </div>
            ))}
          </div>
          {vehicles[key].minimumFare < vehicles[key].baseFare && (
            <p className="text-xs text-red-500 mt-2">
              Minimum fare (₹{vehicles[key].minimumFare}) cannot be less than base fare (₹{vehicles[key].baseFare})
            </p>
          )}
        </div>
      ))}

      {/* Surge Pricing */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span className="text-orange-500 text-2xl"><FaBolt /></span>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Surge Pricing</h2>
              {lastSaved('surge')}
            </div>
          </div>
          <button
            onClick={saveSurge}
            disabled={saving.surge}
            className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium"
          >
            {saving.surge ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={surge.enabled}
              onChange={(e) => setSurge((s) => ({ ...s, enabled: e.target.checked }))}
            />
            <div className="w-11 h-6 bg-gray-300 peer-checked:bg-orange-500 rounded-full transition peer-focus:ring-2 peer-focus:ring-orange-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-5 after:h-5 after:rounded-full after:transition peer-checked:after:translate-x-5" />
          </label>
          <span className={`font-semibold ${surge.enabled ? 'text-orange-600' : 'text-gray-500'}`}>
            {surge.enabled ? 'Surge ON' : 'Surge OFF'}
          </span>
        </div>

        {surge.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Multiplier (e.g. 1.5 = 1.5x fare)
              </label>
              <input
                type="number"
                min="1"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={surge.multiplier}
                onChange={(e) => setSurge((s) => ({ ...s, multiplier: parseFloat(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Reason / Festival Name
              </label>
              <input
                type="text"
                placeholder="e.g. Diwali, New Year..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={surge.reason}
                onChange={(e) => setSurge((s) => ({ ...s, reason: e.target.value }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Commission */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Commission</h2>
            {lastSaved('commission')}
          </div>
          <button
            onClick={saveCommission}
            disabled={saving.commission}
            className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium"
          >
            {saving.commission ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Commission Percentage (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={commission.percentage}
            onChange={(e) => setCommission({ percentage: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      {/* Fare Calculator */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <FaCalculator className="text-orange-500" /> Fare Calculator
        </h2>
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-1">Trip Distance (km)</label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={calcDist}
            onChange={(e) => setCalcDist(parseFloat(e.target.value) || 1)}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {VEHICLE_TYPES.map(({ key, label, icon }) => {
            const fare = calcFare(key, calcDist);
            const surgeFare = surge.enabled ? fare * surge.multiplier : null;
            return (
              <div key={key} className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
                <div className="text-orange-500 text-2xl flex justify-center mb-1">{icon}</div>
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">₹{fare.toFixed(0)}</p>
                {surgeFare && (
                  <p className="text-xs text-orange-600 mt-0.5 font-medium">
                    With surge: ₹{surgeFare.toFixed(0)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          * Estimated fare based on current input values. Minimum fare applied where applicable.
        </p>
      </div>
    </div>
  );
};

export default Pricing;
