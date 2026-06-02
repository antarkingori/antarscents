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

async function sendPasswordResetEmail(to, resetLink) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter.sendMail({
    from: `"Antar Scents" <${from}>`,
    to,
    subject: 'Reset Your Antar Scents Password',
    html: `<!DOCTYPE html>
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
        <tr>
          <td style="padding:40px">
            <h2 style="color:#fff;font-family:Georgia,serif;font-size:22px;margin:0 0 16px">Reset Your Password</h2>
            <p style="color:#999;font-size:15px;line-height:1.6;margin:0 0 28px">
              We received a request to reset your password. Click the button below to create a new one.
              This link expires in <strong style="color:#C8A951">1 hour</strong>.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px">
              <tr>
                <td style="background:linear-gradient(135deg,#C8A951,#8a6d2a);border-radius:8px;padding:0">
                  <a href="${resetLink}" style="display:block;padding:14px 36px;color:#000;font-weight:bold;font-size:15px;text-decoration:none;letter-spacing:1px">
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#555;font-size:13px;line-height:1.6;margin:0 0 8px">
              If you didn&apos;t request this, you can safely ignore this email — your password won&apos;t change.
            </p>
            <p style="color:#444;font-size:12px;margin:0">Or copy this link:<br>
              <a href="${resetLink}" style="color:#C8A951;word-break:break-all">${resetLink}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #1A1A1A;text-align:center">
            <p style="color:#444;font-size:12px;margin:0">© ${new Date().getFullYear()} Antar Scents · Nairobi, Kenya</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

module.exports = { sendPasswordResetEmail };
