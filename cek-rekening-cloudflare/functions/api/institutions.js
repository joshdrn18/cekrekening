const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=3600",
  "x-content-type-options": "nosniff"
};
function json(data) { return new Response(JSON.stringify(data), { headers: HEADERS }); }
const banks = [
  ["aceh","Bank Aceh Syariah"],["aladin","Bank Aladin Syariah"],["anz","ANZ Indonesia"],["bali","BPD Bali"],
  ["bca","Bank Central Asia (BCA)"],["bca_syr","BCA Syariah"],["bjb","Bank BJB"],["bjb_syr","BJB Syariah"],
  ["bni","Bank Negara Indonesia (BNI)"],["bnp_paribas","BNP Paribas Indonesia"],["bri","Bank Rakyat Indonesia (BRI)"],
  ["bsm","Bank Syariah Indonesia (BSI)"],["btn","Bank Tabungan Negara (BTN)"],["btn_syr","BTN Syariah"],
  ["bukopin","KB Bank / Bukopin"],["cimb","CIMB Niaga"],["citibank","Citibank"],["danamon","Bank Danamon"],
  ["dbs","DBS Indonesia"],["dki","Bank DKI"],["hana","LINE Bank / KEB Hana"],["hsbc","HSBC Indonesia"],
  ["icbc","ICBC Indonesia"],["jawa_barat","Bank BJB"],["mandiri","Bank Mandiri"],["mas","Bank MAS"],
  ["mayapada","Bank Mayapada"],["mega","Bank Mega"],["muamalat","Bank Muamalat"],["nationalnobu","Nobu Bank"],
  ["ocbc","OCBC Indonesia"],["panin","Panin Bank"],["permata","PermataBank"],["royal","blu / BCA Digital"],
  ["kesejahteraan_ekonomi","SeaBank"],["sinarmas","Bank Sinarmas"],["uob","UOB Indonesia"],["krom","Krom Bank"],
  ["dana","DANA"],["gopay","GoPay"],["linkaja","LinkAja"],["ovo","OVO"],["shopeepay","ShopeePay"]
].map(([code,name]) => ({ code, name, type: ["dana","gopay","linkaja","ovo","shopeepay"].includes(code) ? "ewallet" : "bank" }));
export async function onRequestGet() { return json({ ok: true, banks }); }
