/**
 * File: frontend/src/pages/Grades.jsx
 * Purpose: Manage Salary Grades (L1, L2, etc.) using persistent layout.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Grades = () => {
  const [grades, setGrades] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingGrade, setEditingGrade] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [gradeRes, tempRes] = await Promise.all([
        axios.get('http://localhost:5000/api/salary/grades/all', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/salary/templates/all', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setGrades(gradeRes.data);
      setTemplates(tempRes.data);
    } catch (err) {
      toast.error('Failed to load grades data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingGrade.id) {
        await axios.put(`http://localhost:5000/api/salary/grades/${editingGrade.id}`, editingGrade, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Grade updated');
      } else {
        await axios.post('http://localhost:5000/api/salary/grades', editingGrade, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Grade created');
      }
      setEditingGrade(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to save grade');
    }
  };

  if (loading) return <div className="loading">Loading Grades...</div>;

  return (
    <div className="grades-page">
      <div className="page-header" style={{ marginBottom: '40px' }}>
        <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#1e293b', fontWeight: '800' }}>Grade Library</h2>
        <p style={{ color: '#64748b', marginTop: '8px' }}>Define standardized compensation levels to be assigned to your employees.</p>
        <button className="btn" style={{ marginTop: '20px' }} onClick={() => setEditingGrade({ name: '', description: '', template_id: '' })}>
          + Add New Salary Grade
        </button>
      </div>

      <div className="grades-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {grades.map(g => (
          <div key={g.id} className="grade-card-premium">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{g.name}</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '10px', minHeight: '40px' }}>{g.description || 'No description provided for this grade level.'}</p>
              </div>
              <button className="btn-icon-only" onClick={() => setEditingGrade(g)}>✎</button>
            </div>
            
            <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }}></div>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>
                  Rules: <span style={{ color: '#7c3aed' }}>{g.template_name}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingGrade && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px' }}>
            <h3>{editingGrade.id ? 'Edit Grade' : 'New Grade'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Grade Name (e.g. L1, Senior Manager)</label>
                <input type="text" value={editingGrade.name} onChange={e => setEditingGrade({...editingGrade, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={editingGrade.description} onChange={e => setEditingGrade({...editingGrade, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Import Salary Rules from Template</label>
                <select value={editingGrade.template_id} onChange={e => setEditingGrade({...editingGrade, template_id: e.target.value})} required>
                  <option value="">-- Choose Template to Import --</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-text" onClick={() => setEditingGrade(null)}>Cancel</button>
                <button type="submit" className="btn">Save Grade</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grades;
