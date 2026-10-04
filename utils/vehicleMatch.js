// ─────────────────────────────────────────────────────────────────────────────
// Kaunsi gaadi kis ride ke liye chalegi — ek hi jagah.
//
// Ride mein category (car → sedan), AC, aur kaam ke hisaab se auzaar ki maang
// ho sakti hai. Ye niyam instant dispatch, scheduled ride, driver ki list aur
// accept — sab jagah ek jaisa hona chahiye, warna driver ko aisi request
// dikhegi jo wo le hi nahi sakta (ya ulta).
//
// Niyam:
//   • gaadi ka type ride ke type se mile — YA wo gaadi us ride ko "serve"
//     karti ho (SERVED_BY): thresher ki booking thresher machine ke saath
//     thresher wala tractor bhi le sakta hai; wedding ki booking wo car jiske
//     driver ne "shaadi ki booking bhi lunga" chuna ho.
//   • ride mein category ho to gaadi ki category wahi ho — YA gaadi par
//     category set hi na ho (purani registered gaadiyan; unhe rokna nahi hai)
//   • ride mein AC maanga ho to sirf wo gaadi nahi chalegi jisme saaf
//     "AC nahi" likha hai (hasAC === false)
//   • kaam ko koi auzaar chahiye (rotavator, trolley...) to gaadi ke paas unme
//     se koi ek ho — YA gaadi ki auzaar-suchi khaali ho (purani registration,
//     jab auzaar poochhe hi nahi jaate the; unhe rokna nahi hai)
// ─────────────────────────────────────────────────────────────────────────────

const EQUIPMENT_DEFAULTS = require('../config/equipmentDefaults');

/**
 * Ride ka type → aur kaun-si gaadiyan ise le sakti hain (apne type ke alawa).
 * `equipment` wali shart SAKHT hai: khaali auzaar-suchi wali purani gaadi
 * yahan nahi chalti — purana tractor thresher ki booking kabhi leta hi nahi
 * tha, use achanak bhejna galat hoga.
 */
const SERVED_BY = {
  // (Thresher ab alag gaadi nahi — Tractor ka kaam "threshing" hai, neeche
  // SERVICE_EQUIPMENT. Wedding Car seva band hai: config/retiredVehicleTypes.js.)
};

/**
 * Kaam (serviceType) → kaunse auzaar se ho sakta hai. Inme se KOI EK chahiye.
 * Id config/equipmentDefaults.js wale hain. Jo kaam yahan nahi hai (jaise
 * "Koi Aur Kaam", JCB ki aam khudai) uske liye koi auzaar shart nahi.
 */
const SERVICE_EQUIPMENT = {
  tractor: {
    ploughing:      ['plough'],
    rotavator:      ['rotavator'],
    cultivator:     ['cultivator'],
    seed_drill:     ['seed_drill'],
    land_leveling:  ['leveler', 'laser_land_leveler'],
    crop_transport: ['trolley', 'trailer'],
    sand_brick:     ['trolley', 'trailer'],
    goods:          ['trolley', 'trailer'],
    spray:          ['sprayer'],
    tanker:         ['water_tanker'],
    threshing:      ['thresher'],
    straw_reaper:   ['straw_reaper'],
    baling:         ['baler'],
    post_hole:      ['post_hole_digger', 'earth_auger'],
  },
  jcb: {
    breaking: ['breaker'],
    drilling: ['auger'],
  },
};

/**
 * Ye auzaar SAKHT hain: inki booking sirf usi gaadi ko jaati hai jisne
 * registration / "मेरे वाहन" mein saaf likha ho ki uske paas yeh hai. Purani
 * gaadi (khaali auzaar-suchi) ko bhi nahi — thresher mehnga aur khaas auzaar
 * hai; bina thresher wala tractor khet par pahunche to customer ka din jaata hai.
 * Baaki auzaar (hal, trolley…) mein purani gaadi ko chhoot hai, kyunki wo aam hain.
 */
const STRICT_EQUIPMENT = ['thresher'];

