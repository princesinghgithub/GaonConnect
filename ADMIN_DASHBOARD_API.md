# GaonConnect Admin Dashboard — API Integration Guide

Yeh doc tumhare admin dashboard frontend (screenshot wala) ko backend se connect karne ke liye hai.
Sab `/api/admin/*` aur `/api/sos/*` routes **admin JWT token** maangte hain.

## 0. Setup

```
Base URL: http://localhost:5000/api   (ya jo bhi tumhara deployed backend URL hai)
Header (har admin request mein): Authorization: Bearer <admin_access_token>
```

**Admin login** (normal OTP flow, role='admin' wale user ke liye):
```
POST /api/auth/send-otp     { phone }
POST /api/auth/verify-otp   { phone, otp }   → { accessToken, refreshToken, user }
```
Header ka "Prince Patel" naam → `user.name` (login response ya `GET /api/auth/profile`)

---

## 1. DASHBOARD HOME PAGE (current screenshot)

### 1.1 Top 4 Stat Cards + Service-wise Bookings + Live Bookings Table
**`GET /api/admin/dashboard/overview`** — single call, sab kuch deta hai.

```json
{
  "success": true,
  "data": {
    "stats": {
      "todayBookings": 47,
      "activeBookings": 12,
      "pendingBookings": 5,
      "activeDrivers": 14,
      "todayRevenue": 8240,
      "yesterdayRevenue": 7040,
      "averageRating": 4.7
    },
    "serviceWiseBookings": {
      "auto_cab": 18,
      "tractor": 11,
      "goods": 8,
      "jcb": 5,
      "ambulance": 3,
      "wedding": 2
    },
    "liveBookings": [
      { "id": "665f...", "service": "Tractor",   "customer": "Ramesh Kisan", "driver": "Suresh D.", "status": "active" },
      { "id": "665f...", "service": "Auto",      "customer": "Savita Ji",    "driver": "Mohan L.",  "status": "active" },
      { "id": "665f...", "service": "Ambulance", "customer": "Raju Family",  "driver": "Dinesh A.", "status": "urgent" },
      { "id": "665f...", "service": "JCB",       "customer": "Panchayat",    "driver": "Pending",   "status": "wait" },
      { "id": "665f...", "service": "Goods",     "customer": "Dhruv Vyapar", "driver": "Vijay K.",  "status": "done" }
    ]
  }
}
```

#### Field mapping → UI

| UI Element | Field |
|---|---|
| "आज की बुकिंग" big number (47) | `stats.todayBookings` |
| "↑ N अभी active" subtitle | `stats.activeBookings` |
| "Active Drivers" (14) | `stats.activeDrivers` |
| "आज की कमाई" (₹8,240) | `stats.todayRevenue` |
| "↑ कल से ₹X ज्यादा" subtitle | frontend calc: `stats.todayRevenue - stats.yesterdayRevenue` (agar negative ho to "↓ kam" dikhao) |
| "Average Rating" (4.7) | `stats.averageRating` |
| "↑ इस हफ्ते बेहतर" subtitle | ⚠️ **abhi backend mein nahi hai** (week-over-week rating trend) — agar chahiye to bata dena, `Rating` model se ban sakta hai |
| Service-wise Bookings cards (Auto/Cab, Tractor, Goods, JCB, Ambulance, Wedding) | `serviceWiseBookings.auto_cab` / `.tractor` / `.goods` / `.jcb` / `.ambulance` / `.wedding` |
| Live Bookings table rows | `liveBookings[]` → `service`, `customer`, `driver`, `status` |
| "सब देखो →" link | navigate to Bookings page → `GET /api/admin/rides` |

#### `status` → badge mapping (Live Bookings table)

| `status` value | UI Badge |
|---|---|
| `"active"`    | green **Active** |
| `"urgent"`    | red **URGENT** (auto-set for ambulance rides jab tak complete/cancel na ho) |
| `"wait"`      | yellow **Wait** |
| `"done"`      | blue **Done ✓** |
| `"cancelled"` | grey **Cancelled** |

Note: agar `driver` field `"Pending"` aaye (koi driver assign nahi hua), frontend usko `—` dikha sakta hai.

