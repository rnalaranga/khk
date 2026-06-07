import React, { useState } from 'react';

const MAKES = ['Toyota', 'Honda', 'Nissan', 'Mitsubishi', 'Suzuki'];
const MODELS = {
  'Toyota': ['Corolla', 'Prius', 'Aqua', 'Vitz'],
  'Honda': ['Civic', 'Fit', 'Vezel', 'CR-V'],
  'Nissan': ['Navara', 'X-Trail', 'Sunny'],
  'Mitsubishi': ['Montero', 'Lancer'],
  'Suzuki': ['Swift', 'Wagon R', 'Alto']
};

export default function VehicleSearch({ onSearch, vehicleSelected, onClear }) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [fuel, setFuel] = useState('');

  const handleSearch = () => {
    if (!make) return;
    onSearch({ make, model, year, fuel_type: fuel });
  };

  const handleClear = () => {
    setMake(''); setModel(''); setYear(''); setFuel('');
    onClear();
  };

  return (
    <div className="search-box">
      <div className="search-box-head">
        <h2 className="search-box-title">Find Parts For Your Vehicle</h2>
      </div>

      <div className="search-grid">
        <div className="field">
          <label className="field-label">Make</label>
          <select className="field-select" value={make} onChange={e => { setMake(e.target.value); setModel(''); }}>
            <option value="">Select Make</option>
            {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        
        <div className="field">
          <label className="field-label">Model</label>
          <select className="field-select" value={model} onChange={e => setModel(e.target.value)} disabled={!make}>
            <option value="">Select Model</option>
            {(MODELS[make] || []).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="field">
          <label className="field-label">Year</label>
          <select className="field-select" value={year} onChange={e => setYear(e.target.value)}>
            <option value="">Any Year</option>
            {Array.from({length: 25}, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field-label">Fuel Type</label>
          <select className="field-select" value={fuel} onChange={e => setFuel(e.target.value)}>
            <option value="">Any Fuel</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Hybrid">Hybrid</option>
            <option value="EV">EV</option>
          </select>
        </div>

        <button className="btn-search" onClick={handleSearch} disabled={!make}>
          Search Parts
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      {vehicleSelected && (
        <div className="active-vehicle">
          <div className="active-vehicle-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Filtering by: <span>{vehicleSelected.make} {vehicleSelected.model} {vehicleSelected.year} {vehicleSelected.fuel_type}</span>
          </div>
          <button className="btn-clear" onClick={handleClear}>✕ Clear</button>
        </div>
      )}
    </div>
  );
}
