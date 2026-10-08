const DELIVERY_TIMEOUT_MS = 7000;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

async function sendVerificationEmail({ email, name, code }) {
  const mode = (process.env.EMAIL_DELIVERY_MODE || (process.env.NODE_ENV === 'production' ? 'resend' : 'console')).toLowerCase();
  if (mode === 'console' && process.env.NODE_ENV !== 'production') {
    console.info(`[DEV EMAIL] Verification code for ${email}: ${code}`);
    return;
  }
  if (mode !== 'resend') throw new Error('Unsupported email delivery mode.');
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new Error('Email verification service is not configured.');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `papertrade-verification-${email}-${code}` },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM, to: [email], subject: `${code} is your PaperTrade verification code`,
        text: `Hi ${name || 'Trader'},\n\nYour PaperTrade verification code is ${code}. It expires in 10 minutes.`,
        html: `<div style="font-family:Arial,sans-serif;color:#181410"><p>Hi ${escapeHtml(name || 'Trader')},</p><p>Your PaperTrade verification code is:</p><p style="font-size:28px;letter-spacing:6px;font-weight:700">${escapeHtml(code)}</p><p>This code expires in 10 minutes.</p></div>`,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Verification email could not be sent.');
  } finally { clearTimeout(timeoutId); }
}

module.exports = { sendVerificationEmail };
