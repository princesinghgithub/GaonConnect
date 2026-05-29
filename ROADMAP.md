# GaonConnect — Version Roadmap

---

## VERSION 1.0 — Core MVP ✅ (DONE — Backend Ready)

### Backend ✅ Already Built
| Feature | Status | API |
|---|---|---|
| Phone OTP Login | ✅ | `POST /api/auth/send-phone-otp` |
| Email OTP Login | ✅ | `POST /api/auth/send-otp` |
| Register | ✅ | `POST /api/auth/register` |
| JWT Auth (protect middleware) | ✅ | Header: `Bearer token` |
| Driver Registration | ✅ | `POST /api/provider/register` |
| Driver Online/Offline | ✅ | `PUT /api/provider/duty-toggle` |
| Driver Location Update | ✅ | `PUT /api/provider/location` |
| Ride Create | ✅ | `POST /api/ride/create` |
| Driver Accept Ride | ✅ | `POST /api/ride/accept` |
| Driver Reject Ride | ✅ | `POST /api/ride/reject` |
| Ride Status Update | ✅ | `PUT /api/ride/status` |
| OTP Verify & Start Ride | ✅ | `POST /api/ride/verify-otp` |
| Cancel Ride | ✅ | `POST /api/ride/cancel` |
| Ride History (Customer) | ✅ | `GET /api/ride/history/customer` |
| Ride History (Driver) | ✅ | `GET /api/ride/history/driver` |
| Fare Estimate | ✅ | `GET /api/ride/fare-estimate` |
| Searching Rides | ✅ | `GET /api/ride/searching` |
| Wallet Balance | ✅ | `GET /api/wallet/balance` |
| Transaction History | ✅ | `GET /api/wallet/transactions` |
| Earnings Report | ✅ | `GET /api/wallet/earnings/report` |
| User Profile | ✅ | `GET/PUT /api/auth/profile` |
| Driver Profile | ✅ | `GET/PUT /api/provider/me` |
| Real-time Socket (ride events) | ✅ | Socket.io |
| Admin Dashboard | ✅ | `GET /api/admin/*` |
| Scheduled Rides | ✅ | `bookingType: "scheduled"` |
| Tractor/JCB Hourly Booking | ✅ | `bookingMode: "hourly"` |
| Document Upload | ✅ | `POST /api/provider/documents/upload` |
| Helmet + Rate Limiting | ✅ | Server middleware |
| Docker Setup | ✅ | `docker-compose up` |

### User App v1.0 — Implement Karo
- [ ] Splash Screen + Token check
- [ ] Phone OTP Login Screen
- [ ] Home Screen (Map + Pickup/Drop)
- [ ] Vehicle Select + Fare Estimate
- [ ] Book Ride Button
- [ ] Searching Driver Screen (Socket listen)
- [ ] Driver Found Screen (OTP dikhao)
- [ ] Live Tracking Screen (Socket location_update)
- [ ] Ride Complete Screen
- [ ] Ride History Screen
- [ ] Profile Screen
- [ ] Wallet Screen

### Driver App v1.0 — Implement Karo
- [ ] Splash Screen + Token check
- [ ] Phone OTP Login Screen
- [ ] Registration Screen (documents upload)
- [ ] Pending Approval Screen
- [ ] Home Dashboard (Online/Offline toggle)
- [ ] New Ride Request Popup (Socket newRideRequest)
- [ ] Active Ride Screen (Arrived → OTP → Complete buttons)
- [ ] Earnings Screen
- [ ] Profile + Bank Details Screen
- [ ] Documents Screen

---

## VERSION 1.1 — Security + Stability 🔐 (DONE — Backend Ready)

### Backend ✅ Already Built
| Feature | Status | API |
|---|---|---|
| Refresh Token (15min access + 7d refresh) | ✅ | `POST /api/auth/refresh` |
| Logout Current Device | ✅ | `POST /api/auth/logout` |
| Logout All Devices | ✅ | `POST /api/auth/logout-all` |
| Redis OTP Store (not in-memory) | ✅ | Auto |
| OTP Brute Force Protection | ✅ | Auto (5 attempts) |
| OTP Cooldown (60 sec) | ✅ | Auto |
| Input Validation (Joi) | ✅ | Auto |
| Health Check | ✅ | `GET /health` |
| Nearest Driver Auto-assign | ✅ | Auto in createRide |

### User App v1.1 — Implement Karo
- [ ] `apiClient.js` — Axios interceptor with refresh token logic
- [ ] Auto logout on refresh fail → Login screen
- [ ] Token store in AsyncStorage (accessToken + refreshToken)
- [ ] Network error handling (show "No internet" screen)

### Driver App v1.1 — Same as User App
- [ ] Same `apiClient.js` interceptor copy karo
- [ ] Same token storage logic

---

## VERSION 2.0 — Full Ride Experience 🚗 (DONE — Backend Ready)

