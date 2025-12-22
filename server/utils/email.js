const nodemailer = require('nodemailer');
let transporter = null;
let verified = false;
let verificationTried = false;

function createTransporter() {
  if (transporter) return transporter;
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('[email] SMTP not configured (EMAIL_HOST/EMAIL_USER/EMAIL_PASSWORD missing). Email sending disabled.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  return transporter;
}

async function verifyTransporter() {
  if (verificationTried) return verified;
  verificationTried = true;
  const t = createTransporter();
  if (!t) return false;
  try {
    await t.verify();
    verified = true;
    console.log('[email] SMTP transporter verified');
  } catch (err) {
    verified = false;
    console.error('[email] SMTP verification failed:', err && err.message ? err.message : err);
  }
  return verified;
}

/**
 * Send mail safely. Never throws — always resolves to an object {ok: boolean, info?, error?}
 */
async function sendMailSafe(mailOptions = {}) {
  const t = createTransporter();
  if (!t) {
    return { ok: false, error: new Error('SMTP not configured') };
  }

  // verify once
  if (!verificationTried) await verifyTransporter();
  if (!verified) {
    return { ok: false, error: new Error('SMTP credentials invalid or verification failed') };
  }

  try {
    const info = await t.sendMail(mailOptions);
    return { ok: true, info };
  } catch (err) {
    console.error('[email] sendMail error:', err && err.message ? err.message : err);
    return { ok: false, error: err };
  }
}

module.exports = { createTransporter, verifyTransporter, sendMailSafe };
