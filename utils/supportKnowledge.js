// utils/supportKnowledge.js
// ─────────────────────────────────────────────────────────────────────────────
// Customer support bot ka gyaan.
//
// Do hisse hain aur dono zaroori hain:
//
//   1. STATIC — GaonConnect kya hai, app kaise chalti hai, safety, driver kaise
//      bane. Ye cheezein DB mein nahi hain, isliye yahan likhi hain.
//
//   2. LIVE — rates, cancellation fee, waiting charge, referral amount, surge.
//      Ye Settings se aate hain. Prompt mein hardcode karna sabse buri galti
//      hoti: admin rate badalta hai aur bot mahino purana rate batata rehta hai,
//      jo customer se jhooth bolne jaisa hai.
//
// getSettings() pe pehle se 5-minute Redis cache hai, isliye har message pe DB
// hit nahi hota.
// ─────────────────────────────────────────────────────────────────────────────
const { getSettings } = require('./dynamicFare');

const STATIC_FACTS = `
GAONCONNECT KYA HAI
- Rural India ke liye vehicle booking app — Ola/Uber jaisi, par gaon ke liye.
- Base: Rewa, Madhya Pradesh aur aas-paas ke ilaake.
- Do apps hain: customer app (sawari book karne ke liye) aur driver app.
- Website: gaonconnect.in

SEVAYEIN
- Turant sawari: bike, auto, car/cab.
- Saamaan dhona: tempo/pickup, truck.
- Kheti aur nirmaan: tractor aur JCB — ye ghante ke hisaab se book hote hain,
  kilometre ke hisaab se nahi.
- Ambulance aur wedding car bhi.
- Pre-booking (schedule): aage ki tareekh/samay ke liye pehle se book kar sakte hain.

BOOKING KAISE HOTI HAI
1. Home screen pe pickup aur drop jagah chuno.
2. Vehicle chuno — har ek ka kiraya saath mein dikhta hai.
3. "Abhi Book Karein" dabao. Aas-paas ke drivers ko request jaati hai.
4. Driver accept kare to uska naam, rating aur gaadi ka number dikhta hai.
5. Ride shuru karne ke liye driver ko app wala OTP batana hota hai — isse pakka
   hota hai ki sahi gaadi mein baithe hain.
6. Ride ke baad rating do, aur chaaho to driver ko tip.

TRACTOR / JCB
- Ye ghante ke hisaab se chalte hain, aur har kaam ka apna rate hai
  (jaise jutai, mitti, nirmaan).
- Har seva ka ek minimum ghanta hota hai — kaam jaldi khatam ho to bhi utna
  charge lagta hai.
- Bill asli kaam ke ghanton ka banta hai, andaaze ka nahi.
- Inke liye drop location zaroori nahi — kaam khet pe hi hota hai.

PAISE KA MAAMLA
- Cash, online (UPI/card, Razorpay se) aur wallet — teenon chalte hain.
- Driver cash ride pe bhi UPI QR dikha sakta hai.
- Wallet mein paisa daal sakte hain, aur wahi se tip bhi de sakte hain.
- Promo code Offers screen se ya booking confirm karte waqt lagta hai.
- Har ride ka receipt/invoice app mein milta hai aur email pe bhi jaata hai.

SURAKSHA
- Har ride mein SOS button — dabane par 112 aur hamari team dono ko alert jaata hai.
- Emergency contacts save kar sakte hain (3 tak); SOS pe unhe live location bhej
  sakte hain.
- "Share Ride" se apni live ride kisi ko WhatsApp pe bhej sakte hain.
- Saare drivers ke documents verify hote hain (KYC).
- OTP ke bina ride shuru nahi hoti.

DRIVER KAISE BANEIN
- GaonConnect Driver app download karo.
- Phone number se OTP login, phir registration.
- Chahiye: driving licence, gaadi ka RC, aadhaar, aur gaadi ki photo.
- Team documents verify karti hai — tab tak account "pending approval" rehta hai.
- Approve hone ke baad online jaate hi ride requests aane lagti hain.
- Ek hi account se kai gaadiyan jod sakte hain, aur online rehte hue badal bhi sakte hain.
- Kamai driver app ke Earnings mein roz dikhti hai, aur bank mein withdraw kar sakte hain.

SHIKAYAT / MADAD
- App mein "Report an Issue" se shikayat darj hoti hai — kiraya, driver ka
  vyavhaar, suraksha, ya saamaan chhoot jaana.
- Har shikayat ka status app mein dikhta hai.
- Support: +91 62601 32613 (call/WhatsApp), gaonconnect.in@gmail.com
`.trim();

