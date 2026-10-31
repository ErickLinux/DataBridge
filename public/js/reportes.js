'use strict';
// DataBridge: consulta de reportes. Solo lectura; no ejecuta migraciones.
(() => {
  const $ = id => document.getElementById(id);
  const set = (id, value) => { if ($(id)) $(id).textContent = String(value); };
  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const date = value => { if (!value) return '--'; const d = new Date(value); return isNaN(d.getTime()) ? '--' : d.toLocaleString('es-GT'); };
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (!token) { location.href = '/login.html'; return; }

  let sessionReport = null;
  try { sessionReport = JSON.parse(sessionStorage.getItem('ultimoReporteValidacion') || 'null'); }
  catch (err) { console.warn('Reporte de sesión ilegible', err); }
  let selected = null;
  let history = [];

  const panel = document.createElement('section');
  panel.className = 'workspace-panel mb-4';
  panel.innerHTML = '<div class="panel-header"><div><span class="panel-eyebrow">CONSULTA</span><h2>Seleccionar reporte</h2></div></div><label class="form-label" for="selectorReporte">Origen de los resultados</label><select id="selectorReporte" class="form-select"><option value="">Cargando reportes...</option></select><p id="mensajeReportes" class="small text-secondary mt-2 mb-0"></p>';
  const main = document.querySelector('main');
  const summary = $('estadoReporte')?.closest('section');
  if (summary?.parentElement) summary.before(panel);
  else main?.prepend(panel);

  const selector = $('selectorReporte');
  const btnJSON = $('btnDescargarJSON');
  const btnPDF = $('btnDescargarPDF');
  const details = $('tablaInconsistencias');

  function empty(message) {
    selected = null;
    ['totalEvaluados','porcentajeIntegridad','registrosCorrectos','registrosInconsistentes','tablaCorrectos','tablaInconsistentes','tablaFaltantes','reporteOrigen','reporteDestino','reporteFecha'].forEach(id => set(id, '--'));
    set('estadoReporte', message);
    const bar = $('barraIntegridad');
    if (bar) { bar.style.width = '0%'; bar.textContent = '0%'; bar.parentElement?.setAttribute('aria-valuenow', '0'); }
    if (details) { details.replaceChildren(); const tr = details.insertRow(); const td = tr.insertCell(); td.colSpan = 3; td.className = 'text-center text-secondary py-4'; td.textContent = 'No hay resultados para mostrar.'; }
    if (btnJSON) btnJSON.disabled = true;
    if (btnPDF) btnPDF.disabled = true;
  }

  function normalizeSession(r) {
    if (!r?.resultado?.contentValidation) return null;
    return { source: 'session', date: r.fecha, origin: r.baseOrigen, destination: r.baseDestino, result: r.resultado, original: r };
  }
  function normalizeHistory(h) {
    let result = h.detalle_validacion;
    if (typeof result === 'string') { try { result = JSON.parse(result); } catch { result = null; } }
    if (!result || typeof result !== 'object') result = {};
    const content = result.contentValidation || {};
    result = { ...result, contentValidation: {
      ...content,
      totalCorrect: h.registros_correctos ?? content.totalCorrect,
      totalInconsistent: h.registros_inconsistentes ?? content.totalInconsistent,
      totalMissing: h.registros_faltantes ?? content.totalMissing,
      integrityPercentage: h.porcentaje_integridad ?? content.integrityPercentage
    }};
    return { source: 'history', date: h.fecha_validacion, origin: h.base_origen, destination: h.base_destino, result, original: h };
  }

  function render(r) {
    if (!r) return empty('No existe un reporte disponible.');
    selected = r;
    const c = r.result.contentValidation || {};
    const correct = num(c.totalCorrect), inconsistent = num(c.totalInconsistent), missing = num(c.totalMissing);
    const evaluated = num(c.totalVerified) || correct + inconsistent + missing;
    const percent = Math.max(0, Math.min(100, num(c.integrityPercentage)));
    set('totalEvaluados', evaluated.toLocaleString('es-GT'));
    set('porcentajeIntegridad', `${percent.toFixed(2)}%`);
    set('registrosCorrectos', correct.toLocaleString('es-GT'));
    set('registrosInconsistentes', inconsistent.toLocaleString('es-GT'));
    set('tablaCorrectos', correct.toLocaleString('es-GT'));
    set('tablaInconsistentes', inconsistent.toLocaleString('es-GT'));
    set('tablaFaltantes', missing.toLocaleString('es-GT'));
    set('reporteOrigen', r.origin || '--');
    set('reporteDestino', r.destination || '--');
    set('reporteFecha', date(r.date));
    set('estadoReporte', r.source === 'history' ? 'Reporte histórico almacenado en PostgreSQL.' : 'Última validación independiente disponible en esta sesión.');
    const bar = $('barraIntegridad');
    if (bar) { bar.style.width = `${percent}%`; bar.textContent = `${percent.toFixed(2)}%`; bar.parentElement?.setAttribute('aria-valuenow', String(percent)); }
    if (details) {
      details.replaceChildren();
      let count = 0;
      for (const table of (Array.isArray(c.results) ? c.results : [])) {
        for (const err of (Array.isArray(table.errors) ? table.errors : [])) {
          count++;
          const tr = details.insertRow();
          const key = typeof err.key === 'object' ? JSON.stringify(err.key) : String(err.key ?? '--');
          const desc = Array.isArray(err.differences) && err.differences.length
            ? `${err.type || 'Diferencia'}: ${err.differences.map(d => `${d.field || 'campo'} (${d.type || 'diferencia'})`).join(', ')}`
            : (err.type || err.message || 'Inconsistencia detectada');
          [table.table || table.collection || '--', key, desc].forEach(value => { tr.insertCell().textContent = value; });
        }
      }
      if (!count) {
        const tr = details.insertRow(); const td = tr.insertCell(); td.colSpan = 3; td.className = 'text-center text-secondary py-4';
        td.textContent = inconsistent || missing ? 'No hay detalles individuales disponibles para este reporte.' : 'No se detectaron inconsistencias.';
      }
    }
    if (btnJSON) btnJSON.disabled = false;
    if (btnPDF) btnPDF.disabled = false;
  }

  function addOption(value, label) { const option = document.createElement('option'); option.value = value; option.textContent = label; selector.appendChild(option); }
  function populate() {
    selector.replaceChildren();
    if (normalizeSession(sessionReport)) addOption('session', 'Última validación de esta sesión');
    history.forEach((h, i) => addOption(`history:${i}`, `${h.estado === 'VALIDACION_INDEPENDIENTE' ? 'Validación' : 'Histórico'} #${h.id} · ${date(h.fecha_validacion)} · ${h.base_origen || '--'} → ${h.base_destino || '--'}`));
    if (!selector.options.length) addOption('', 'No hay reportes disponibles');
    selector.disabled = !normalizeSession(sessionReport) && !history.length;
    selector.value = normalizeSession(sessionReport) ? 'session' : (history.length ? 'history:0' : '');
    choose();
  }
  function choose() {
    const value = selector.value;
    if (value === 'session') render(normalizeSession(sessionReport));
    else if (value.startsWith('history:')) render(normalizeHistory(history[Number(value.slice(8))]));
    else empty('No hay validaciones guardadas para consultar.');
  }
  selector.addEventListener('change', choose);

  btnJSON?.addEventListener('click', () => {
    if (!selected) return;
    const blob = new Blob([JSON.stringify(selected.original, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `DataBridge_reporte_${selected.source}_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  btnPDF?.addEventListener('click', () => { if (selected) window.print(); });

  populate();
  fetch('/api/historial', { headers: { Authorization: `Bearer ${token}` } })
    .then(async response => {
      if (response.status === 401 || response.status === 403) { location.href = '/login.html'; throw new Error('Sesión no autorizada'); }
      if (!response.ok) throw new Error('No se pudo consultar el historial');
      const json = await response.json();
      if (!json.success || !Array.isArray(json.data)) throw new Error(json.message || 'Respuesta de historial inválida');
      history = json.data.filter(h => h.fecha_validacion && (h.detalle_validacion != null || h.porcentaje_integridad != null));
      populate();
      set('mensajeReportes', history.length ? `${history.length} reporte(s) histórico(s) disponibles.` : 'Aún no hay validaciones almacenadas en el historial de PostgreSQL.');
    })
    .catch(error => { console.error('Error al consultar reportes históricos:', error); set('mensajeReportes', 'No se pudo consultar el historial. El reporte de sesión sigue disponible.'); });
})();