/** Is ride ke kaam ke liye kaunse auzaar chalenge — [] matlab koi shart nahi. */
const requiredEquipment = (ride) =>
  SERVICE_EQUIPMENT[ride?.vehicleType]?.[ride?.serviceType] || [];

/** Ride ke type ke liye kaun-kaun si gaadi chalti hai: [{type, equipment?}] */
const servers = (rideType) => SERVED_BY[rideType] || [{ type: rideType }];

/** Ye gaadi kin-kin ride types ki booking le sakti hai (apna type + SERVED_BY). */
const rideTypesFor = (vehicle) => {
  if (!vehicle?.type) return [];
  const has = Array.isArray(vehicle.equipment) ? vehicle.equipment : [];
  const out = new Set();
  // Apna type — jab tak wo type kisi aur ke zariye hi serve na hota ho
  if (!SERVED_BY[vehicle.type] || SERVED_BY[vehicle.type].some((s) => s.type === vehicle.type && !s.equipment)) {
    out.add(vehicle.type);
  }
  for (const [rideType, list] of Object.entries(SERVED_BY)) {
    if (list.some((s) => s.type === vehicle.type && (!s.equipment || has.includes(s.equipment)))) out.add(rideType);
  }
  return [...out];
};

/** Vehicle.find() ke liye filter. */
/**
 * Upar wali category (Uber/Rapido jaisa): Mini ki booking par paas mein Mini
 * na mile to Sedan/SUV wala driver bhi le sakta hai — customer ko Mini ke hi
 * daam mein badi gaadi. Sirf tab jab driver ne mana na kiya ho
 * (vehicle.servesLowerCategory !== false).
 *
 * `variantOrder` — us type ki categories chhoti se badi (admin ka kram,
 * jaise ['hatchback','sedan','suv']). Na diya to upgrade band — sirf wahi
 * category.
 */
const higherVariants = (ride, variantOrder) => {
  const order = Array.isArray(variantOrder) ? variantOrder : [];
  const i = order.indexOf(ride?.vehicleVariant);
  return i === -1 ? [] : order.slice(i + 1);
};

const vehicleFilterForRide = (ride, { variantOrder } = {}) => {
  const and = [];
  and.push({
    $or: servers(ride.vehicleType).map((s) => (s.equipment ? { type: s.type, equipment: s.equipment } : { type: s.type })),
  });
  if (ride.vehicleVariant) {
    const higher = higherVariants(ride, variantOrder);
    and.push({
      $or: [
        { variant: { $in: [ride.vehicleVariant, '', null] } },
        ...(higher.length ? [{ variant: { $in: higher }, servesLowerCategory: { $ne: false } }] : []),
      ],
    });
  }
  if (ride.ac)             and.push({ hasAC: { $ne: false } });
  const need = requiredEquipment(ride);
  if (need.length) {
    and.push({
      $or: [
        { equipment: { $in: need } },
        { equipment: { $exists: false } },
        { equipment: { $size: 0 } },
      ],
    });
  }
  // Customer ne khud jo upkaran chune — SAB chahiye (hal + rotavator maanga
  // to sirf hal wala nahi chalega). Purani gaadi (khaali suchi) ko rokte nahi.
  const chosen = chosenEquipment(ride);
  if (chosen.length) {
    and.push({
      $or: [
        { equipment: { $all: chosen } },
        { equipment: { $exists: false } },
        { equipment: { $size: 0 } },
      ],
    });
  }
  // Sakht auzaar (thresher) — gaadi par saaf likha hona chahiye, chhoot nahi
  const strict = [...new Set([...need, ...chosen])].filter((e) => STRICT_EQUIPMENT.includes(e));
  strict.forEach((e) => and.push({ equipment: e }));

  // Kam se kam itne HP ka tractor. HP na bataya ho (purana) to rokte nahi.
  if (ride.minHorsepower > 0) {
    and.push({
      $or: [
        { horsepower: { $gte: ride.minHorsepower } },
        { horsepower: { $exists: false } },
        { horsepower: null },
      ],
    });
  }
  return { $and: and };
};