const money = (n) => `₹${Number(n || 0)}`;

/**
 * Live rates + policies. Settings se aate hain, isliye admin ke badalte hi
 * bot bhi sahi jawab dene lagta hai.
 */
const buildLiveFacts = async () => {
  const s = await getSettings();
  if (!s) return '';

  const lines = [];

  // ── Per-km vehicles ────────────────────────────────────────────────────
  const rates = s.vehicleRates || {};
  const active = Object.entries(rates).filter(([, r]) => r && r.isActive !== false);

  if (active.length) {
    lines.push('AAJ KE RATE (per-km sevayein):');
    // Formula ab minimum-fare based hai: minimum fare mein kuch km shaamil hain,
    // uske aage hi per-km lagta hai. Bot ko wahi batana chahiye jo app dikhati
    // hai — warna customer ko do alag jawab milte hain.
    active.forEach(([id, r]) => {
      const inc = Number(r.includedKm) || 0;
      lines.push(
        `- ${r.label || id}: ${money(r.minimumFare)} minimum` +
        (inc > 0 ? ` (pehle ${inc} km isi mein)` : '') +
        `, uske aage ${money(r.perKmRate)} per km`
      );

      const freeWait = Number(r.freeWaitingMinutes) || 0;
      if (Number(r.waitingPerHour) > 0) {
        lines.push(`   waiting: ${freeWait} minute muft, phir ${money(r.waitingPerHour)} per ghanta`);
      } else if (Number(r.waitingPerMinute) > 0) {
        lines.push(`   waiting: ${freeWait} minute muft, phir ${money(r.waitingPerMinute)} per minute`);
      }
      if (Number(r.nightChargePercent) > 0) {
        lines.push(`   raat (10 baje se subah 6 baje tak): ${r.nightChargePercent}% zyada`);
      }
      if (Number(r.longPickupPerKm) > 0) {
        lines.push(
          `   driver ${Number(r.freePickupKm) || 0} km tak aane ka kuch nahi leta, ` +
          `usse door se ${money(r.longPickupPerKm)} per km`
        );
      }
      if (Number(r.cancellationFee) > 0) {
        lines.push(`   cancellation (accept hone ke baad): ${money(r.cancellationFee)}`);
      }
      const ex = r.extras || {};
      const exLines = ['loading', 'unloading', 'helper']
        .filter((k) => ex[k]?.enabled && Number(ex[k].amount) > 0)
        .map((k) => `${k} ${money(ex[k].amount)}`);
      if (exLines.length) lines.push(`   extra (customer chune tab): ${exLines.join(', ')}`);
    });
    lines.push('(Asli kiraya doori pe nirbhar karta hai — app booking se pehle poora breakdown dikhati hai. Koi chhupa hua charge nahi hai.)');
  }

  // ── Hourly (tractor/JCB) ───────────────────────────────────────────────
  const hourly = s.hourlyRates || {};
  Object.entries(hourly).forEach(([vehicle, categories]) => {
    if (!Array.isArray(categories) || !categories.length) return;
    const label = rates[vehicle]?.label || vehicle;
    lines.push(`\n${String(label).toUpperCase()} — kaam ke hisaab se:`);
    categories.forEach((cat) => {
      (cat.sub || []).forEach((sv) => {
        // Jinka rate abhi set nahi hua (thresher/harvester) unhe batana galat
        // hoga — customer ko "0 rupaye" wala jawab milega.
        if (sv.isActive === false || !(Number(sv.rate) > 0)) return;

        const UNIT_TEXT = {
          hour: 'per ghanta', acre: 'per acre', quintal: 'per quintal',
          km: 'per km', job: 'poore kaam ka',
        };
        const unitText = UNIT_TEXT[sv.unit] || 'per ghanta';
        lines.push(
          `- ${cat.label || cat.id} / ${sv.label || sv.id}: ${money(sv.rate)} ${unitText}` +
          (sv.minimumHours > 1 ? `, kam se kam ${sv.minimumHours} ghante` : '')
        );
      });
    });
  });

  // ── Policies ───────────────────────────────────────────────────────────
  const c = s.cancellation || {};
  lines.push(
    `\nCANCELLATION: driver ke accept karne ke ${c.freeWindowMinutes ?? 2} minute ke andar ` +
    `cancel karna muft hai. Uske baad ${money(c.customerFee ?? 20)} charge lagta hai. ` +
    `Driver dhoondte waqt cancel karna hamesha muft hai.`
  );

  // Waiting ab har vehicle ka apna hai — upar rate ke saath hi likh diya gaya
  // hai. Yahan dobara ek global number likhne se galat jaankari jaati thi.
  lines.push('WAITING: har gaadi ka apna free time aur rate hai — upar list mein dekho.');

  // Wedding car per-km nahi chalti, isliye upar wali list mein nahi aati.
  const weddingPkgs = (s.weddingPackages || []).filter((pk) => pk.isActive !== false);
  if (weddingPkgs.length) {
    lines.push('\nWEDDING CAR (package ke hisaab se, per-km nahi):');
    weddingPkgs.forEach((pk) => {
      lines.push(
        `- ${pk.category} / ${pk.name}: ${money(pk.price)}` +
        (pk.extraKmCharge ? `, extra km ${money(pk.extraKmCharge)}` : '') +
        (pk.extraHourCharge ? `, extra ghanta ${money(pk.extraHourCharge)}` : '')
      );
    });
  }

  const fuel = s.fuelAdjustment || {};
  if (fuel.enabled) {
    lines.push(
      `FUEL ADJUSTMENT: diesel-petrol mehnga hone par kiraya thoda badhta hai, ` +
      `par zyada se zyada ${fuel.maxAdjustmentPercent ?? 5}% — usse upar kabhi nahi.`
    );
  }

  const bf = s.bookingFee || {};
  if (bf.enabled) lines.push(`BOOKING FEE: har ride pe ${money(bf.amount)}.`);

  const r = s.referral || {};
  if (r.enabled !== false) {
    lines.push(
      `REFER & EARN: apna code share karo. Dost ki PEHLI POORI ride ke baad ` +
      `tumhe ${money(r.referrerReward ?? 50)} aur use ${money(r.refereeReward ?? 50)} milte hain. ` +
      `Sign-up pe nahi — pehli ride poori hone par.`
    );
  }

  // ── Surge — sirf tab bolo jab sach mein chal rahi ho ────────────────────
  const surge = s.surge || {};
  const activeSurge = Object.values(surge).find((v) => v && v.enabled && v.multiplier > 1);
  if (activeSurge) {
    lines.push(
      `SURGE: abhi ${activeSurge.multiplier}x kiraya chal raha hai` +
      (activeSurge.reason ? ` (${activeSurge.reason})` : '') + '.'
    );
  }

  const g = s.general || {};
  if (g.supportPhone) lines.push(`SUPPORT PHONE: ${g.supportPhone}`);

  return lines.join('\n');
};

