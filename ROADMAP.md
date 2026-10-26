# GaonConnect — Version Roadmap

> Last verified: 2026-08-21, backend + user app + driver app ke code se cross-check karke.
> Pichhla version app-side kaam ko "pending" bata raha tha jo asal mein kab ka ho chuka tha
> (refresh token, FCM, SOS, rating, invoice) — ab yeh file sirf woh dikhati hai jo sach mein baaki hai.

---

## v1.0 — Core MVP ✅ DONE (backend + dono apps)

Phone OTP login, register, JWT auth, driver registration + approval flow,
online/offline toggle, live location, ride create/accept/reject, OTP se ride start,
cancel, ride history (customer + driver), fare estimate, wallet balance,
earnings report, profile, real-time socket events, admin dashboard,
scheduled rides, tractor/JCB hourly booking, document upload.

---

## v1.1 — Security + Stability ✅ DONE (backend + dono apps)

| Feature | Backend | User App | Driver App |
|---|---|---|---|
| Refresh token (15 min access + 60 din refresh) | ✅ | ✅ `services/api.ts` | ✅ `lib/apiClient.ts` |
| Token rotation + role preservation | ✅ | ✅ | ✅ |
| Auto logout on refresh fail | ✅ | ✅ | ✅ |
| Logout / logout-all | ✅ | ✅ | ✅ |
| Redis OTP store + brute-force + cooldown | ✅ | — | — |
| Joi input validation | ✅ | — | — |
| Health check | ✅ | — | — |
| Offline / network error handling | — | ✅ `OfflineBanner` | ✅ `OfflineBanner` |

---

## v2.0 — Full Ride Experience ✅ DONE (backend + dono apps)

| Feature | Backend | User App | Driver App |
|---|---|---|---|
| Push notifications (FCM) | ✅ | ✅ | ✅ |
| Rating (dono taraf) + pending ratings | ✅ | ✅ | ✅ |
| SOS emergency | ✅ | ✅ live-tracking | ✅ active-ride |
| Promo codes | ✅ | ✅ offers + confirm-booking | — |
| Invoice / receipt | ✅ | ✅ invoice screen | — |
| Trip sharing (WhatsApp/SMS) | — | ✅ live-tracking | — |
| Saved addresses (Home/Work/recent) | — | ✅ location-search | — |

---

## v2.1 — Payments 🔶 ZYADATAR DONE

| Feature | Status | Note |
|---|---|---|
| Razorpay online payment | ✅ | order + verify + webhook signature check |
| UPI / QR code payment | ✅ | `/ride/payment/qr-code` — driver app mein wired |
| Withdrawal request | ✅ | driver wallet screen |
| Bank details | ✅ | driver wallet screen |
| Withdrawal process (admin) | ✅ | |
| **Wallet top-up** | ❌ | **Backend endpoint hi nahi hai.** User wallet mein paisa daal nahi sakta — balance sirf padha ja sakta hai. `POST /api/wallet/topup` banana hai |
| **Driver earnings graph** | ❌ | `/provider/earnings/weekly` ready hai, app mein sirf numbers dikhte hain, chart nahi |

---

## v3.0 — Advanced 🔶 PARTIAL

| Feature | Backend | Apps | Note |
|---|---|---|---|
| **Surge pricing** | ✅ | ❌ | `/ride/surge-status` + admin settings ready hain, **kisi app mein use nahi hote** — user ko kabhi pata hi nahi chalta ki surge lagi hai |
| **Dynamic vehicle types** | ✅ | ❌ | `/ride/vehicle-types` admin-manageable hai, par user app `home.tsx` mein list **hardcoded** hai — admin naya vehicle add kare toh app mein dikhta hi nahi |
| **Driver rating summary** | ✅ | ❌ | `/rating/provider/:id` hai, customer ko driver ki rating dikhti nahi |
| **In-app chat (customer ↔ driver)** | ❌ | ❌ | Rapido/Uber pe daily use hota hai. `/api/agent` wala chat Gemini ops-assistant hai, yeh nahi |
| Referral / refer & earn | ❌ | ❌ | `PromoCode` model mein zikr hai, system nahi |
| Multi-stop rides | ❌ | ❌ | |
| Favourite drivers | ❌ | ❌ | |
| Cashback | ❌ | ❌ | |
| Driver subscription plans | ❌ | ❌ | |

---

## v3.1 — Rural Focus 🌾 (future)

Crop calendar, mandi connect, village geofencing, offline booking queue,
Hindi voice search, seasonal service suggestions.

Abhi dono apps mein **Hindi + English** hain. Goa/rural ke liye Konkani/Marathi add karna baaki hai.

---

## v4.0 — Scale & Analytics 📊 (future)

AI route optimization, ML demand forecasting, fake-GPS fraud detection,
multi-city rate cards.

---

## Infra / tech debt

| Item | Status |
|---|---|
| Nominatim rate-limit protection (Redis cache + 1 req/sec throttle) | ✅ `utils/nominatim.js` |
| `/location/*` pe auth + rate limit | ✅ |
| OTA updates (expo-updates) dono apps mein | ✅ |
| `adminController.js` — 5035 lines, ~1700 commented-out | ❌ cleanup baaki |
| `providerController.js` — 2145 lines, ~1100 commented-out | ❌ cleanup baaki |
| Automated tests | ❌ kahin nahi hain |
| Google Maps API key restriction (Cloud Console) | ⚠️ manual step |

---

## Ab kya karna hai — priority order

```
1. Wallet top-up            — user paisa daal hi nahi sakta, v2.1 adhoora hai
2. Dynamic vehicle types    — backend ready, app hardcoded (chhota kaam, bada fayda)
3. Surge app mein dikhao    — backend ready, sirf UI chahiye
4. In-app chat              — Rapido/Uber parity ka sabse bada gap
5. Driver rating dikhao     — backend ready
6. Referral system          — growth ke liye
7. Controller cleanup + tests
```
