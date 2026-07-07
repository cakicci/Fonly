# Fonly — Production'a Çıkış Rehberi

Hosting kararı verilmediği için iki yol da belgelendi. **Öneri: VPS** — alarm
interval'ı (instrumentation) doğrudan çalışır, in-memory rate limit etkili olur,
PostgreSQL aynı makinede barınır.

## 0. Ön koşullar (hosting'den bağımsız)

- [ ] Alan adı alındı (örn. `fonly.com.tr`) ve DNS yönetimi erişilebilir.
- [ ] `data/legal.ts` içindeki `[ŞİRKET UNVANI]`, `[ADRES]`, `[E-POSTA]`
      yer tutucuları dolduruldu; metinler avukata inceletildi.
- [ ] Google OAuth istemcisi oluşturuldu (redirect URI:
      `https://ALAN-ADIN/api/auth/callback/google`) → `AUTH_GOOGLE_ID/SECRET`.
- [ ] Resend'de alan adı doğrulandı → `RESEND_API_KEY` + `MAIL_FROM`.
- [ ] iyzico gerçek mağaza başvurusu yapıldı (sandbox'ta akış test edildikten
      sonra) → aşağıdaki iyzico bölümü.
- [ ] sentry.io projesi açıldı → `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN`.

## 1. Zorunlu env değişkenleri (prod değerleriyle)

| Değişken | Prod değeri |
|---|---|
| `DATABASE_URL` | Prod PostgreSQL bağlantısı |
| `AUTH_SECRET` | `openssl rand -base64 32` ile YENİ üret (dev'dekini kullanma) |
| `APP_URL` | `https://ALAN-ADIN` — sitemap/OG/mail linkleri buradan üretilir |
| `PAYMENT_PROVIDER` | `iyzico` (`dev` prod'da kapalıdır) |
| `IYZICO_*` | Aşağıdaki iyzico bölümüne bak |
| `CRON_SECRET` | Rastgele üret — alarm cron'u için |
| `RESEND_API_KEY`, `MAIL_FROM` | Resend panelinden |
| `AUTH_GOOGLE_ID/SECRET` | Google Cloud Console |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Sentry panelinden |

## 2. iyzico kurulumu

1. Sandbox: <https://sandbox-merchant.iyzipay.com> hesabı aç → API anahtarlarını
   `.env`'e koy (`IYZICO_BASE_URL` varsayılanı zaten sandbox).
2. Panelde **Abonelik → Ürün** oluştur ("FonlyPro"), altına iki **Ödeme Planı**
   ekle: aylık 99 TL, yıllık 990 TL (`lib/billing/plans.ts` ile eşleşmeli).
   Referans kodlarını `IYZICO_PLAN_REF_MONTHLY/YEARLY`'ye yaz.
3. Panelde webhook URL'ini kaydet: `https://ALAN-ADIN/api/webhooks/iyzico`
   (sandbox testinde tünel gerekir: `cloudflared tunnel` veya ngrok).
4. `PAYMENT_PROVIDER=iyzico` yap, sandbox kartıyla uçtan uca test et:
   Premium → plan seç → iyzico formu → başarılı ödeme → `/dashboard?upgraded=1`
   → `Subscription` satırı `active`. İptali de test et (Hesabım → Abonelik).
5. Gerçek mağaza onayı gelince: `IYZICO_BASE_URL=https://api.iyzipay.com` +
   prod anahtarları.
6. **Bilinen eksik:** iyzico müşteri nesnesi TCKN + fatura adresi istiyor;
   şu an placeholder gönderiliyor (`lib/billing/providers/iyzico.ts`).
   Prod öncesi iyzico temsilcisiyle teyit edin; gerekirse checkout'a fatura
   bilgisi adımı eklenmeli.

## 3A. Yol 1 — VPS (önerilen)

Hetzner CX22 / DigitalOcean benzeri, Ubuntu 24.04:

```bash
# PostgreSQL + Node 20+ + nginx + certbot kur
apt install postgresql nginx certbot python3-certbot-nginx
# Node: nvm veya NodeSource ile 20 LTS

# Uygulama
git clone <repo> /srv/fonly && cd /srv/fonly
cp .env.example .env   # prod değerleriyle doldur
npm ci
npx prisma db push     # şemayı prod DB'ye uygula
npm run build

# Süreç yöneticisi (PM2)
npm i -g pm2
pm2 start npm --name fonly -- start
pm2 save && pm2 startup   # reboot'ta otomatik başlasın
```

nginx reverse proxy (3000 → 443) + `certbot --nginx` ile TLS.

- Alarm kontrolü: `next start` uzun ömürlü olduğundan instrumentation
  interval'ı otomatik çalışır — ek cron gerekmez. (İstenirse yedek:
  `*/5 * * * * curl -s "https://ALAN-ADIN/api/cron/alerts?secret=$CRON_SECRET"`)
- DB yedeği: `pg_dump` ile günlük cron + offsite kopya.

## 3B. Yol 2 — Vercel

- DB: Neon/Supabase gibi yönetilen PostgreSQL → `DATABASE_URL`.
- **Alarm interval'ı çalışmaz** (serverless) → `vercel.json`'a cron ekle:
  ```json
  { "crons": [{ "path": "/api/cron/alerts", "schedule": "*/5 * * * *" }] }
  ```
  (Vercel cron istekleri `Authorization: Bearer $CRON_SECRET` başlığını
  otomatik ekler — env'de `CRON_SECRET` tanımlıysa.)
- **Rate limit in-memory** → çok instance'ta etkisiz. Yayın büyürse
  `lib/rate-limit.ts`'i Upstash Redis'e taşı (arayüz aynı kalabilir).
- `/api/bist` ilk çağrısı ~10 sn — Vercel function timeout'unu (varsayılan 10s)
  60s'e çıkar (Pro gerektirir) veya batch boyutunu düşür.

## 4. Go-live kontrol listesi

- [ ] `npm run typecheck && npm run lint && npm test && npm run build` temiz
- [ ] `https://ALAN-ADIN/sitemap.xml` ve `/robots.txt` doğru domain'i gösteriyor
- [ ] Google Search Console'a sitemap gönderildi
- [ ] Kayıt → giriş → şifre sıfırlama maili → alarm maili uçtan uca test edildi
- [ ] iyzico sandbox akışı geçti; prod anahtarlarına geçildi
- [ ] Sentry'ye test hatası düştü (`/api/olmayan-route` vb.)
- [ ] Yasal sayfalardaki yer tutucular dolu
- [ ] DB yedek cron'u kuruldu (VPS ise)
