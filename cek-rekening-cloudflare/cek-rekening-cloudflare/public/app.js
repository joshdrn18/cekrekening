const $ = (s) => document.querySelector(s);
const form = $('#checkForm');
const institutionSelect = $('#institution');
const accountInput = $('#accountNumber');
const result = $('#result');
const submitButton = $('#submitButton');
let type = 'bank';
const lists = {
  bank: [
    ['bca','BCA'],['bri','BRI'],['bni','BNI'],['mandiri','Mandiri'],['btn','BTN'],['cimb','CIMB Niaga'],['danamon','Danamon'],['permata','Permata Bank'],['ocbc','OCBC'],['panin','Panin Bank'],['mega','Bank Mega'],['bsi','Bank Syariah Indonesia'],['muamalat','Bank Muamalat'],['jago','Bank Jago'],['blu','blu by BCA Digital'],['neo','Bank Neo Commerce'],['seabank','SeaBank'],['maybank','Maybank'],['uob','UOB'],['dbs','DBS'],['hsbc','HSBC'],['citibank','Citibank']
  ],
  ewallet: [['dana','DANA'],['ovo','OVO'],['gopay','GoPay'],['gopaydriver','GoPay Driver'],['shopeepay','ShopeePay'],['linkaja','LinkAja'],['maxim','Maxim']]
};
function populate() {
  institutionSelect.innerHTML = '';
  for (const [value, label] of lists[type]) {
    const option = document.createElement('option'); option.value = value; option.textContent = label; institutionSelect.append(option);
  }
  $('#kindLabel').textContent = type === 'bank' ? 'bank' : 'e-wallet';
  $('.submit span:first-child').textContent = type === 'bank' ? 'Cek nama rekening' : 'Cek nama e-wallet';
}
document.querySelectorAll('.segment').forEach(button => button.addEventListener('click', () => {
  type = button.dataset.type;
  document.querySelectorAll('.segment').forEach(b => b.classList.toggle('active', b === button));
  populate(); result.className = 'result hidden'; result.textContent = '';
}));
function showResult(kind, title, message, name) {
  result.className = `result ${kind}`;
  result.replaceChildren();
  const heading = document.createElement('div'); heading.className = 'result-title'; heading.textContent = title; result.append(heading);
  if (name) { const n = document.createElement('div'); n.className = 'account-name'; n.textContent = name; result.append(n); }
  const p = document.createElement('div'); p.textContent = message; result.append(p);
}
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const accountNumber = accountInput.value.trim();
  if (!/^\d{5,32}$/.test(accountNumber)) { showResult('error','NOMOR TIDAK VALID','Masukkan 5–32 digit angka tanpa spasi.'); return; }
  submitButton.disabled = true; submitButton.querySelector('span:first-child').textContent = 'Memeriksa…';
  result.className = 'result hidden';
  try {
    const response = await fetch('/api/check', { method:'POST', headers:{'content-type':'application/json','accept':'application/json'}, body:JSON.stringify({type,institution:institutionSelect.value,accountNumber}) });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) throw new Error(payload?.error || `Request gagal (HTTP ${response.status}).`);
    showResult('success','NAMA REKENING DITEMUKAN','Cocokkan kembali nama ini di aplikasi bank sebelum transfer.',payload.accountName);
  } catch (error) {
    showResult('error','BELUM BISA DIVERIFIKASI',error instanceof Error ? error.message : 'Provider sedang tidak tersedia. Coba lagi nanti.');
  } finally {
    submitButton.disabled = false; submitButton.querySelector('span:first-child').textContent = type === 'bank' ? 'Cek nama rekening' : 'Cek nama e-wallet';
  }
});
populate();
