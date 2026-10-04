// utils/settlement.js
// ─────────────────────────────────────────────────────────────────────────────
// Ride ka paisa kiske paas gaya, aur uske hisaab se kiska kya banta hai.
//
// Yahan sirf hisaab hai — database nahi. Isliye ise bina server ke test kiya
// ja sakta hai, aur ride complete / cancel / QR payment teeno jagah ek hi
// hisaab lagta hai.
//
// Teen galtiyan jo yeh file theek karti hai:
//
// 1. PROMO KA DISCOUNT DRIVER KI JEB SE KAT RAHA THA.
//    Customer ko ₹50 ka promo mila to ride ka fare ₹200 se ₹150 ho gaya, aur
//    driver ki kamai bhi ₹150 par bani. Offer platform ne diya tha, bhara
//    driver ne. Ab driver ki kamai poore ₹200 par banti hai; ₹50 platform deta hai.
//
// 2. CASH RIDE PAR WALLET GALAT BHAR RAHA THA.
//    Driver ne customer se ₹200 cash le liye, aur upar se uske wallet mein bhi
//    ₹200 jud gaye — jo wo withdraw bhi kar sakta tha. Yaani ek ride ke do baar
//    paise. Ab wallet mein wahi judta hai jo platform par sach mein baaki hai:
//      • paisa platform ke paas aaya (online / QR) → driver ki poori kamai
//      • paisa driver ke haath mein aaya (cash)    → sirf promo ka hissa, aur
//        commission ho to wo ghat jaata hai
//
// 3. CANCEL KA CHARGE DRIVER KO MILTA HI NAHI THA, aur kai baar galat aadmi
//    par lagta tha — dekho `cancellationTerms`.
// ─────────────────────────────────────────────────────────────────────────────

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/**
 * Ride poori hone par ka hisaab.
 *
 * @param {object}  p
 * @param {number}  p.fare               customer ne jo diya / dena hai (promo ke baad, waiting ke saath)
 * @param {number}  p.promoDiscount      promo se jitna kam hua
 * @param {number}  p.commissionPct      platform ka commission (%)
 * @param {boolean} p.collectedByPlatform paisa platform ke paas aaya (online/QR) ya driver ke haath mein (cash)
 * @param {number}  p.dues               `fare` mein juda customer ka pichhla baaki (is driver ka nahi hai)
 */
const computeSettlement = ({ fare, promoDiscount = 0, commissionPct = 0, collectedByPlatform, dues = 0 }) => {
  const paid   = Math.max(0, num(fare));
  const promo  = Math.max(0, num(promoDiscount));
  // Customer ka pichhla baaki isi ride ke saath wasool hota hai. Wo is driver
  // ki kamai nahi — cash mein liya ho to driver use platform ko lautata hai
  // (wallet se ghat jaata hai), aur wahan se wo us driver tak jaata hai
  // jiska nuksan hua tha.
  const carried = Math.min(Math.max(0, num(dues)), paid);
  // Ride ki asli keemat — driver ne itne ka kaam kiya, chahe customer ne
  // promo ki wajah se kam diya ho.
  const rideValue  = paid - carried + promo;
  const commission = Math.round(rideValue * Math.max(0, num(commissionPct)) / 100);
  const driverEarning = rideValue - commission;

  // Driver ke haath mein pehle se kitna hai.
  const cashInHand  = collectedByPlatform ? 0 : paid;
  // Wallet = platform par driver ka kitna baaki. Minus bhi ho sakta hai: cash
  // ride mein commission ho to driver ko wo platform ko dena hota hai.
  const walletDelta = driverEarning - cashInHand;

  return { rideValue, commission, driverEarning, cashInHand, walletDelta };
};

/**
 * Cancel karne par kya lagega aur kise milega.
 *
 * Insaaf ke niyam:
 *   • Driver mila hi nahi tha            → kuch nahi.
 *   • Accept ke turant baad (muft samay) → kuch nahi, galti kisi se bhi ho sakti hai.
 *   • Customer cancel kare, driver chal chuka ho → customer se charge, aur wo
 *     DRIVER ko milta hai (uska petrol aur waqt gaya).
 *   • Customer cancel kare par driver hi bahut der kar raha ho → kuch nahi.
 *     Der driver ki hai, customer kyun bhare.
 *   • Driver pahunch kar muft waiting se zyada ruka aur customer aaya hi nahi
 *     → driver par koi penalty nahi; customer se charge, driver ko.
 *   • Driver bina wajah chhode → driver par penalty, customer ke liye naya driver.
 *
 * @returns {{ fee:number, payer:'customer'|'driver'|null, toDriver:boolean,
 *             requeue:boolean, code:string }}
 */
