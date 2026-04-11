function $(i) { return document.getElementById(i) } function
    show(id, t, tp = 'success') { const b = $(id); b.textContent = t; b.className = `msg ${tp}`; } let
        ALL = []; function fill(id, x) {
            $('edit-id').value = id; $('edit-nombre').value = x.nombre || '';
            $('edit-correo').value = x.correo || ''; $('edit-telefono').value = x.telefono || '';
            $('edit-interes').value = x.interes || ''; $('edit-mensaje').value = x.mensaje || '';
            $('edit-estado').value = x.estado || 'nuevo';
        } function render(items) {
            $('leads-body').innerHTML = items.map(x => `<tr><td>${x.nombre || ''}</td><td>
            ${x.correo || ''}</td><td>${x.interes || ''}</td><td>${x.estado || ''}
            </td><td><button onclick="editItem('${x.id}')">Ver</button></td></tr>`).join('') || '<tr><td colspan="5">Sin datos</td></tr>'; window.editItem = async (id) => { const d = await db.collection('leads').doc(id).get(); fill(id, d.data()) };
        } async function load() { const s = await db.collection('leads').get(); ALL = []; s.forEach(d => ALL.push({ id: d.id, ...d.data() })); render(ALL); } function apply() { let items = [...ALL]; const e = $('search-email').value.trim().toLowerCase(), st = $('status-filter').value; if (e) items = items.filter(x => String(x.correo || '').toLowerCase().includes(e)); if (st) items = items.filter(x => String(x.estado || '') === st); render(items); } async function update() { const id = $('edit-id').value; if (!id) return show('edit-message', 'Selecciona un lead', 'error'); await db.collection('leads').doc(id).update({ estado: $('edit-estado').value }); show('edit-message', 'Estado actualizado'); load(); } function exportCSV() {
            const rows = [['nombre', 'correo', 'telefono', 'interes', 'mensaje', 'estado']]; ALL.forEach(x => rows.push([x.nombre || '', x.correo || '', x.telefono || '', x.interes || '', x.mensaje || '', x.estado || ''])); const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url;a.download='leads.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);} window.addEventListener('DOMContentLoaded',()=>{load(); $('apply-filters-btn').onclick=apply; $('clear-filters-btn').onclick=()=>{$('search-email').value='';$('status-filter').value='';render(ALL)}; $('update-btn').onclick=update; $('export-btn').onclick=exportCSV;});
