const cron = require('node-cron');
const { runSafely } = require('../utils/safe');

// Reward sweep cron.
//
// Ride complete hone par koi hook nahi lagaya gaya — rideController bilkul
// waisa hi hai jaisa tha. Ye job periodically completed rides dekhkar pending
// rewards bana deta hai.
//
// Poora kaam runSafely ke andar hai: ye job kabhi throw nahi karta, isliye
// Saathi ka koi bug server ko nahi gira sakta.

// Har 15 minute — incentive ke liye itni der bilkul theek hai, aur DB par
// bojh bhi nahi padta.
const SCHEDULE = process.env.SAATHI_REWARD_CRON || '*/15 * * * *';

let task = null;

const startSaathiRewardJob = () => {
  if (process.env.SAATHI_REWARDS_ENABLED === 'false') {
    console.log('[saathi] Reward job band hai (SAATHI_REWARDS_ENABLED=false)');
    return null;
  }

  if (!cron.validate(SCHEDULE)) {
    console.error(`[saathi] Galat cron schedule "${SCHEDULE}" — reward job start nahi hua.`);
    return null;
  }

  task = cron.schedule(SCHEDULE, async () => {
    await runSafely('reward sweep', async () => {
      // require yahan andar hai taaki module load hone ke waqt DB models ki
      // chain na bane — server start hamesha halka rahe.
      const { runRewardSweep } = require('../services/rewards');
      const summary = await runRewardSweep();

      if (summary.rewarded || summary.milestones || summary.errors) {
        console.log(
          `[saathi] Reward sweep: ${summary.rewarded} reward, ${summary.milestones} milestone, ` +
          `${summary.statusSynced} status sync, ${summary.errors} error`
        );
      }
    });
  });

  console.log(`[saathi] Reward job chalu (${SCHEDULE})`);
  return task;
};

const stopSaathiRewardJob = () => {
  if (task) {
    task.stop();
    task = null;
  }
};

module.exports = { startSaathiRewardJob, stopSaathiRewardJob };
