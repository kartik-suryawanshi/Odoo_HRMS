/**
 * File: frontend/src/pages/SalaryTemplates.jsx
 * Purpose: Professional Rule-Based Salary Template Builder.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const SalaryTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  
  // Default structure based on user's screenshot
  const [currentTemplate, setCurrentTemplate] = useState({
    name: '',
    components: [
      { name: 'Basic Salary', computation_type: 'PERCENTAGE', value: 50, based_on: 'WAGE', is_deduction: false },
      { name: 'House Rent Allowance (HRA)', computation_type: 'PERCENTAGE', value: 50, based_on: 'BASIC SALARY', is_deduction: false },
      { name: 'Performance Bonus', computation_type: 'PERCENTAGE', value: 8.33, based_on: 'BASIC SALARY', is_deduction: false },
      { name: 'Leave Travel Allowance (LTA)', computation_type: 'PERCENTAGE', value: 8.33, based_on: 'BASIC SALARY', is_deduction: false },
      { name: 'Provident Fund (PF)', computation_type: 'PERCENTAGE', value: 12, based_on: 'BASIC SALARY', is_deduction: true },
      { name: 'Professional Tax', computation_type: 'FIXED', value: 200, based_on: 'WAGE', is_deduction: true },
    ]
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/salary/templates/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(res.data);
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const updateComponent = (index, field, val) => {
    const newComps = [...currentTemplate.components];
    newComps[index][field] = val;
    setCurrentTemplate({ ...currentTemplate, components: newComps });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentTemplate.name) {
      return toast.error('Please provide a name for this template');
    }
    try {
      const token = localStorage.getItem('token');
      if (currentTemplate.id) {
        await axios.put(`http://localhost:5000/api/salary/templates/${currentTemplate.id}`, currentTemplate, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Template updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/salary/templates', currentTemplate, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('New template created successfully');
      }
      setShowEditor(false);
      fetchTemplates();
    } catch (err) {
      toast.error('Failed to save template');
    }
  };

  if (loading) return <div className="loading">Loading Templates...</div>;

  return (
    <div className="templates-page">
      {!showEditor ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h3 style={{ margin: 0 }}>Salary Templates Library</h3>
            <button className="btn" onClick={() => {
               setCurrentTemplate({ name: '', components: currentTemplate.components }); // Reset name but keep structure
               setShowEditor(true);
            }}>
              + Create New Template
            </button>
          </div>

          <div className="template-grid">
            {templates.map(t => (
              <div key={t.id} className="template-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>{t.name}</h4>
                  <button className="btn-text" onClick={() => { setCurrentTemplate(t); setShowEditor(true); }}>Edit Structure ✎</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '15px' }}>
                  {t.components?.map((c, i) => (
                    <span key={i} className="tag" style={{ background: c.is_deduction ? '#fee2e2' : '#f0f9ff', color: c.is_deduction ? '#991b1b' : '#075985', fontSize: '0.7rem' }}>
                      {c.name}: {c.value}{c.computation_type === 'PERCENTAGE' ? '%' : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="template-builder-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
             <h3 style={{ margin: 0 }}>{currentTemplate.id ? 'Edit Salary Template' : 'Build New Salary Template'}</h3>
             <button className="btn-text" onClick={() => setShowEditor(false)}>← Back to Library</button>
          </div>

          <form onSubmit={handleSave} className="template-form">
            <div className="template-header-box" style={{ background: 'white', padding: '25px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #eee' }}>
               <div className="form-group" style={{ margin: 0, maxWidth: '400px' }}>
                  <label>Template Name (e.g. Standard Employee, Senior Manager)</label>
                  <input 
                    type="text" 
                    placeholder="Enter template name..."
                    value={currentTemplate.name} 
                    onChange={e => setCurrentTemplate({...currentTemplate, name: e.target.value})} 
                    required 
                    style={{ fontSize: '1.1rem', fontWeight: '500' }}
                  />
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
               {/* 1. EARNINGS SECTION */}
               <div className="earnings-builder">
                  <h4 className="info-group-title" style={{ marginBottom: '20px' }}>1. Earnings (Monthly)</h4>
                  {currentTemplate.components.filter(c => !c.is_deduction).map((c, idx) => {
                    const globalIdx = currentTemplate.components.findIndex(comp => comp === c);
                    return (
                      <div key={idx} className="builder-row" style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #f5f5f5' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                               <p style={{ margin: 0, fontWeight: '600', color: '#333' }}>{c.name}</p>
                               <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#888' }}>
                                  Rule: {c.computation_type === 'PERCENTAGE' ? `${c.value}% of ${c.based_on}` : `Fixed Amount`}
                               </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                               <input 
                                 type="number" 
                                 step="0.01"
                                 value={c.value} 
                                 onChange={e => updateComponent(globalIdx, 'value', e.target.value)}
                                 style={{ width: '80px', textAlign: 'right', padding: '8px' }}
                               />
                               <span style={{ color: '#666', width: '20px' }}>{c.computation_type === 'PERCENTAGE' ? '%' : '₹'}</span>
                               <select 
                                 value={c.computation_type} 
                                 onChange={e => updateComponent(globalIdx, 'computation_type', e.target.value)}
                                 style={{ padding: '6px', fontSize: '0.8rem' }}
                               >
                                  <option value="PERCENTAGE">%</option>
                                  <option value="FIXED">₹</option>
                               </select>
                            </div>
                         </div>
                      </div>
                    );
                  })}
                  <div className="balancing-box" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1', marginTop: '20px' }}>
                     <p style={{ margin: 0, fontWeight: '600', color: '#475569' }}>Fixed Allowance (Balancing)</p>
                     <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Automatically calculated to match total CTC</p>
                  </div>
               </div>

               {/* 2. DEDUCTIONS SECTION */}
               <div className="deductions-builder">
                  <h4 className="info-group-title" style={{ marginBottom: '20px' }}>2. Deductions</h4>
                  {currentTemplate.components.filter(c => c.is_deduction).map((c, idx) => {
                    const globalIdx = currentTemplate.components.findIndex(comp => comp === c);
                    return (
                      <div key={idx} className="builder-row" style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #f5f5f5' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                               <p style={{ margin: 0, fontWeight: '600', color: '#333' }}>{c.name}</p>
                               <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#888' }}>
                                  Rule: {c.computation_type === 'PERCENTAGE' ? `${c.value}% of ${c.based_on}` : `Fixed Amount`}
                               </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                               <input 
                                 type="number" 
                                 step="0.01"
                                 value={c.value} 
                                 onChange={e => updateComponent(globalIdx, 'value', e.target.value)}
                                 style={{ width: '80px', textAlign: 'right', padding: '8px' }}
                               />
                               <span style={{ color: '#666', width: '20px' }}>{c.computation_type === 'PERCENTAGE' ? '%' : '₹'}</span>
                            </div>
                         </div>
                      </div>
                    );
                  })}

                  <div style={{ marginTop: '50px' }}>
                     <button type="submit" className="btn" style={{ width: '100%', height: '50px', fontSize: '1rem' }}>
                        Save Template & Update Rules
                     </button>
                  </div>
               </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SalaryTemplates;
