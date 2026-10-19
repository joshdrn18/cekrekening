# CekRekening — Cloudflare Pages

Project statis + Cloudflare Pages Functions.

## Deploy
- Root directory: `cek-rekening-cloudflare` (only if the repository contains this folder at its top level)
- Build command: `exit 0`
- Build output directory: `public`
- Commit to the production branch (`main`) to trigger deployment.

## API status warning
The backend currently tries the legacy community endpoint `https://cekrek.heirro.dev/api/check`, based on public examples. This endpoint is not guaranteed to be online or to support all institutions. A 502 response means the provider could not return a usable result. Do not represent a result as verified unless the provider returns a valid account name.

No Moota token or API key is required for this experimental community endpoint. Never put private API credentials in frontend files.