### Backend ✅ Already Built
| Feature | Status | API |
|---|---|---|
| Push Notifications (FCM) | ✅ | Auto on ride events |
| FCM Token Register | ✅ | `POST /api/provider/fcm-token` |
| Rating System (Customer → Driver) | ✅ | `POST /api/ratings/submit` |
| Rating System (Driver → Customer) | ✅ | Same API |
| Pending Ratings | ✅ | `GET /api/ratings/pending` |
| Driver Rating Summary | ✅ | `GET /api/ratings/provider/:id` |
| SOS Emergency Button | ✅ | `POST /api/sos/trigger` |
| Promo Codes | ✅ | `POST /api/promo/validate` |
| Available Promos | ✅ | `GET /api/promo/available` |
| Invoice/Receipt (HTML) | ✅ | `GET /api/ride/:id/invoice` |
| Invoice Email (auto on complete) | ✅ | Auto |

### User App v2.0 — Implement Karo
- [ ] FCM setup (`@react-native-firebase/messaging`)
- [ ] Background notification handler
- [ ] Promo Code input on Booking Screen
- [ ] Available Promos list screen
- [ ] SOS Button on Tracking Screen (red button, bottom right)
- [ ] Rating Screen after ride complete (stars + tags)
- [ ] Invoice Screen (WebView — `GET /ride/:id/invoice`)
- [ ] "Rate Pending" badge on Home Screen

### Driver App v2.0 — Implement Karo
- [ ] FCM token register after login
- [ ] Background notification handler (`NEW_RIDE_REQUEST` push)
- [ ] SOS Button on Active Ride Screen
- [ ] Rate Customer Screen after ride complete
- [ ] Pending Ratings list
- [ ] Invoice view option in history

---

## VERSION 2.1 — Payments 💰 (Backend Partially Ready)

### Backend — Karna Hai
| Feature | Status | Kya Karna Hai |
|---|---|---|
| Razorpay Online Payment | 🔶 Partial | Payment capture + verify webhook |
| Wallet Top-up | ❌ | `POST /api/wallet/topup` banao |
| Withdrawal Request | ✅ | `POST /api/wallet/withdraw` |
| Withdrawal Process (Admin) | ✅ | `PUT /api/admin/payments/withdrawal/:id` |
| UPI/QR Code Payment | ❌ | Razorpay UPI intent |

### User App v2.1 — Implement Karo
- [ ] Payment method screen (Cash / Online / Wallet)
- [ ] Razorpay checkout flow
- [ ] Wallet top-up screen
- [ ] Transaction history with filter

### Driver App v2.1 — Implement Karo
- [ ] Withdrawal request screen
- [ ] Bank details screen (already has API)
- [ ] Earnings graph (week/month)

---

## VERSION 3.0 — Advanced Features 🚀 (Future)

### Backend — Banane Hain
| Feature | API Plan |
|---|---|
| In-app Chat (Customer ↔ Driver) | Socket.io rooms + `GET /api/chat/:rideId` |
| Surge Pricing | Fare multiplier based on demand |
| Referral System | `POST /api/auth/referral` |
| Driver Subscription Plans | `POST /api/provider/subscribe` |
| Multi-stop Rides | Array of stops in ride model |
| Cashback System | On wallet credit |
| Trip Sharing (Share live location) | Shareable link |

### User App v3.0 — Implement Karo
- [ ] In-app chat with driver
- [ ] "Share my trip" button (WhatsApp/SMS)
- [ ] Refer & Earn screen
- [ ] Saved addresses (Home, Office)
- [ ] Favourite drivers list
- [ ] Cashback history

### Driver App v3.0 — Implement Karo
- [ ] In-app chat with customer
- [ ] Subscription plan screen
- [ ] Weekly/monthly earnings graph
- [ ] Performance score screen (acceptance rate, rating)

---

## VERSION 3.1 — GaonConnect Special (Rural Focus) 🌾 (Future)

### Backend — Banane Hain
| Feature | Plan |
|---|---|
| Crop Calendar Integration | Seasonal demand prediction |
| Mandi/Market Connect | Connect farmers to mandis |
| Village Coverage Map | Geofencing per village |
| Offline Mode Support | Queue requests when no internet |
| Hindi Voice Search | Speech to text for pickup |

### User App v3.1
- [ ] Seasonal service suggestions (Kharif/Rabi)
- [ ] Hindi language full support
- [ ] Voice input for locations
- [ ] Offline booking queue

---

## VERSION 4.0 — Scale & Analytics 📊 (Future)

### Backend — Banane Hain
| Feature | Plan |
|---|---|
| AI Route Optimization | Best route based on traffic |
| Dynamic Fare Engine | Real-time demand-based pricing |
| Driver Fraud Detection | Fake GPS detection |
| Advanced Analytics | ML-based demand forecasting |
| Multi-city Support | City-wise rate cards |

---

## Summary Table

| Version | Status | Focus |
|---|---|---|
| **v1.0** | ✅ Backend Done | Core ride booking flow |
| **v1.1** | ✅ Backend Done | Security, refresh tokens |
| **v2.0** | ✅ Backend Done | Notifications, Rating, SOS, Promo, Invoice |
| **v2.1** | 🔶 Partial | Full payment flow |
| **v3.0** | ❌ Future | Chat, Referral, Surge |
| **v3.1** | ❌ Future | Rural special features |
| **v4.0** | ❌ Future | AI, Scale, Multi-city |

---

## Current Priority (Aaj Se Karo)

```
Backend:   v1.0 + v1.1 + v2.0 — Sab ready hai ✅
User App:  v1.0 → v1.1 → v2.0 — Is order mein karo
Driver App: v1.0 → v1.1 → v2.0 — Is order mein karo
```
