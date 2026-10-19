const HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store, max-age=0" };
const BANKS = [
  ["bca","BCA"],["bri","BRI"],["bni","BNI"],["mandiri","Mandiri"],["btn","BTN"],["cimb","CIMB Niaga"],["danamon","Danamon"],["permata","Permata Bank"],["ocbc","OCBC"],["panin","Panin Bank"],["mega","Bank Mega"],["bsi","Bank Syariah Indonesia"],["muamalat","Bank Muamalat"],["jago","Bank Jago"],["blu","blu by BCA Digital"],["neo","Bank Neo Commerce"],["seabank","SeaBank"],["maybank","Maybank"],["uob","UOB"],["dbs","DBS"],["hsbc","HSBC"],["citibank","Citibank"]
];
const WALLETS = [["dana","DANA"],["ovo","OVO"],["gopay","GoPay"],["shopeepay","ShopeePay"],["linkaja","LinkAja"]];
export async function onRequestGet() {
  return new Response(JSON.stringify({ ok: true, banks: BANKS.map(([code,name])=>({code,name})), ewallets: WALLETS.map(([code,name])=>({code,name})) }), { headers: HEADERS });
}