/**
 * Poora system prompt — static gyaan + aaj ke live rates + guardrails.
 */
const buildSupportPrompt = async () => {
  let live = '';
  try {
    live = await buildLiveFacts();
  } catch {
    // Settings na mile to bot static gyaan pe chalta rahe — rates ke bina bhi
    // baaki sab sawaalon ke jawab de sakta hai.
  }

  return `Tum GaonConnect ke customer support assistant ho. Neeche di gayi
jaankari ke aadhar par customer ke sawaalon ka jawab do.

${STATIC_FACTS}

${live ? `AAJ KI LIVE JAANKARI (yahi sahi hai, ismein se hi rate batao):\n${live}` : ''}

JAWAB KAISE DENA HAI
- Simple Hinglish ya Hindi mein, chhota aur seedha. Customer gaon ka hai —
  lamba English paragraph mat likho.
- Upar di gayi jaankari se GaonConnect ke baare mein kuch bhi pooche, khul kar
  batao — sevayein, rate, policy, safety, driver kaise banein, sab.
- Rate hamesha upar wali "LIVE JAANKARI" se batao. Apni taraf se koi number mat
  banao.

YE KABHI MAT KARNA
- Customer ki APNI ride/booking/payment ki detail tumhare paas nahi hai. Ride ka
  status, driver ka naam, ya uske kisi ride ka fare kabhi mat batao — bolo ki
  wo app ki "My Rides" screen pe dikhega. (Platform ke general rate batana theek
  hai — wo upar diye hain.)
- Refund ya paisa wapas karne ka vaada kabhi mat karo. "Report an Issue" se
  shikayat darj karne ko kaho.
- Suraksha ya emergency ki baat ho to turant bolo: SOS button dabayein ya 112
  call karein. Khud koi salah mat do.
- Kisi driver ki personal jaankari (number, ghar) kabhi mat do.
- Jo upar nahi likha aur tumhe nahi pata — saaf bolo "ye mujhe nahi pata" aur
  support number de do. Andaza laga kar galat jawab dene se yahi behtar hai.`;
};

module.exports = { buildSupportPrompt };
