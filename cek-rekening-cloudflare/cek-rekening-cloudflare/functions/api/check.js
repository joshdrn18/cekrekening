const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store, max-age=0",
  "x-content-type-options": "nosniff"
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

// Legacy community endpoint referenced by public examples. It may be unavailable;
// do not treat any result as guaranteed until verified against a real test account.
const API_URL = "https://cekrek.heirro.dev/api/check";
const ALLOWED_CODES = new Set([
  "bca","bri","bni","mandiri","btn","cimb","danamon","permata","ocbc","panin","mega","bsi","muamalat","jago","blu","neo","seabank","maybank","uob","dbs","hsbc","citibank","bjb","bpd_bali","bpd_jateng","bpd_jatim","bpd_dki","bpd_sumut","bpd_sumsel","bpd_kaltim","bpd_kalbar","bpd_kalsel","bpd_sulselbar","bpd_sulut","bpd_ntb","bpd_ntt","bpd_papua","bpd_aceh","bpd_bengkulu","bpd_lampung","bpd_riau","bpd_jambi","bpd_maluku","bpd_sultra","bpd_sulteng","bpd_sumbar","bpd_banten","bpd_kalteng","bpd_kaltara",
  "ovo","dana","linkaja","gopay","shopeepay"
]);
const WALLET_CODES = new Set(["ovo", "dana", "linkaja", "gopay", "shopeepay"]);

export async function onRequestPost({ request }) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json"))
    return json({ ok: false, error: "Content-Type harus application/json." }, 415);

  let body;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return json({ ok: false, error: "Request terlalu besar." }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "Format JSON tidak valid." }, 400);
  }

  const institution = String(body?.institution ?? "").trim().toLowerCase();
  const accountNumber = String(body?.accountNumber ?? "").trim();
  const type = body?.type;
  if (!["bank", "ewallet"].includes(type)) return json({ ok: false, error: "Jenis rekening tidak valid." }, 400);
  if (!ALLOWED_CODES.has(institution)) return json({ ok: false, error: "Bank atau e-wallet belum didukung." }, 400);
  if (!/^\d{5,32}$/.test(accountNumber)) return json({ ok: false, error: "Masukkan nomor 5–32 digit tanpa spasi atau tanda baca." }, 400);
  if ((type === "ewallet") !== WALLET_CODES.has(institution))
    return json({ ok: false, error: "Jenis rekening tidak sesuai dengan institusi yang dipilih." }, 400);

  try {
    const form = new URLSearchParams({ accountBank: institution, accountNumber });
    const upstream = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", "accept": "application/json" },
      body: form.toString(),
      signal: AbortSignal.timeout(20000)
    });
    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      console.error("Community API HTTP status:", upstream.status);
      if (upstream.status === 429) return json({ ok: false, error: "Batas penggunaan API tercapai. Coba lagi nanti." }, 429);
      return json({ ok: false, error: "Provider komunitas menolak request (HTTP " + upstream.status + "). Endpoint mungkin sudah tidak aktif." }, 502);
    }
    const accountName = payload?.data?.[0]?.accountName ?? payload?.data?.accountName;
    if ((payload?.status !== 200 && payload?.status !== "200") || typeof accountName !== "string" || !accountName.trim()) {
      console.error("Community API response did not match expected schema.");
      return json({ ok: false, error: "Provider tidak mengembalikan nama rekening dengan format yang dikenali." }, 502);
    }
    return json({ ok: true, verified: true, accountName: accountName.trim(), institution, type, source: "community-api" });
  } catch (error) {
    console.error("Community API request failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ ok: false, error: "Provider tidak bisa dihubungi atau waktu permintaan habis. Coba lagi nanti." }, 502);
  }
}

export async function onRequestGet() {
  return json({ ok: false, error: "Gunakan POST untuk pengecekan." }, 405);
}
