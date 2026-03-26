const MESES = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mmm = MESES[d.getUTCMonth()];
  const aa = String(d.getUTCFullYear()).slice(-2);
  return `${dd}/${mmm}/${aa}`;
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mmm = MESES[d.getMonth()];
  const aa = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mmm}/${aa} ${hh}:${min}`;
}

// Build folio prefix from a date: DDMMMAA
export function folioPrefix(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mmm = MESES[d.getUTCMonth()];
  const aa = String(d.getUTCFullYear()).slice(-2);
  return `${dd}${mmm}${aa}`;
}