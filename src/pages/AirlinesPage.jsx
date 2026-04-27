import React, { useEffect, useState } from 'react';
import { Building2, Plus, Edit2, PowerOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { airlineAPI } from '../api/services';
import { Modal, Badge, EmptyState, LoadingSpinner, PageHeader, ConfirmDialog } from '../components/common';

const defaultAirline = { name: '', iataCode: '', country: '', logoUrl: '', active: true };

const AirlinesPage = () => {
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAirline, setEditAirline] = useState(null);
  const [form, setForm] = useState(defaultAirline);
  const [saving, setSaving] = useState(false);
  const [deactivateId, setDeactivateId] = useState(null);

  const fetchAirlines = async () => {
    setLoading(true);
    try { const r = await airlineAPI.getAllAirlines(); setAirlines(r.data || []); }
    catch { toast.error('Failed to load airlines.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAirlines(); }, []);

  const openCreate = () => { setForm(defaultAirline); setEditAirline(null); setShowModal(true); };
  const openEdit = (a) => { setForm(a); setEditAirline(a); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editAirline) { await airlineAPI.updateAirline(editAirline.airlineId, form); toast.success('Airline updated!'); }
      else { await airlineAPI.createAirline(form); toast.success('Airline created!'); }
      setShowModal(false); fetchAirlines();
    } catch { toast.error('Save failed.'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async () => {
    try { await airlineAPI.deactivateAirline(deactivateId); toast.success('Airline deactivated.'); setDeactivateId(null); fetchAirlines(); }
    catch { toast.error('Failed.'); }
  };

  const f = (k) => ({ value: form[k] || '', onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="page-wrapper">
      <PageHeader title="Airlines" subtitle="Manage airline records" actions={
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Airline</button>
      } />

      {loading ? <LoadingSpinner text="Loading airlines…" /> : (
        <div className="glass-card">
          {airlines.length === 0 ? <EmptyState icon={Building2} title="No airlines found" action={<button className="btn btn-primary btn-sm" onClick={openCreate}>Add First Airline</button>} /> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Name</th><th>IATA Code</th><th>Country</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {airlines.map(a => (
                    <tr key={a.airlineId}>
                      <td style={{ fontWeight: 600 }}>{a.name}</td>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--blue-700)', background: 'rgba(37,99,235,0.08)', padding: '2px 8px', borderRadius: '6px' }}>{a.iataCode}</span></td>
                      <td>{a.country}</td>
                      <td><Badge status={a.active ? 'CONFIRMED' : 'CANCELLED'} label={a.active ? 'Active' : 'Inactive'} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(a)}><Edit2 size={13} /></button>
                          {a.active && <button className="btn btn-danger btn-sm" onClick={() => setDeactivateId(a.airlineId)}><PowerOff size={13} /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editAirline ? 'Edit Airline' : 'Add Airline'} size="sm"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? <div className="spinner" /> : null} Save</button>
        </>}>
        <form onSubmit={handleSave}>
          <div className="form-group"><label className="form-label">Airline Name</label><input className="form-input" placeholder="Air India" {...f('name')} required /></div>
          <div className="form-group"><label className="form-label">IATA Code</label><input className="form-input" maxLength={3} placeholder="AI" {...f('iataCode')} required /></div>
          <div className="form-group"><label className="form-label">Country</label><input className="form-input" placeholder="India" {...f('country')} /></div>
          <div className="form-group"><label className="form-label">Logo URL</label><input type="url" className="form-input" placeholder="https://…" {...f('logoUrl')} /></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deactivateId} onClose={() => setDeactivateId(null)} onConfirm={handleDeactivate}
        title="Deactivate Airline" message="This airline will be marked inactive. Existing flights won't be affected." confirmText="Deactivate" danger />
    </div>
  );
};

export default AirlinesPage;