/** Pakki pre-booking kitni der pehle tak muft cancel (Uber Reserve: 60 min) */
const PREBOOK_FREE_CANCEL_MIN = 60;
/** Driver pre-booking itne pehle ke andar chhode to uske record mein ginti */
const PREBOOK_DRIVER_LATE_RELEASE_MIN = 120;

const cancellationTerms = ({
  ride, byCustomer, now = Date.now(),
  freeWindowMinutes = 2, customerFee = 20, driverFee = 30, freeWaitingMinutes = 5,
}) => {
  const none = (code, requeue = false) => ({ fee: 0, payer: null, toDriver: false, requeue, code });

  // ── Pakki pre-booking (driver tay, abhi chalu nahi) — Uber Reserve jaisa ──
  // Customer samay se 1 ghanta pehle tak muft cancel kar sakta hai. Usse kam
  // bacha ho to charge, aur wo DRIVER ko — usne us samay ke liye apna din
  // rakha tha, doosra kaam chhoda tha. Driver tay hi nahi to kuch nahi.
  if (ride.status === 'scheduled' && byCustomer) {
    if (!ride.provider) return none('no_driver');
    const minsLeft = (new Date(ride.scheduledAt).getTime() - now) / 60000;
    if (minsLeft >= PREBOOK_FREE_CANCEL_MIN) return none('prebook_free');
    return { fee: num(customerFee), payer: 'customer', toDriver: true, requeue: false, code: 'prebook_late_cancel' };
  }

  const preStart   = ['accepted', 'arrived'].includes(ride.status);
  const acceptedAt = ride.acceptedAt ? new Date(ride.acceptedAt).getTime() : null;

  // Driver ke chhodne par ride dobara dhoondhi jaati hai (shuru hone se pehle).
  const requeueIfDriver = !byCustomer && preStart;

  if (!acceptedAt) return none('no_driver', requeueIfDriver);

  const sinceAcceptMin = (now - acceptedAt) / 60000;

  if (byCustomer) {
    if (sinceAcceptMin <= num(freeWindowMinutes, 2)) return none('free_window');

    // Driver der kar raha hai? Accept ke waqt uska andaazan time rakha tha;
    // usse dedh guna + 5 minute nikal gaye aur wo ab tak pahuncha nahi.
    if (ride.status === 'accepted') {
      const eta = num(ride.pickupEtaMinutes);
      const allowed = (eta > 0 ? eta : 10) * 1.5 + 5;
      if (sinceAcceptMin > allowed) return none('driver_late');
    }

    if (ride.status === 'started') {
      // Ride chal rahi hai — beech mein chhodne par bhi driver ko uska charge.
      return { fee: num(customerFee), payer: 'customer', toDriver: true, requeue: false, code: 'customer_mid_ride' };
    }
    return { fee: num(customerFee), payer: 'customer', toDriver: true, requeue: false, code: 'customer_cancel' };
  }

  // ── Driver ne chhoda ────────────────────────────────────────────────────
  if (ride.status === 'arrived' && ride.arrivedAt) {
    const waitedMin = (now - new Date(ride.arrivedAt).getTime()) / 60000;
    if (waitedMin >= Math.max(num(freeWaitingMinutes, 5), 3)) {
      // Customer aaya hi nahi. Dobara driver dhoondhna bemaani — customer hai hi nahi.
      return { fee: num(customerFee), payer: 'customer', toDriver: true, requeue: false, code: 'customer_no_show' };
    }
  }

  if (sinceAcceptMin <= num(freeWindowMinutes, 2)) return none('free_window', requeueIfDriver);

  return { fee: num(driverFee), payer: 'driver', toDriver: false, requeue: requeueIfDriver, code: 'driver_cancel' };
};

module.exports = { computeSettlement, cancellationTerms, PREBOOK_FREE_CANCEL_MIN, PREBOOK_DRIVER_LATE_RELEASE_MIN };