---

### 1.2 AI Agent Tasks Panel 🤖
**`GET /api/admin/ai-agent/tasks`**

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "type": "auto_confirm",
        "title": "8 bookings auto-confirm",
        "subtitle": "Driver milaya, SMS bheja gaya",
        "count": 8
      },
      {
        "type": "driver_onboarding",
        "title": "3 drivers onboarding pending",
        "subtitle": "Documents verify karne hain",
        "count": 3,
        "drivers": [{ "id": "...", "name": "Ramu Yadav", "vehicleType": "tractor" }]
      },
      {
        "type": "broadcast_ready",
        "title": "WhatsApp broadcast ready",
        "subtitle": "Naya tractor driver join hua — customers ko batao",
        "count": 1,
        "drivers": [{ "id": "...", "name": "Mohan Lal", "vehicleType": "tractor" }]
      },
      {
        "type": "kisan_marketplace",
        "title": "Kisan marketplace",
        "subtitle": "Yeh feature abhi develop nahi hua hai",
        "available": false
      }
    ]
  }
}
```

⚠️ **Important**: Tumhare screenshot mein "Kisan marketplace — 5 listings / गेहूं और धान की नई entries" dikh raha hai — yeh **mockup/fake data** hai. Backend mein abhi koi marketplace/listings model hi nahi hai. API se `available:false` aayega — frontend mein iske liye "Coming soon" / "जल्द आ रहा है" jaisa state dikhao, hardcoded "5 listings" mat dikhao.

`tasks` array conditional hai — agar `auto_confirm` ka count 0 hai to woh task hi array mein nahi aayega (frontend `.map()` se render karo, fixed 4 items mat maano).

"Agent खोलो →" link → AI Agent (Live) page → same endpoint, full list dikhao.

---

### 1.3 Header
| UI | Source |
|---|---|
| "Prince Patel 👋" | `GET /api/auth/profile` → `data.user.name` (ya login response se localStorage mein store kiya hua) |
| "+ Booking" button | ⚠️ **Not built** — admin manually booking create karne ka endpoint abhi nahi hai. Agar chahiye to bata dena, banata hu (`POST /api/admin/rides`) |
| "AI Agent" button (top-right) | navigate → AI Agent page (1.2 wala endpoint) |

---

### 1.4 Footer — "System Live ✓ / Rewa District Active"
| UI | Source |
|---|---|
| "System Live ✓" | `GET /health` → `status === 'healthy'` |
| "Rewa District Active" | ⚠️ static text hai abhi — backend mein district/city-wise filtering nahi hai. `User.city` field exist karta hai but koi aggregation nahi. Static rakho ya bata do agar district-wise dashboard chahiye. |

### 1.5 Roadmap Progress 🚀
Static content — `ROADMAP.md` se hardcode karo frontend mein. Koi API nahi hai (na chahiye).

---

## 2. SIDEBAR PAGES

### 2.1 Bookings (badge = 12)
- Badge count → `dashboard/overview` → `stats.pendingBookings`
- `GET  /api/admin/rides?page=&limit=&status=&driverId=&userId=&startDate=&endDate=` — list (pagination)
- `GET  /api/admin/rides/stats?period=today|week|month` — booking stats (status-wise counts)
- `GET  /api/admin/rides/ongoing` — currently active rides
- `GET  /api/admin/rides/:id` — full ride detail
- `GET  /api/admin/rides/:id/track` — live location track
- `POST /api/admin/rides/:id/cancel` body: `{ reason }` — admin cancels a ride

#### Response shape — `GET /api/admin/rides`, `/:id`, `/ongoing`

```json
{
  "success": true,
  "data": [
    {
      "_id": "665f...",
      "status": "accepted",
      "vehicleType": "auto",
      "fare": 120,
      "finalFare": null,
      "pickup": { "address": "...", "coordinates": { "latitude": 24.45, "longitude": 81.12 } },
      "drop":   { "address": "...", "coordinates": { "latitude": 24.50, "longitude": 81.20 } },
      "customer": { "_id": "...", "name": "Ramesh Kisan", "email": "...", "phone": "9876543210" },
      "provider": {
        "_id": "...",
        "vehicle": { "type": "auto", "number": "MP09AB1234", "model": "...", "color": "..." },
        "rating": { "average": 4.5, "count": 10 },
        "user": { "_id": "...", "name": "Suresh D.", "phone": "9123456780" }
      },
      "createdAt": "2026-06-11T05:30:00.000Z"
    }
  ],
  "totalPages": 3,
  "currentPage": 1,
  "total": 47
}
```
(`/:id` aur `/ongoing` mein same shape — `/:id` ek single object `data`, `/ongoing` array `data`)

| UI Field | Source |
|---|---|
| Customer name | `customer.name` |
| Driver name | `provider?.user?.name` — agar `provider` null hai (koi driver assign nahi hua), `"—"` ya `"Pending"` dikhao |
| Vehicle number | `provider?.vehicle?.number` |
| Service label | `vehicleType` → section 3 table se map karo |
| Fare | `finalFare ?? fare` |
| Status badge | `status` ∈ `scheduled / searching / accepted / arrived / started / working / completed / cancelled` |

#### Response shape — `GET /api/admin/rides/:id/track`
```json
{
  "success": true,
  "data": {
    "status": "started",
    "pickup": { "address": "...", "coordinates": { "latitude": 24.45, "longitude": 81.12 } },
    "drop":   { "address": "...", "coordinates": { "latitude": 24.50, "longitude": 81.20 } },
    "provider": {
      "_id": "...",
      "vehicle": { "type": "auto", "number": "MP09AB1234" },
      "currentLocation": { "type": "Point", "coordinates": [81.15, 24.47] },
      "user": { "name": "Suresh D.", "phone": "9123456780" }
    }
  }
}
```
⚠️ `currentLocation.coordinates` = `[longitude, latitude]` (GeoJSON order) — Google Maps/Leaflet mein `{ lat, lng }` chahiye to ulta karna padega: `lat = coordinates[1]`, `lng = coordinates[0]`.

#### Response shape — `GET /api/admin/rides/stats`
```json
{
  "success": true,
  "data": {
    "totalRides": 50,
    "completed": 30,
    "cancelled": 5,
    "ongoing": 8,
    "totalRevenue": 12500,
    "avgFare": 250
  }
}
```
`ongoing` = rides jinka status `accepted/arrived/started/working` mein hai.

#### `POST /api/admin/rides/:id/cancel`
Body: `{ "reason": "customer ne phone pe cancel bola" }`. Pehle yeh endpoint hamesha 500 deta tha (schema bug) — ab fixed hai, response `{ success: true, data: <updated ride> }`.

### 2.2 AI Agent (Live)
- `GET /api/admin/ai-agent/tasks` (section 1.2 wala, full page view)
- "Live" badge → static indicator (no API)

### 2.3 Drivers
- `GET    /api/admin/drivers?page=&limit=&status=&search=` — list
- `GET    /api/admin/drivers/:id` — driver profile
- `GET    /api/admin/drivers/:id/stats`
- `GET    /api/admin/drivers/:id/performance?period=week|month|year`
- `PUT    /api/admin/drivers/:id/approve`
- `PUT    /api/admin/drivers/:id/reject`            body: `{ reason }`
- `PUT    /api/admin/drivers/:id/block`             body: `{ reason }`
- `PUT    /api/admin/drivers/:id/unblock`
- `PUT    /api/admin/drivers/:id/status`            body: `{ status: 'available'|'busy'|'offline' }`
- `PUT    /api/admin/drivers/:id/documents/verify`  body: `{ documentType: 'license'|'rc'|'insurance'|'aadhaar', status: 'verified'|'rejected' }`
- `DELETE /api/admin/drivers/:id`

⚠️ `?status=` query yahan Provider ka **online status** filter karta hai (`available|busy|offline`) — yeh approval/block status NAHI hai. `search` name/email/phone/vehicle-number par case-insensitive search karta hai.

#### Response shape — `GET /api/admin/drivers` & `/:id`
```json
{
  "success": true,
  "data": [
    {
      "_id": "665f...",
      "user": { "_id": "...", "name": "Ramu Yadav", "phone": "9999999999", "email": "...", "city": "..." },
      "vehicle": { "type": "tractor", "number": "MP09AB1234", "model": "...", "color": "...", "registrationYear": 2020 },
      "rating": { "average": 4.5, "count": 12, "breakdown": { "5": 8, "4": 3, "3": 1, "2": 0, "1": 0 } },
      "status": "offline",
      "isOnline": false,
      "isApproved": true,
      "approvedAt": "2026-05-01T10:00:00.000Z",
      "isRejected": false,
      "rejectionReason": null,
      "isBlocked": false,
      "blockReason": null,
      "documents": {
        "license":   { "number": "...", "photo": "...", "verified": true,  "verifiedAt": "..." },
        "rc":        { "number": "...", "photo": "...", "verified": false, "verifiedAt": null },
        "insurance": { "number": "...", "photo": "...", "verified": false, "verifiedAt": null },
        "aadhaar":   { "number": "...", "photo": "...", "verified": false, "verifiedAt": null },
        "photo": "..."
      },
      "createdAt": "2026-04-20T08:00:00.000Z"
    }
  ],
  "totalPages": 2,
  "currentPage": 1,
  "total": 23
}
```
`/:id` — same shape lekin `data` ek single object hai, plus extra `stats: { totalRides, completedRides, totalEarnings, avgRating }`.

#### Driver status badges (Drivers page tabs/badges)
| Condition | Badge |
|---|---|
| `isRejected === true` | red **Rejected** — `rejectionReason` bhi dikhao |
| `isBlocked === true` | dark/red **Blocked** — `blockReason` bhi dikhao |
| `isApproved === false && isRejected === false` | yellow **Pending Approval** |
| `isApproved === true && isBlocked === false` | green **Active** |
| `isOnline === true` | extra green dot/badge "Online" |

⚠️ **Note**: `getAllDrivers` abhi `isApproved/isRejected/isBlocked` par filter/tab support nahi karta — agar Drivers page mein "Pending / Approved / Rejected / Blocked" tabs chahiye, to ya to client-side filter karo poori list pe, ya bata do, query param add kar denge.

#### Response shape — `GET /api/admin/drivers/:id/stats`
```json
{
  "success": true,
  "data": {
    "totalRides": 120,
    "completedRides": 110,
    "cancelledRides": 8,
    "totalEarnings": 25000,
    "avgRating": 4.6,
    "totalDistance": 850,
    "avgFare": 227,
    "todayRides": 4,
    "todayEarnings": 600
  }
}
```

#### Response shape — `GET /api/admin/drivers/:id/performance?period=week`
```json
{
  "success": true,
  "data": {
    "daily": [
      { "_id": "2026-06-10", "totalRides": 5, "completedRides": 4, "totalEarnings": 800, "avgRating": 4.5, "totalDistance": 40 }
    ],
    "overall": { "totalRides": 35, "completedRides": 30, "cancelledRides": 3, "totalEarnings": 6000, "avgRating": 4.6, "totalDistance": 280 }
  }
}
```

#### Approve / Reject / Block / Unblock
- `PUT /api/admin/drivers/:id/approve` — body koi nahi. Sets `isApproved:true, isRejected:false`.
- `PUT /api/admin/drivers/:id/reject` body `{ "reason": "documents incomplete" }` — Sets `isApproved:false, isRejected:true, rejectionReason`.
- `PUT /api/admin/drivers/:id/block` body `{ "reason": "complaint mili" }` — Sets `isBlocked:true, blockReason`. **Block hone ke baad driver ko naye rides assign nahi honge** (normal booking, scheduled booking, SOS — sabme exclude).
- `PUT /api/admin/drivers/:id/unblock` — body koi nahi. Sets `isBlocked:false`.

Sab 4 endpoints `{ success: true, data: <updated driver> }` return karte hain.

### 2.4 Live Map
- `GET /api/admin/drivers/live-locations` — sab online + approved + non-blocked drivers ke current `currentLocation` (GeoJSON)
- Real-time updates ke liye socket.io connect karo aur driver location events listen karo (har driver location-update emit karta hai apne booking room mein — admin map ke liye agar broadcast room chahiye to bata dena, add kar denge)

#### Response shape
```json
{
  "success": true,
  "data": [
    {
      "_id": "665f...",
      "user": { "name": "Suresh D.", "phone": "9123456780" },
      "vehicle": { "type": "auto", "number": "MP09AB1234" },
      "currentLocation": { "type": "Point", "coordinates": [81.123, 24.456] },
      "status": "available"
    }
  ]
}
```
⚠️ `currentLocation.coordinates` = `[longitude, latitude]` (GeoJSON order) — map pin lagate waqt `lat = coordinates[1]`, `lng = coordinates[0]`.

### 2.5 Vehicles
- Alag se "Vehicle" model/endpoint nahi hai — har driver ke andar `vehicle: { type, number, model, ... }` embedded hai.
- `GET /api/admin/drivers` se hi vehicle info mil jayega (filter/group by `vehicle.type` frontend mein kar lo)
- Vehicle-type fare config (rate card) → `GET /api/admin/settings` → `data.vehicleRates`

### 2.6 Kisan Seva
- ⚠️ **Not built** — yeh poora ek naya feature hai (marketplace listings: crop, price, quantity, seller). Backend mein koi model/CRUD nahi hai.
- Agar yeh chahiye to alag se bata dena — naya `KisanListing` model + CRUD APIs (`/api/admin/kisan/listings` etc.) banane padenge. Abhi sirf placeholder hai (section 1.2).

### 2.7 Emergency
- `GET /api/sos/active` — active SOS alerts
- `GET /api/sos/history?page=&limit=` — resolved/past alerts
- `PUT /api/sos/:alertId/resolve` body: `{ resolveNote }`

### 2.8 Earnings
- `GET /api/admin/payments?page=&limit=&status=&method=&startDate=&endDate=` — ride payment records (fare, paymentMethod, paymentStatus, customer, driver)
- `GET /api/admin/payments/stats` — total revenue, cash vs online split, commission
- `GET /api/admin/payments/commission?from_date=&to_date=` — daily commission report
- `GET /api/admin/payments/withdrawals/pending` — driver withdrawal requests jo approve/reject karne hain
- `PUT /api/admin/payments/withdrawal/:id` body: `{ status: 'completed'|'failed', remarks }` — approve/reject withdrawal
- `GET /api/admin/revenue/chart?period=today|week|month` — revenue line chart data

### 2.9 Analytics
- `GET /api/admin/analytics?period=today|week|month|year` — rides/users/drivers growth charts
- `GET /api/admin/dashboard/metrics` — monthly revenue, active drivers, avg rating, completion rate
- `GET /api/admin/reports/export?type=rides|payments|drivers|users&from_date=&to_date=` — CSV download

### 2.10 Settings
- `GET /api/admin/settings` — sab settings (commission, vehicleRates, surge, waiting, etc.)
- `PUT /api/admin/settings` — general settings update
- `PUT /api/admin/pricing` — vehicle rate cards update (ambulance/wedding bhi included ab)
- `GET /api/admin/config` — system config (app version, support contact, etc.)
- Promo codes (agar Settings ke andar tab hai): `GET /api/promo/all`, `POST /api/promo/create`, `PUT /api/promo/:id/toggle`

---

## 3. Quick reference — Vehicle Types & Service Labels

| `vehicleType` (backend) | Dashboard Service Label | Service-wise group |
|---|---|---|
| `auto`, `car`, `bike` | Auto / Cab / Bike | `auto_cab` |
| `tractor` | Tractor | `tractor` |
| `truck`, `tempo` | Goods | `goods` |
| `jcb` | JCB | `jcb` |
| `ambulance` | Ambulance | `ambulance` |
| `wedding` | Wedding | `wedding` |

---

## 4. Open items (chahiye to bata dena, ban jayega)
1. "+ Booking" button → admin-side manual booking creation API
2. Average Rating ka "इस हफ्ते बेहतर" — week-over-week trend
3. "Rewa District Active" — district-wise filtering
4. Kisan Seva — poora naya marketplace feature
5. Live Map real-time socket broadcast room (agar polling kaafi nahi hai)
