#!/usr/bin/env node

/**
 * Pre-deployment prerequisite for the unique sparse index on User.b2bId.
 *
 * The audit added `unique: true, sparse: true` to the b2bId field
 * (models/User.js). MongoDB WILL REFUSE to build that unique index if
 * duplicate b2bId values already exist. This script finds colliding users
 * and appends -1, -2, ... to the newer rows so the index can be built.
 *
 * Run BEFORE deploying the new model:
 *   node src/scripts/dedupeB2bIds.js          (dry run — reports only)
 *   node src/scripts/dedupeB2bIds.js --apply  (rewrites duplicates)
 */

require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');

async function dedupeB2bIds(apply) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(apply ? '  Dedupe b2bId values (APPLY MODE)' : '  Dedupe b2bId values (DRY RUN)');
  console.log('═══════════════════════════════════════════════════════════\n');

  await connectDB();

  const duplicates = await User.aggregate([
    { $match: { b2bId: { $exists: true, $ne: '' } } },
    { $group: { _id: '$b2bId', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  if (duplicates.length === 0) {
    console.log('✅ No duplicate b2bId values found — safe to build the unique index.\n');
    await User.db.close();
    return;
  }

  console.log(`⚠️  Found ${duplicates.length} b2bId value(s) with duplicates:\n`);

  const updates = [];
  for (const group of duplicates) {
    const sorted = group.ids.sort((a, b) => a.toString().localeCompare(b.toString()));
    const keepId = sorted[0];
    const colliders = sorted.slice(1);
    console.log(`  "${group._id}": keeping ${keepId}, rewriting ${colliders.length} collider(s)`);

    for (let i = 0; i < colliders.length; i++) {
      const newB2bId = `${group._id}-${i + 1}`;
      updates.push({ id: colliders[i], old: group._id, next: newB2bId });
    }
  }

  if (!apply) {
    console.log('\nDry run — nothing changed. Re-run with --apply to rewrite:');
    for (const u of updates) {
      console.log(`    ${u.id}  "${u.old}" → "${u.next}"`);
    }
    console.log('\nAfter applying, verify with a dry run again, then build the index.\n');
    await User.db.close();
    // Exit explicitly — database.js schedules a reconnection timer after close
    // that otherwise keeps this CLI process alive forever.
    process.exit(0);
    return;
  }

  console.log('\nApplying changes...');
  for (const u of updates) {
    await User.updateOne({ _id: u.id }, { $set: { b2bId: u.next } });
    console.log(`  ✅ ${u.id}  "${u.old}" → "${u.next}"`);
  }

console.log('\n✅ Done. Re-run without --apply to confirm zero duplicates,');
  console.log('   then deploy the unique sparse index (it will now build cleanly).\n');
  await User.db.close();
  // Exit explicitly — database.js schedules a reconnection timer after close
  // that otherwise keeps this CLI process alive forever.
  process.exit(0);
}

const apply = process.argv.includes('--apply');
dedupeB2bIds(apply).catch(async (err) => {
  console.error('❌ Script failed:', err.message);
  try {
    await User.db.close();
  } catch (e) {
    /* ignore */
  }
  process.exit(1);
});