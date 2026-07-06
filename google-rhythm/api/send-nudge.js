import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { partnerEmail, partnerSummary, magicLink, userName } = req.body;

  if (!partnerEmail || !partnerSummary || !magicLink) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;

  if (!gmailUser || !gmailPass) {
    console.error("Missing GMAIL_USER or GMAIL_PASS environment variables.");
    return res.status(500).json({ error: 'Server email misconfiguration' });
  }

  const escapeHtml = (unsafe) => {
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const safeSummary = escapeHtml(partnerSummary);
  const safeLink = escapeHtml(magicLink);
  const safeName = escapeHtml(userName || 'your partner');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass
    }
  });

  const mailOptions = {
    from: `"Rhythm AI Concierge" <${gmailUser}>`,
    to: partnerEmail,
    subject: `Weekly Rhythm Nudge: Update for ${safeName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f2f2f7; padding: 40px 20px; color: #1c1c1e;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 48px; height: 48px; background-color: #E8F2FF; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
              <span style="color: #007AFF; font-size: 24px;">✨</span>
            </div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Weekly Nudge</h1>
            <p style="margin: 4px 0 0; font-size: 13px; font-weight: 600; color: #8e8e93; text-transform: uppercase; letter-spacing: 1px;">AI Relationship Coach</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e5ea; margin: 24px 0;" />
          
          <p style="font-size: 16px; line-height: 1.6; color: #3a3a3c; font-weight: 500;">
            ${safeSummary}
          </p>
          
          <div style="margin-top: 32px; text-align: center;">
            <a href="${safeLink}" style="display: inline-block; background-color: #007AFF; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 28px; border-radius: 12px;">
              View Secure Dashboard
            </a>
          </div>
          
          <p style="margin-top: 32px; font-size: 12px; color: #8e8e93; text-align: center;">
            This is an automated digest sent via Google Rhythm.<br/>
            End-to-End Encrypted.
          </p>
        </div>
      </div>
    `
  };

  try {
    // Attempt to send email
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error("Nodemailer error:", error);
    return res.status(500).json({ error: 'Failed to send email. Check GMAIL_USER and GMAIL_PASS in your .env file.', details: error.message });
  }
}
