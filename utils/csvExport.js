// CSV export helpers — admin dashboard ke Drivers / Users / Bookings export ke liye.
// Mongo ke nested documents seedhe CSV mein daalne se columns tut jaate hain
// (nested object ke andar ke comma column separator ban jaata hai), isliye har
// export apne flat column set define karta hai aur value yahan se escape hoti hai.

// Excel ko batata hai ki file UTF-8 hai — warna Hindi naam (देवनागरी) mojibake ho jaate hain.
const BOM = '\uFEFF';

function formatDateTime(date) {
  // null/'' ko new Date() 1970 bana deta hai — khaali cell hi sahi hai
  if (date === null || date === undefined || date === '') return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  } catch (_) {
    return d.toISOString();
  }
}

function formatDate(date) {
  if (date === null || date === undefined || date === '') return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (_) {
    return d.toISOString().slice(0, 10);
  }
}

function escapeCell(value) {
  if (value === null || value === undefined) return '';

  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return formatDateTime(value);

  let str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  // Newlines Excel mein row tod dete hain
  str = str.replace(/\r?\n/g, ' ').trim();
  if (!str) return '';

  // CSV injection guard — sirf text pe (numbers upar hi return ho chuke hain),
  // taaki koi naam/address "=HYPERLINK(...)" formula ban ke na chale.
  if (/^[=+\-@\t]/.test(str)) str = `'${str}`;

  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// columns: [{ label, value: (row) => any }] — rows khaali ho tab bhi header aata hai
function buildCsv(columns, rows) {
  const lines = [columns.map((c) => escapeCell(c.label)).join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => {
      let v;
      try { v = c.value(row); } catch (_) { v = ''; }
      return escapeCell(v);
    }).join(','));
  }
  return BOM + lines.join('\r\n');
}

function sendCsv(res, filename, csv) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  return res.send(csv);
}

// "drivers" + filters → drivers_2026-08-18.csv
function timestampedName(prefix) {
  return `${prefix}_${new Date().toISOString().slice(0, 10)}.csv`;
}

module.exports = { buildCsv, sendCsv, formatDate, formatDateTime, timestampedName };
