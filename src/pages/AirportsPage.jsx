import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { airlineAPI } from '../api/services';
import { Modal, EmptyState, LoadingSpinner, PageHeader, ConfirmDialog } from '../components/common';

const defaultAirport = { name: '', iataCode: '', city: '', country: '', timezone: '' };

const AirportsPage = () => {
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editAirport, setEditAirport] = useState(null);
  const [form, setForm] = useState(defaultAirport);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [searching, setSearching] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try { const r = await airlineAPI.getAllAirports(); setAirports(r.data || []); }
    catch { toast.error('Failed to load airports.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) { fetchAll(); return; }
    setSearching(true);
    try { const r = await airlineAPI.searchAirports(search); setAirports(r.data || []); }
    catch { toast.error('Search failed.'); }
    finally { setSearching(false); }
  };

  const openCreate = () => { setForm(defaultAirport); setEditAirport(null); setShowModal(true); };
  const openEdit = (a) => { setForm(a); setEditAirport(a); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editAirport) { await airlineAPI.updateAirport(editAirport.airportId, form); toast.success('Airport updated!'); }
      else { await airlineAPI.createAirport(form); toast.success('Airport created!'); }
      setShowModal(false); fetchAll();
    } catch { toast.error('Save failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await airlineAPI.deleteAirport(deleteId); toast.success('Airport deleted.'); setDeleteId(null); fetchAll(); }
    catch { toast.error('Delete failed.'); }
  };

  const f = (k) => ({ value: form[k] || '', onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="page-wrapper">
      <PageHeader title="Airports" subtitle="Manage airport records" actions={
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Airport</button>
      } />

      <div className="glass-card p-4 mb-6">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <input className="form-input" style={{ flex: 1 }} placeholder="Search by city, name or IATA…" value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn btn-secondary" disabled={searching}>{searching ? <div className="spinner" /> : <Search size={16} />} Search</button>
          {search && <button type="button" className="btn btn-ghost" onClick={() => { setSearch(''); fetchAll(); }}>Clear</button>}
        </form>
      </div>

      {loading ? <LoadingSpinner text="Loading airports…" /> : (
        <div className="glass-card">
          {airports.length === 0 ? <EmptyState icon={MapPin} title="No airports found" action={<button className="btn btn-primary btn-sm" onClick={openCreate}>Add Airport</button>} /> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Name</th><th>IATA</th><th>City</th><th>Country</th><th>Timezone</th><th>Actions</th></tr></thead>
                <tbody>
                  {airports.map(a => (
                    <tr key={a.airportId}>
                      <td style={{ fontWeight: 600 }}>{a.name}</td>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--blue-700)', background: 'rgba(37,99,235,0.08)', padding: '2px 8px', borderRadius: '6px' }}>{a.iataCode}</span></td>
                      <td>{a.city}</td>
                      <td>{a.country}</td>
                      <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{a.timezone || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(a)}><Edit2 size={13} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(a.airportId)}><Trash2 size={13} /></button>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editAirport ? 'Edit Airport' : 'Add Airport'} size="sm"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? <div className="spinner" /> : null} Save</button>
        </>}>
        <form onSubmit={handleSave}>
          <div className="form-group"><label className="form-label">Airport Name</label><input className="form-input" placeholder="Indira Gandhi International" {...f('name')} required /></div>
          <div className="form-group"><label className="form-label">IATA Code</label><input className="form-input" maxLength={3} placeholder="DEL" {...f('iataCode')} required /></div>
          <div className="form-group"><label className="form-label">City</label><input className="form-input" placeholder="New Delhi" {...f('city')} required /></div>
          <div className="form-group"><label className="form-label">Country</label><input className="form-input" placeholder="India" {...f('country')} /></div>
          <div className="form-group"><label className="form-label">Timezone</label><input className="form-input" placeholder="Asia/Kolkata" {...f('timezone')} /></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Airport" message="This will permanently remove the airport record. This cannot be undone." confirmText="Delete" danger />
    </div>
  );
};

export default AirportsPage;
