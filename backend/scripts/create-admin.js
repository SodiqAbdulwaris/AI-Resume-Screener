/**
 * One-off admin provisioning script — run manually, never via an HTTP route.
 * Admins are deliberately not self-registerable (POST /auth/register only
 * accepts candidate/recruiter) to avoid privilege escalation through the
 * public signup form.
 *
 * Usage:
 *   node scripts/create-admin.js <fullName> <email> <password>
 */
const mongoose = require('mongoose');
const config = require('../src/config/env');
const User = require('../src/models/User');

async function main() {
  const [fullName, email, password] = process.argv.slice(2);

  if (!fullName || !email || !password) {
    console.error('Usage: node scripts/create-admin.js <fullName> <email> <password>');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters long.');
    process.exit(1);
  }

  await mongoose.connect(config.mongodbUri);

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    console.error(`A user with email ${normalizedEmail} already exists (role: ${existing.role}).`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const admin = await User.create({
    fullName,
    email: normalizedEmail,
    password,
    role: 'admin',
    isVerified: true, // no email-verification loop for an operator-provisioned account
  });

  console.log(`Admin account created: ${admin.email} (id: ${admin._id})`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed to create admin:', err);
  process.exit(1);
});
