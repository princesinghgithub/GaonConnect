// One-time migration: Provider.vehicle (embedded, single-vehicle-per-provider)
// -> separate Vehicle collection (multi-vehicle-per-provider).
//
// Usage:
//   node scripts/migrateVehicles.js --dry-run   (logs only, no writes)
//   node scripts/migrateVehicles.js             (writes)
//
// Safe to re-run — already-migrated providers are skipped.

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Provider = require('../models/Provider');
const Vehicle = require('../models/Vehicle');

dotenv.config();

const isDryRun = process.argv.includes('--dry-run');

const migrate = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to MongoDB${isDryRun ? ' (DRY RUN — no writes)' : ''}`);

  // The old Provider schema had a unique, non-sparse index on `vehicle.number`.
  // New Provider docs no longer set that field, so Mongo treats it as null —
  // and a non-sparse unique index rejects a second null. Must drop it before
  // any new provider (beyond the first) can register.
  const providerIndexes = await mongoose.connection.db.collection('providers').indexes();
  if (providerIndexes.some((i) => i.name === 'vehicle.number_1')) {
    if (isDryRun) {
      console.log('[dry-run] would drop stale index vehicle.number_1 on providers collection');
    } else {
      await mongoose.connection.db.collection('providers').dropIndex('vehicle.number_1');
      console.log('Dropped stale index vehicle.number_1 on providers collection');
    }
  }

  // Read raw docs — Provider schema no longer declares `vehicle`, but the field
  // still physically exists on old documents in Mongo, so .lean() reads it as-is.
  const providers = await Provider.find({ vehicle: { $exists: true, $ne: null } }).lean();

  const summary = {
    providersScanned: providers.length,
    vehiclesCreated: 0,
    skippedAlreadyMigrated: 0,
    conflicts: 0,
  };

  for (const provider of providers) {
    const rawVehicle = provider.vehicle;
    if (!rawVehicle || !rawVehicle.number) continue;

    const number = String(rawVehicle.number).trim().toUpperCase();
    const existing = await Vehicle.findOne({ number });

    if (existing) {
      if (existing.providerId.toString() === provider._id.toString()) {
        summary.skippedAlreadyMigrated++;
        if (!isDryRun && !provider.activeVehicle) {
          await Provider.updateOne({ _id: provider._id }, { $set: { activeVehicle: existing._id } });
        }
      } else {
        summary.conflicts++;
        console.warn(
          `CONFLICT: vehicle number ${number} already belongs to provider ${existing.providerId} ` +
          `but is also on provider ${provider._id} — skipped, needs manual review.`
        );
      }
      continue;
    }

    console.log(`${isDryRun ? '[dry-run] would create' : 'Creating'} Vehicle ${number} (${rawVehicle.type}) for provider ${provider._id}`);

    if (isDryRun) {
      summary.vehiclesCreated++;
      continue;
    }

    const vehicle = await Vehicle.create({
      providerId: provider._id,
      type: rawVehicle.type,
      number,
      model: rawVehicle.model || '',
      color: rawVehicle.color || '',
      registrationYear: rawVehicle.registrationYear,
      documents: {
        rc: provider.documents?.rc,
        license: provider.documents?.license,
        insurance: provider.documents?.insurance,
      },
      isVerified: !!provider.isApproved,
      isActive: true,
    });

    await Provider.updateOne({ _id: provider._id }, { $set: { activeVehicle: vehicle._id } });
    summary.vehiclesCreated++;
  }

  console.log('\n--- Migration summary ---');
  console.log(summary);

  await mongoose.disconnect();
  process.exit(0);
};

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
