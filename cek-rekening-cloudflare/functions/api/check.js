const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store, max-age=0",
  "x-content-type-options": "nosniff"
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

// Free community API. Availability and supported institutions are controlled by its operator.
const API_URL = "https://cekrekening-api.belibayar.online/api/v1/account-inquiry";
const ALLOWED_CODES = new Set([
  "harda","anz","aceh","aladin","amar","antardaerah","artha","bengkulu","daerah_istimewa","daerah_istimewa_syr",
  "btpn_syr","bukopin_syr","bumi_arta","capital","bca","ccb","cnb","danamon","dinar","dki","dki_syr","ganesha",
  "agris","ina_perdana","index_selindo","artos_syr","jambi","jambi_syr","jasa_jakarta","jawa_tengah","jawa_tengah_syr",
  "jawa_timur","jawa_timur_syr","kalimantan_barat","kalimantan_barat_syr","kalimantan_selatan","kalimantan_tengah",
  "kalimantan_timur_syr","kalimantan_timur","lampung","maluku","mandiri","mantap","maspion","mayapada","mayora","mega",
  "mega_syr","mestika_dharma","mizuho","mas","mutiara","sumatera_barat","sumatera_barat_syr","nusa_tenggara_barat",
  "nusa_tenggara_timur","nusantara_parahyangan","ocbc","ocbc_syr","america_na","boc","india","tokyo","papua","prima",
  "bri","riau_dan_kepri","sahabat_sampoerna","shinhan","sinarmas","sinarmas_syr","sulselbar","sulselbar_syr","sulawesi",
  "sulawesi_tenggara","sulut","sumsel_dan_babel","sumsel_dan_babel_syr","sumut","sumut_syr","resona_perdania",
  "victoria_internasional","victoria_syr","woori","bca_syr","bjb","bjb_syr","royal","bni","bnp_paribas","bali","banten",
  "eka","agroniaga","bsm","btn","btn_syr","tabungan_pensiunan_nasional","cimb","citibank","commonwealth","chinatrust",
  "dbs","hsbc","icbc","artos","hana","bii","bii_syr","mnc_internasional","muamalat","yudha_bakti","nationalnobu",
  "panin","panin_syr","permata","permata_syr","qnb_kesawan","rabobank","sbi_indonesia","kesejahteraan_ekonomi",
  "standard_chartered","super_bank","uob","bukopin","krom","ovo","dana","linkaja","gopay","shopeepay"
]);

export async function onRequestPost({ request }) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json"))
    return json({ ok: false, error: "Content-Type harus application/json." }, 415);
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return json({ ok: false, error: "Request terlalu besar." }, 413);
    body = JSON.parse(raw);
  } catch { return json({ ok: false, error: "Format JSON tidak valid." }, 400); }

  const institution = String(body?.institution ?? "").trim().toLowerCase();
  const accountNumber = String(body?.accountNumber ?? "").trim();
  const type = body?.type;
  if (!["bank", "ewallet"].includes(type)) return json({ ok: false, error: "Jenis rekening tidak valid." }, 400);
  if (!ALLOWED_CODES.has(institution)) return json({ ok: false, error: "Bank atau e-wallet belum didukung." }, 400);
  if (!/^\d{5,32}$/.test(accountNumber)) return json({ ok: false, error: "Masukkan nomor 5–32 digit tanpa spasi atau tanda baca." }, 400);
  const walletCodes = new Set(["ovo", "dana", "linkaja", "gopay", "shopeepay"]);
  if ((type === "ewallet") !== walletCodes.has(institution))
    return json({ ok: false, error: "Jenis rekening tidak sesuai dengan institusi yang dipilih." }, 400);

  try {
    const upstream = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "accept": "application/json" },
      body: JSON.stringify({ account_bank: institution, account_number: accountNumber }),
      signal: AbortSignal.timeout(15000)
    });
    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const upstreamMessage = typeof payload?.message === "string" ? payload.message : "";
      if (upstream.status === 429) return json({ ok: false, error: "Batas penggunaan API gratis tercapai. Coba lagi nanti." }, 429);
      if (upstream.status >= 500) return json({ ok: false, error: "Layanan API gratis sedang bermasalah. Coba lagi nanti." }, 502);
      return json({ ok: false, error: upstreamMessage || "Rekening tidak ditemukan atau belum didukung provider." }, 404);
    }
    const accountName = payload?.data?.account_holder;
    if (typeof accountName !== "string" || !accountName.trim())
      return json({ ok: false, error: "Provider tidak mengembalikan nama rekening yang valid." }, 502);
    return json({ ok: true, verified: true, accountName: accountName.trim(), institution, type, source: "community-api" });
  } catch {
    return json({ ok: false, error: "API gratis tidak bisa dihubungi atau waktu permintaan habis. Coba lagi nanti." }, 502);
  }
}

export async function onRequestGet() {
  return json({ ok: false, error: "Gunakan POST untuk pengecekan." }, 405);
}
