// Saathi incentive rules — ek hi jagah, taaki rate badalna ho to poore module
// mein dhoondhna na pade. Har value .env se override ho sakti hai.

const num = (envKey, fallback) => {
  const raw = process.env[envKey];
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

module.exports = {
  // Referred driver verify ho gaya AUR uski pehli ride complete ho gayi
  DRIVER_ACTIVATION: num('SAATHI_REWARD_DRIVER', 100),

  // Referred customer ki pehli ride complete ho gayi
  CUSTOMER_FIRST_BOOKING: num('SAATHI_REWARD_CUSTOMER', 30),

  // Withdrawal ke rules
  MIN_WITHDRAWAL: num('SAATHI_MIN_WITHDRAWAL', 200),
  MAX_WITHDRAWAL: num('SAATHI_MAX_WITHDRAWAL', 25000),

  // Kitni activations pe kitna bonus. Ascending order mein rakhna.
  MILESTONES: [
    { activations: 10, amount: num('SAATHI_MILESTONE_10', 200), label: '10 Activation Bonus' },
    { activations: 25, amount: num('SAATHI_MILESTONE_25', 500), label: '25 Activation Bonus' },
  ],

  // Dashboard ka monthly goal (progress bar ke liye)
  MONTHLY_GOAL: num('SAATHI_MONTHLY_GOAL', 25),

  // Referral links — portal in par QR banata hai
  DRIVER_LINK:   process.env.SAATHI_DRIVER_LINK   || 'https://gaonconnect.in/driver',
  CUSTOMER_LINK: process.env.SAATHI_CUSTOMER_LINK || 'https://gaonconnect.in/book',
};
