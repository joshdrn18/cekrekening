const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store, max-age=0",
  "x-content-type-options": "nosniff"
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

// GGapi requires the key to be configured as a Cloudflare Pages Secret named GGAPI_API_KEY.
const BASE_URL = "https://use.ggapi.co.id/api";
const BANK_CODES = {
  bca:"014", bri:"002", bni:"009", mandiri:"008", btn:"200",
  cimb:"022", danamon:"011", permata:"013", ocbc:"028", panin:"019",
  mega:"426", bsi:"451", muamalat:"147", jago:"542", blu:"501",
  neo:"490", seabank:"535", maybank:"016", uob:"023", dbs:"046",
  hsbc:"041", citibank:"031"
};
const WALLET_CODES = {
  dana:"DANA", ovo:"OVO", gopay:"GOPAY", gopaydriver:"GOPAYDRIVER",
  linkaja:"LINKAJA", maxim:"MAXIM", shopeepay:"SHOPEEPAY"
};

export async function onRequestPost({ request, env }) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json"))
    return json({ ok:false, error:"Content-Type harus application/json." }, 415);
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return json({ ok:false, error:"Request terlalu besar." }, 413);
    body = JSON.parse(raw);
  } catch { return json({ ok:false, error:"Format JSON tidak valid." }, 400); }

  const type = String(body?.type ?? "");
  const institution = String(body?.institution ?? "").trim().toLowerCase();
  const accountNumber = String(body?.accountNumber ?? "").trim();
  if (!["bank", "ewallet"].includes(type)) return json({ ok:false, error:"Jenis rekening tidak valid." }, 400);
  if (!/^\d{5,32}$/.test(accountNumber)) return json({ ok:false, error:"Masukkan nomor 5–32 digit tanpa spasi atau tanda baca." }, 400);
  if (type === "bank" && !BANK_CODES[institution]) return json({ ok:false, error:"Bank belum didukung oleh integrasi ini." }, 400);
  if (type === "ewallet" && !WALLET_CODES[institution]) return json({ ok:false, error:"E-wallet belum didukung." }, 400);
  if (!env.GGAPI_API_KEY) return json({ ok:false, error:"API key belum dikonfigurasi di Cloudflare Pages Secrets." }, 500);

  const endpoint = type === "bank" ? "bank-verification/validate" : "ewallet-verification/validate";
  const code = type === "bank" ? BANK_CODES[institution] : WALLET_CODES[institution];
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("code", code);
  url.searchParams.set("account_number", accountNumber);
  try {
    const upstream = await fetch(url.toString(), {
      method:"GET",
      headers:{ "accept":"application/json", "x-ggapi-co-id":env.GGAPI_API_KEY },
      signal:AbortSignal.timeout(20000)
    });
    const payload = await upstream.json().catch(() => null);
    if (upstream.status === 401 || upstream.status === 403)
      return json({ ok:false, error:"API key GGapi tidak valid atau belum memiliki akses. Periksa dashboard GGapi." }, 502);
    if (upstream.status === 402)
      return json({ ok:false, error:"Kuota gratis atau saldo GGapi tidak mencukupi untuk permintaan ini. Jangan ulangi berkali-kali." }, 402);
    if (upstream.status === 429)
      return json({ ok:false, error:"Batas request GGapi tercapai. Coba lagi nanti." }, 429);
    if (!upstream.ok) {
      console.error("GGapi HTTP status:", upstream.status);
      return json({ ok:false, error:`GGapi sedang gagal memproses permintaan (HTTP ${upstream.status}).` }, 502);
    }
    if (!payload || typeof payload !== "object") return json({ ok:false, error:"Respons GGapi tidak terbaca." }, 502);
    const found = payload.found ?? payload.data?.found;
    const accountName = payload.account_name ?? payload.data?.account_name;
    if (found === false) return json({ ok:false, notFound:true, error:"Nama rekening tidak ditemukan. Periksa nomor dan pilihan bank/e-wallet." }, 200);
    if (found !== true || typeof accountName !== "string" || !accountName.trim()) {
      console.error("GGapi response schema mismatch");
      return json({ ok:false, error:"GGapi tidak mengembalikan nama pemilik yang bisa diverifikasi." }, 502);
    }
    return json({ ok:true, verified:true, accountName:accountName.trim(), institution, type, source:"GGapi" });
  } catch (error) {
    console.error("GGapi request failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ ok:false, error:"GGapi tidak bisa dihubungi atau waktu permintaan habis. Coba lagi nanti." }, 502);
  }
}
export async function onRequestGet() { return json({ ok:false, error:"Gunakan POST untuk pengecekan." }, 405); }
