const typeInput = document.querySelector("#type");
const institution = document.querySelector("#institution");
const accountInput = document.querySelector("#account-number");
const form = document.querySelector("#check-form");
const result = document.querySelector("#result");
const submitButton = document.querySelector("#submit-button");
const buttonLabel = document.querySelector("#button-label");
const institutionLabel = document.querySelector('label[for="institution"]');
const wallets = new Set(["dana", "gopay", "ovo", "shopeepay", "linkaja"]);
let liveInstitutions = [];

function setOptions(type) {
  institution.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = type === "bank" ? "Pilih bank" : "Pilih e-wallet";
  institution.append(placeholder);
  const list = liveInstitutions.filter(item => (item.type === "ewallet") === (type === "ewallet"));
  for (const item of list) {
    const option = document.createElement("option");
    option.value = item.code;
    option.textContent = item.name;
    institution.append(option);
  }
  institutionLabel.textContent = type === "bank" ? "Pilih bank" : "Pilih e-wallet";
  accountInput.placeholder = type === "bank" ? "Masukkan nomor rekening" : "Masukkan nomor HP / akun";
  accountInput.maxLength = type === "bank" ? 32 : 20;
  buttonLabel.textContent = type === "bank" ? "Cek nama rekening" : "Cek nama e-wallet";
}

document.querySelectorAll("[data-type]").forEach(button => {
  button.addEventListener("click", () => {
    const type = button.dataset.type;
    typeInput.value = type;
    document.querySelectorAll("[data-type]").forEach(item => {
      const active = item.dataset.type === type;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    setOptions(type);
    result.className = "result hidden";
  });
});

function showMessage(kind, title, message, meta = "") {
  result.className = `result ${kind}`;
  result.replaceChildren();
  const label = document.createElement("div");
  label.className = "result-label";
  label.textContent = title;
  const body = document.createElement("div");
  body.textContent = message;
  const detail = document.createElement("div");
  detail.className = "meta";
  detail.textContent = meta;
  result.append(label, body);
  if (meta) result.append(detail);
}

async function loadInstitutions() {
  try {
    const response = await fetch("/api/institutions");
    const data = await response.json();
    if (response.ok && data.ok && Array.isArray(data.banks)) {
      liveInstitutions = data.banks;
      setOptions(typeInput.value);
    }
  } catch {
    showMessage("error", "DAFTAR BELUM TERSEDIA", "Refresh halaman dan coba lagi.");
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const type = typeInput.value;
  const code = institution.value;
  const accountNumber = accountInput.value.trim();
  if (!code) return showMessage("error", "PILIH INSTITUSI", "Pilih bank atau e-wallet terlebih dahulu.");
  if (!/^\d{5,32}$/.test(accountNumber)) return showMessage("error", "FORMAT NOMOR TIDAK VALID", "Masukkan 5–32 digit angka tanpa spasi atau tanda baca.");
  submitButton.disabled = true;
  buttonLabel.textContent = "Memeriksa...";
  result.className = "result hidden";
  try {
    const response = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, institution: code, accountNumber })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      showMessage("error", "BELUM BISA DIVERIFIKASI", data.error || "Pengecekan gagal. Coba lagi nanti.");
    } else if (data.verified && data.accountName) {
      showMessage("success", "NAMA REKENING DITEMUKAN", data.accountName, `${institution.options[institution.selectedIndex]?.textContent || code} · Hasil dari API komunitas`);
    } else {
      showMessage("error", "REKENING TIDAK DITEMUKAN", "Provider tidak mengembalikan nama pemilik. Coba periksa nomor dan bank.");
    }
  } catch {
    showMessage("error", "KONEKSI BERMASALAH", "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.");
  } finally {
    submitButton.disabled = false;
    buttonLabel.textContent = typeInput.value === "bank" ? "Cek nama rekening" : "Cek nama e-wallet";
  }
});

document.querySelector("#year").textContent = new Date().getFullYear();
setOptions("bank");
loadInstitutions();
