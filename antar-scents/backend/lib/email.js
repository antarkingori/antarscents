const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.zoho.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"Antar Scents" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;

const baseTemplate = (content) => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #1A1A1A;border-radius:16px;overflow:hidden">
        <tr>
          <td style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1400 100%);padding:36px 40px;text-align:center;border-bottom:1px solid #2a2000">
            <div style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#C8A951;font-family:Georgia,serif">ANTAR</div>
            <div style="font-size:11px;letter-spacing:8px;color:#8a7030;margin-top:2px">SCENTS</div>
          </td>
        </tr>
        ${content}
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #1A1A1A;text-align:center">
            <p style="color:#444;font-size:12px;margin:0">© ${new Date().getFullYear()} Antar Scents · Nairobi, Kenya</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const goldButton = (href, label) => `
<table cellpadding="0" cellspacing="0" style="margin:0 auto 28px">
  <tr>
    <td style="background:linear-gradient(135deg,#C8A951,#8a6d2a);border-radius:8px;padding:0">
      <a href="${href}" style="display:block;padding:14px 36px;color:#000;font-weight:bold;font-size:15px;text-decoration:none;letter-spacing:1px">${label}</a>
    </td>
  </tr>
</table>`;

async function sendVerificationEmail(to, verifyLink) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Verify Your Antar Scents Account',
    html: baseTemplate(`
      <tr>
        <td style="padding:40px">
          <h2 style="color:#fff;font-family:Georgia,serif;font-size:22px;margin:0 0 16px">Verify Your Email</h2>
          <p style="color:#999;font-size:15px;line-height:1.6;margin:0 0 28px">
            Welcome to Antar Scents! Click the button below to verify your email address and activate your account.
            This link expires in <strong style="color:#C8A951">24 hours</strong>.
          </p>
          ${goldButton(verifyLink, 'Verify Email Address')}
          <p style="color:#555;font-size:13px;line-height:1.6;margin:0 0 8px">
            If you didn't create an account, you can safely ignore this email.
          </p>
          <p style="color:#444;font-size:12px;margin:0">Or copy this link:<br>
            <a href="${verifyLink}" style="color:#C8A951;word-break:break-all">${verifyLink}</a>
          </p>
        </td>
      </tr>`),
  });
}

async function sendPasswordResetEmail(to, resetLink) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Reset Your Antar Scents Password',
    html: baseTemplate(`
      <tr>
        <td style="padding:40px">
          <h2 style="color:#fff;font-family:Georgia,serif;font-size:22px;margin:0 0 16px">Reset Your Password</h2>
          <p style="color:#999;font-size:15px;line-height:1.6;margin:0 0 28px">
            We received a request to reset your password. Click the button below — this link expires in
            <strong style="color:#C8A951">1 hour</strong>.
          </p>
          ${goldButton(resetLink, 'Reset Password')}
          <p style="color:#555;font-size:13px;line-height:1.6;margin:0 0 8px">
            If you didn't request this, your password will remain unchanged.
          </p>
          <p style="color:#444;font-size:12px;margin:0">Or copy this link:<br>
            <a href="${resetLink}" style="color:#C8A951;word-break:break-all">${resetLink}</a>
          </p>
        </td>
      </tr>`),
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
