/**
 * File: frontend/src/pages/SalaryTemplates.jsx
 * Purpose: Manage rule-based salary templates.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const SalaryTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingTemplate.id) {
        await axios.put(`http://localhost:5000/api/salary/templates/${editingTemplate.id}`, editingTemplate, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Template updated');
      } else {
        await axios.post('http://localhost:5000/api/salary/templates', editingTemplate, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Template created');
      }
      setEditingTemplate(null);
      fetchTemplates();
    } catch (err) {
      toast.error('Failed to save template');
    }
  };

  if (loading) return <div className="loading">Loading Templates...</div>;

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <div className="sidebar-logo" onClick={() => navigate('/dashboard')} style={{cursor: 'pointer'}}>
          <div style={{ width: 40, height: 40, background: '#eee', borderRadius: '4px' }}></div>
          <span>EmPay</span>
        </div>
        <div className="sidebar-nav">
          <div className="nav-item" onClick={() => navigate('/dashboard')}>Dashboard</div>
          <div className="nav-item" onClick={() => navigate('/profile')}>My Profile</div>
          <div className="nav-item" onClick={() => navigate('/payroll')}>Payroll</div>
          <div className="nav-item active" onClick={() => navigate('/salary-templates')}>Templates</div>
        </div>
      </div>

      <div className="main-area">
        <div className="top-header">
          <h2>Salary Templates (Rules)</h2>
          <button className="btn" onClick={() => setEditingTemplate({ name: 'New Template', basic_percent: 50, hra_percent: 50, pf_percent: 12, performance_bonus_percent: 8.33, lta_percent: 8.33, standard_allowance: 4167, professional_tax: 200 })}>
            + Create Template
          </button>
        </div>

        <div className="dashboard-content" style={{ padding: '30px' }}>
          <div className="template-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {templates.map(t => (
              <div key={t.id} className="template-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>{t.name}</h3>
                  <span className="edit-btn" onClick={() => setEditingTemplate(t)}>✎</span>
                </div>
                <hr style={{ margin: '15px 0', border: 'none', borderBottom: '1px solid #eee' }} />
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  <p><strong>Basic:</strong> {t.basic_percent}% of Wage</p>
                  <p><strong>HRA:</strong> {t.hra_percent}% of Basic</p>
                  <p><strong>PF:</strong> {t.pf_percent}% of Basic</p>
                  <p><strong>Deduction:</strong> ₹ {t.professional_tax}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Modal Overlay */}
        {editingTemplate && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal-content" style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3>{editingTemplate.id ? 'Edit Template' : 'New Template'}</h3>
              <form onSubmit={handleSave}>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label>Template Name</label>
                  <input type="text" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>Basic (% of Wage)</label>
                    <input type="number" value={editingTemplate.basic_percent} onChange={e => setEditingTemplate({...editingTemplate, basic_percent: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>HRA (% of Basic)</label>
                    <input type="number" value={editingTemplate.hra_percent} onChange={e => setEditingTemplate({...editingTemplate, hra_percent: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>PF (% of Basic)</label>
                    <input type="number" value={editingTemplate.pf_percent} onChange={e => setEditingTemplate({...editingTemplate, pf_percent: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Prof. Tax (Fixed)</label>
                    <input type="number" value={editingTemplate.professional_tax} onChange={e => setEditingTemplate({...editingTemplate, professional_tax: e.target.value})} />
                  </div>
                </div>
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn">Save Template</button>
                  <button type="button" className="btn-text" onClick={() => setEditingTemplate(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryTemplates;
