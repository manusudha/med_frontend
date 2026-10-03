import { useState } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useFetch, { useDebounced } from '../lib/useFetch';
import { Strip, BackButton, AccessTag, SearchBox, TableState, Field, useTrail } from '../components/ui';
import Icon from '../components/Icon';
import { STRIP } from '../lib/theme';

const STATUS_LABEL = { ok: 'In Stock', low: 'Low Stock', out: 'Out of Stock' };

function StockForm({ onSaved }) {
  const { clinic } = useAuth();
  const toast = useToast();
  const s = clinic.settings;
  const blank = { name: '', category: s.stockCategories[0] || '', quantity: '', unit: s.stockUnits[0] || 'Units', lowThreshold: 5 };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (!f.name.trim()) return setErr('Enter the item name.');
    if (f.quantity === '' || +f.quantity < 0) return setErr('Enter a quantity (0 or more).');
    setBusy(true);
    setErr('');
    try {
      const r = await api.stock.save({ ...f, quantity: Number(f.quantity), lowThreshold: Number(f.lowThreshold) });
      toast(r.restocked ? `✓ Restocked ${r.item.name} — now ${r.item.quantity} ${r.item.unit}.` : `✓ ${r.item.name} added.`);
      setF(blank);
      onSaved();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="ph"><h3>Add Item / Restock</h3><span style={{ fontSize: 12, color: 'var(--txt2)' }}>Using an existing name adds to its quantity</span></div>
      <form className="pb" onSubmit={submit}>
        <div className="fgrid">
          <Field label="Item Name *"><input value={f.name} onChange={set('name')} placeholder="e.g. Triphala Churna" list="stock-names" /></Field>
          <Field label="Category">
            <select value={f.category} onChange={set('category')}>{s.stockCategories.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="Quantity *"><input type="number" min="0" step="any" value={f.quantity} onChange={set('quantity')} placeholder="Amount received" /></Field>
          <Field label="Unit">
            <select value={f.unit} onChange={set('unit')}>{s.stockUnits.map((u) => <option key={u}>{u}</option>)}</select>
          </Field>
          <Field label="Low-stock alert at"><input type="number" min="0" value={f.lowThreshold} onChange={set('lowThreshold')} /></Field>
        </div>
        {err && <p className="err" style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{err}</p>}
        <button className="btn-main" type="submit" disabled={busy}><Icon name="plus" size={15} color="#fff" /> {busy ? 'Saving…' : 'Save to Stock'}</button>
      </form>
    </div>
  );
}

export default function Stock() {
  useTrail([{ label: 'Medicines & Supplies' }]);
  const { can } = useAuth();
  const toast = useToast();
  const canEdit = can('stock', 'edit');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null); // { id, qty }
  const dq = useDebounced(q);
  const list = useFetch(() => api.stock.list({ q: dq, status }), [dq, status]);
  const items = list.data?.items || [];
  const sum = list.data?.summary;

  async function saveQty(item) {
    const qty = Number(editing.qty);
    if (Number.isNaN(qty) || qty < 0) return toast('Quantity must be 0 or more.');
    try {
      const updated = await api.stock.update(item.id, { quantity: qty });
      list.setData((d) => ({ ...d, items: d.items.map((x) => (x.id === item.id ? updated : x)) }));
      setEditing(null);
      toast(`✓ ${item.name} updated to ${qty} ${item.unit}.`);
    } catch (e) {
      toast(e.message);
    }
    return null;
  }

  async function remove(item) {
    if (!window.confirm(`Remove ${item.name} from stock?`)) return;
    try {
      await api.stock.remove(item.id);
      toast(`${item.name} removed.`);
      list.reload();
    } catch (e) {
      toast(e.message);
    }
  }

  return (
    <div className="marea">
      <Strip title="Medicines & Supplies" sub={sum ? `${sum.total} items · ${sum.low} low · ${sum.out} out of stock` : 'Inventory'} bg={STRIP.stock} />
      <BackButton to="/" label="Home" />
      {canEdit && <StockForm onSaved={list.reload} />}
      <datalist id="stock-names">{items.map((i) => <option key={i.id} value={i.name} />)}</datalist>
      <div className="panel">
        <div className="ph">
          <h3>Inventory</h3>
          <div className="ph-r">
            <div className="chips">
              {[['', 'All'], ['low', 'Low'], ['out', 'Out']].map(([k, l]) => (
                <button key={k} type="button" className={`chip ${status === k ? 'on' : ''}`} onClick={() => setStatus(k)}>{l}</button>
              ))}
            </div>
            <AccessTag edit={canEdit} />
          </div>
        </div>
        <SearchBox value={q} onChange={setQ} placeholder="Search medicines, oils, supplies…" icon="stock" />
        <div style={{ overflowX: 'auto', paddingTop: 4 }}>
          <table className="tbl">
            <thead><tr><th>Item</th><th>Category</th><th>Quantity</th><th>Status</th>{canEdit && <th />}</tr></thead>
            <tbody>
              <TableState loading={list.loading && !list.data} error={list.error} onRetry={list.reload} cols={5}
                empty={!items.length} emptyText={q || status ? 'No matching items.' : 'No items in stock yet.'} />
              {items.map((i) => (
                <tr key={i.id}>
                  <td><span className="pname">{i.name}</span>{i.updatedByName && <><br /><span className="psub">Updated by {i.updatedByName}</span></>}</td>
                  <td>{i.category || '—'}</td>
                  <td>
                    {editing?.id === i.id ? (
                      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <input className="qty-in" type="number" min="0" step="any" autoFocus value={editing.qty}
                          onChange={(e) => setEditing({ ...editing, qty: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveQty(i); if (e.key === 'Escape') setEditing(null); }} />
                        <button type="button" className="btn-sm pri" onClick={() => saveQty(i)}>Save</button>
                        <button type="button" className="btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                      </span>
                    ) : <><strong style={{ color: 'var(--txt)' }}>{i.quantity}</strong> {i.unit}</>}
                  </td>
                  <td><span className={`stock-${i.stockStatus}`}>{STATUS_LABEL[i.stockStatus]}</span></td>
                  {canEdit && (
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {editing?.id !== i.id && <button type="button" className="btn-sm" onClick={() => setEditing({ id: i.id, qty: i.quantity })}>Update</button>}{' '}
                      <button type="button" className="btn-sm danger" onClick={() => remove(i)}>Remove</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
