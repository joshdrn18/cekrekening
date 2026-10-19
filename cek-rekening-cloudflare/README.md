# Cek Rekening — Cloudflare Pages + API komunitas gratis

Website sederhana untuk mengecek nama pemilik rekening bank atau e-wallet Indonesia berdasarkan nomor tujuan. Frontend menggunakan HTML/CSS/JS dan backend memakai Cloudflare Pages Functions.

## Penting sebelum dipakai publik

- Backend memanggil API komunitas `https://cekrekening-api.belibayar.online/api/v1/account-inquiry` dengan `POST` body `account_bank` dan `account_number`.
- API komunitas diklaim gratis oleh proyek open-source, tetapi tidak memiliki jaminan uptime, akurasi, atau dukungan semua bank. API upstream dapat berubah atau berhenti kapan saja.
- Nama yang ditampilkan berasal dari respons provider. Website tidak menebak nama jika provider tidak mengembalikannya.
- Jangan gunakan hasil sebagai satu-satunya dasar transfer. Konfirmasi lagi nama penerima melalui aplikasi bank atau metode resmi.
- Nomor rekening dikirim ke provider upstream untuk diproses. Jangan klaim bahwa data tidak keluar ke pihak ketiga.
- Karena API gratis ini tidak memakai API key, backend ini tidak membutuhkan secret Moota atau API.co.id.
- Sebelum dipakai publik, tambahkan rate limiting di Cloudflare dan tinjau ketentuan penggunaan API upstream.

## Deploy ke Cloudflare Pages

1. Extract ZIP ini.
2. Upload isi folder ke repository GitHub.
3. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
4. Framework preset: `None`.
5. Build command: kosongkan (atau `exit 0` jika diwajibkan).
6. Build output directory: `public`.
7. Deploy. Folder `functions/` akan menyediakan `/api/check` dan `/api/institutions`.

Tidak perlu mengatur `API_CO_ID_KEY` atau `MOOTA_API_TOKEN` untuk versi ini.

## Endpoint internal

`GET /api/institutions` — daftar bank dan e-wallet yang ditampilkan di form.

`POST /api/check`
```json
{
  "type": "bank",
  "institution": "bca",
  "accountNumber": "1234567890"
}
```

Untuk e-wallet, gunakan `type: "ewallet"` dan kode seperti `dana`, `gopay`, `ovo`, `linkaja`, atau `shopeepay`.