/** Customer ke chune upkaran — sirf wahi jo us ride ki gaadi ke liye maane jaate hain */
const chosenEquipment = (ride) => (Array.isArray(ride?.equipment) ? ride.equipment.filter(Boolean) : []);

/** Ek gaadi (document ya plain object) is ride ke liye theek hai ya nahi. */
const vehicleFitsRide = (vehicle, ride, { variantOrder } = {}) => {
  if (!vehicle || !rideTypesFor(vehicle).includes(ride.vehicleType)) return false;
  if (ride.vehicleVariant && vehicle.variant && vehicle.variant !== ride.vehicleVariant) {
    const upgrade = higherVariants(ride, variantOrder).includes(vehicle.variant)
      && vehicle.servesLowerCategory !== false;
    if (!upgrade) return false;
  }
  if (ride.ac && vehicle.hasAC === false) return false;
  const need = requiredEquipment(ride);
  const has = Array.isArray(vehicle.equipment) ? vehicle.equipment : [];
  if (need.length && has.length && !need.some((e) => has.includes(e))) return false;
  const chosen = chosenEquipment(ride);
  if (chosen.length && has.length && !chosen.every((e) => has.includes(e))) return false;
  // Sakht auzaar (thresher) — purani khaali suchi wali gaadi ko bhi nahi
  const strict = [...need, ...chosen].filter((e) => STRICT_EQUIPMENT.includes(e));
  if (strict.some((e) => !has.includes(e))) return false;
  if (ride.minHorsepower > 0 && typeof vehicle.horsepower === 'number' && vehicle.horsepower < ride.minHorsepower) return false;
  return true;
};

/**
 * Driver app se aayi auzaar-suchi ko saaf karo — array, JSON string ya comma
 * wali string, teeno chalti hain (multipart form mein array seedha nahi jaata).
 * Sirf us gaadi ke jaane-pehchane id bachte hain; "other" aur anjaan id hata
 * dete hain, warna galat id wali gaadi ko kabhi koi booking nahi milti.
 * `undefined` lautata hai jab kuch bheja hi nahi gaya — taaki purana app
 * field ko khaali array se overwrite na kare.
 */
const sanitizeEquipment = (vehicleType, raw) => {
  if (raw === undefined || raw === null || raw === '') return undefined;
  let list = raw;
  if (typeof raw === 'string') {
    try { list = JSON.parse(raw); } catch { list = raw.split(','); }
  }
  if (!Array.isArray(list)) return undefined;
  const allowed = new Set(
    (EQUIPMENT_DEFAULTS[vehicleType]?.equipment || []).map((e) => e.id).filter((id) => id !== 'other'),
  );
  return [...new Set(list.map((x) => String(x).trim().toLowerCase()).filter((id) => allowed.has(id)))];
};

/** JCB ka model (3DX, excavator...) — sirf jaane-pehchane id, warna khaali. */
const sanitizeVariant = (vehicleType, raw) => {
  const id = String(raw || '').trim().toLowerCase();
  if (!id) return '';
  if (vehicleType === 'car') return id; // car ki categories admin-managed hain
  const ids = (EQUIPMENT_DEFAULTS[vehicleType]?.variants || []).map((v) => v.id);
  return ids.includes(id) ? id : '';
};

/**
 * Kya is type ki gaadi driver khud register kar sakta hai. Wedding nahi —
 * uski booking car wale lete hain (SERVED_BY), "wedding" naam ki gaadi nahi hoti.
 */
const isRegistrableType = (type) => !SERVED_BY[type] || SERVED_BY[type].some((s) => s.type === type);

module.exports = {
  vehicleFilterForRide, vehicleFitsRide, requiredEquipment, rideTypesFor, isRegistrableType, higherVariants,
  SERVICE_EQUIPMENT, SERVED_BY, sanitizeEquipment, sanitizeVariant,
};
