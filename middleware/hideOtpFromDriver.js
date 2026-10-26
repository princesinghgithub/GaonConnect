// middleware/hideOtpFromDriver.js
// ─────────────────────────────────────────────────────────────────────────────
// Safar ka OTP driver tak kabhi na pahunche (Rapido/Uber jaisa).
//
// OTP isliye hai ki driver ride tabhi shuru kar sake jab sahi customer gaadi
// mein baith gaya ho — customer apne phone se padhkar batata hai. Pehle accept
// ka jawab, driver ki current ride, searching/scheduled list aur /ride/:id
// sab poori ride bhejte the, OTP samet — yaani driver customer ke bina bhi
// "OTP sahi" karke safar shuru (aur paisa) kar sakta tha.
//
// Har controller mein alag-alag hataane mein koi jagah chhoot jaati, isliye
// ek hi niyam: driver app (token ka role 'provider') ko jo bhi JSON jaaye,
// usme se har "otp" field nikal do. Customer app aur website ka role
// 'customer' hai — unhe OTP milta rehta hai. Driver apps (1.1.0 aur 1.2.0)
// OTP ko sirf aage pass karti thi, kahin padhti nahi — kuch nahi tootta.
// ─────────────────────────────────────────────────────────────────────────────
const stripOtp = (body) => JSON.parse(JSON.stringify(body), (key, value) => (key === 'otp' ? undefined : value));

module.exports = (req, res, next) => {
  const json = res.json.bind(res);
  res.json = (body) => {
    // protect route par chalta hai, isliye role res.json ke waqt hi pata hota hai
    if (req.activeRole === 'provider' && body && typeof body === 'object') {
      try {
        return json(stripOtp(body));
      } catch {
        return json(body);
      }
    }
    return json(body);
  };
  next();
};
