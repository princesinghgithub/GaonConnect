# Saathi Module

Written for: backend developers new to this repo.

GaonConnect Saathi Portal (`gaonconnect-saathi-portal`, React + Vite) ka poora backend **isi folder mein** hai.

**Sabse zaruri baat:** Saathi ka koi bhi kaam karne ke liye aapko is folder ke bahar kuch nahi badalna. Ride, driver, customer, admin — kisi ka code chhedne ki zarurat nahi.

---

## Saathi hai kaun

Gaon ka village partner. Wo drivers aur customers ko GaonConnect se jodta hai, aur jab unki **pehli ride complete** hoti hai tab use incentive milta hai.

Ye `agent` se alag hai — repo mein `controllers/agentController.js` ka matlab **AI chat agent (Gemini)** hai, Saathi nahi.

---

## Bahar ke code se kya rishta hai

Poore repo mein Saathi ke liye sirf **ek line** add ki gayi hai — `server.js` mein:

```js
require('./saathi').mount(app);
```

Bas. Koi shared model nahi badla, koi controller nahi chheda, `User` ka role enum waisa ka waisa hai.

Module in cheezon ko **sirf padhta** hai (kabhi likhta nahi):

| Kya | Kyun |
|---|---|
| `models/User` | referred bande ka naam/phone |
| `models/Provider` | driver ki KYC approve hui ya nahi |
| `models/Vehicle` | driver ki gaadi ka type |
| `models/Ride` | pehli ride complete hui ya nahi |
| `utils/sendOTP` | login OTP (MSG91) |
| `middleware/auth` | admin routes ke liye `protect` + `admin` |
| `config/redis` | refresh token storage |

---

## Crash kabhi na ho — iske teen layer

1. **Mount safe hai.** [`index.js`](index.js) ka `mount()` andar se try/catch hai. Is module mein syntax error ho, model missing ho, kuch bhi — baaki GaonConnect API normal chalti hai, aur `/api/saathi/*` par 503 aata hai.
2. **Har route wrapped hai.** [`routes/index.js`](routes/index.js) ka har handler `asyncHandler` se guzarta hai. Iske bina ek bhi rejected promise `unhandledRejection` ban jaata, aur `server.js` us par poora process band kar deta hai.
3. **Module ka apna error handler hai.** Router ke aakhir mein apna 404 aur error handler hai, isliye Saathi ki koi error main app ke global handler tak jaati hi nahi.

Cron job bhi `runSafely()` ke andar hai — wo kabhi throw nahi karta.

---

## Data kaise aata hai (sabse important hissa)

**Ride complete hone par koi hook nahi lagaya gaya.** `rideController` bilkul waisa hi hai jaisa pehle tha.

Iski jagah do cheezein hain:

### 1. App signup ke baad `claim` call

Driver/User app signup ke turant baad ye call karti hai:

```
POST /api/saathi/public/claim
{ "code": "MAU001", "phone": "9876543210", "type": "driver" }
```

Idempotent hai — dobara call karne par duplicate nahi banta. Ek banda sirf ek Saathi ka ho sakta hai (DB unique index se), pehle aane wala jeetata hai.

### 2. Reward cron (har 15 min)

[`jobs/rewardJob.js`](jobs/rewardJob.js) → [`services/rewards.js`](services/rewards.js)

Pending referrals dekhta hai, un bandon ki pehli **completed** ride dhoondta hai, aur `SaathiEarning` bana deta hai (status `pending`). Admin approve kare tab wo withdraw ho sakti hai.

Isse reward turant nahi banta — 15 minute lag sakte hain. Incentive ke liye ye bilkul theek hai, aur badle mein ride flow ka code chhedna nahi padta.

Manual chalana ho to: `POST /api/saathi/admin/run-rewards` (admin token).

---

## Auth — driver/customer se bilkul alag

Saathi ka apna token hai. `JWT_SECRET` same hai, par:

- Saathi token mein `typ: 'saathi'` claim hai. `saathiProtect` iske bina token nahi maanta.
- Saathi ki id `Saathi` collection ki hai, `User` ki nahi — isliye main app ka `protect` Saathi token par 401 deta hai.
- Refresh token Redis mein `saathi_refresh:` prefix par hai.

Matlab: **driver ka token portal par nahi chalega, aur Saathi ka token driver API par nahi chalega.** Dono taraf se.

Naya Saathi `pending` banta hai — login ho jaata hai (apna status aur profile dekh sakta hai), par dashboard/referral/earnings/withdraw admin approve karne ke baad hi khulte hain (`saathiActive` middleware).

---

## Paisa kaise track hota hai

`SaathiEarning` ek **ledger** hai — har reward ek row. **Balance kahin store nahi hota**, hamesha ledger se jodkar nikalta hai (`services/rewards.js` → `getBalance`).

Isiliye "wallet aur history match nahi kar rahe" wali classic bug ho hi nahi sakti. Balance badalna ho to ledger mein row daalo, kisi counter ko mat chhedo.

Status flow: `pending` → `approved` (admin) → `paid` (withdrawal process hone par).

Double-reward se bachne ke liye `SaathiEarning` par unique index hai: `(saathi, type, referral)`.

---

## API

Base: `/api/saathi`

### Public — koi token nahi (driver/user app ke liye)
| Method | Path | Kaam |
|---|---|---|
| GET | `/public/verify-code?code=MAU001` | code valid hai ya nahi + Saathi ka naam |
| POST | `/public/claim` | signup ke baad referral jodo |

### Auth — portal login
| Method | Path | Kaam |
|---|---|---|
| POST | `/auth/send-otp` | `{ phone }` → OTP + `isRegistered` |
| POST | `/auth/verify-otp` | `{ phone, otp, name?, village?, ... }` → login/register |
| POST | `/auth/refresh` | `{ refreshToken }` → naya access token |
| POST | `/auth/logout` | `{ refreshToken }` |
| POST | `/auth/logout-all` | sab devices |
| GET | `/auth/me` | current Saathi |

### Portal — Saathi token chahiye
| Method | Path | Portal screen |
|---|---|---|
| GET | `/dashboard` | Dashboard (stats + goal + recent activity) |
| GET | `/referral` | Referral & QR (code + dono links) |
| GET | `/network/drivers` | Drivers Added |
| GET | `/network/customers` | Customers Added |
| GET | `/network/bookings` | Bookings |
| GET | `/earnings` | Earnings (summary + ledger) |
| GET | `/withdrawals` | Withdraw (balance + history) |
| POST | `/withdrawals` | withdrawal request |
| GET / PUT | `/profile` | Profile |
| PUT | `/profile/payout` | UPI / bank details |

Sab list endpoints par `?page=&limit=` chalta hai.

### Admin — main app ka admin token (`protect` + `admin`)
| Method | Path | Kaam |
|---|---|---|
| GET | `/admin/list` | Saathi list (`?status=&search=`) |
| GET | `/admin/:id` | ek Saathi + stats + balance |
| PATCH | `/admin/:id/status` | `{ status: 'active' }` — **approve yahin hota hai** |
| GET | `/admin/earnings` | `?status=pending` |
| PATCH | `/admin/earnings/:id` | `{ action: 'approve' \| 'reject' }` |
| GET | `/admin/withdrawals` | payout queue |
| PATCH | `/admin/withdrawals/:id` | `{ action: 'approve' \| 'paid' \| 'reject', utr? }` |
| POST | `/admin/run-rewards` | reward sweep abhi chalao |

---

## Models

| Model | Collection | Kaam |
|---|---|---|
| `Saathi` | `saathis` | Saathi ki pehchaan, area, code, payout details |
| `SaathiReferral` | `saathireferrals` | ek refer kiya banda = ek row |
| `SaathiEarning` | `saathiearnings` | paise ka ledger |
| `SaathiWithdrawal` | `saathiwithdrawals` | payout requests |

`Withdrawal` (driver wala) se alag model hai — dono ka approval flow alag hai, isliye milane se dono side confuse hoti.

---

## Config

Sab kuch [`config/incentives.js`](config/incentives.js) mein, `.env` se override ho sakta hai:

```bash
SAATHI_REWARD_DRIVER=100          # driver activation par
SAATHI_REWARD_CUSTOMER=30         # customer ki pehli booking par
SAATHI_MIN_WITHDRAWAL=200
SAATHI_MAX_WITHDRAWAL=25000
SAATHI_MILESTONE_10=200
SAATHI_MILESTONE_25=500
SAATHI_MONTHLY_GOAL=25
SAATHI_DRIVER_LINK=https://gaonconnect.in/driver
SAATHI_CUSTOMER_LINK=https://gaonconnect.in/book
SAATHI_REWARD_CRON=*/15 * * * *
SAATHI_REWARDS_ENABLED=true       # false = cron band
SAATHI_MODULE_ENABLED=true        # false = poora module band
```

Kuch bhi set na ho to defaults chal jaate hain — module bina `.env` badle chalu ho jaata hai.

---

## Pehla Saathi kaise banayein

1. Portal par phone daalo → OTP → naam/gaon bharo. Account `pending` ban jaayega.
2. Admin token se approve karo:
   ```bash
   curl -X PATCH https://<api>/api/saathi/admin/<saathiId>/status \
     -H "Authorization: Bearer <ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"status":"active"}'
   ```
3. Ab uska referral code chalu hai.

---

## Kuch kaam karna ho to kahan dekhein

| Kaam | File |
|---|---|
| Reward ka amount badalna | `config/incentives.js` |
| Naya reward type jodna | `models/SaathiEarning.js` enum + `services/rewards.js` |
| Referral kaise judta hai | `services/attribution.js` |
| Reward kab banta hai | `services/rewards.js` |
| Naya endpoint | `routes/index.js` + koi controller |
| Login/token | `controllers/authController.js`, `utils/saathiToken.js` |
| Module band karna | `.env` mein `SAATHI_MODULE_ENABLED=false` |

---

## Frontend ke liye do baatein

- **QR backend nahi banata.** `/referral` se `driverLink` aur `customerLink` milte hain — portal `qrcode.react` jaisi library se QR banaye. Isse backend mein extra dependency add nahi karni padti.
- **CORS**: portal ka origin `.env` ke `ALLOWED_ORIGINS` mein add karna hoga, warna production mein browser block kar dega.
