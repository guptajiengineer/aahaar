const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send a verification email with a 6-digit OTP.
 */
const sendVerificationEmail = async (to, name, otp) => {
  const transporter = createTransporter();

  const html = `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #FAF7F2; border-radius: 16px; padding: 40px; color: #2C2416;">
      <h2 style="color: #3D6B4F; margin: 0 0 8px;">Welcome to Aahaar, ${name}! 🙏</h2>
      <p style="margin: 0 0 24px; color: #5a4a35;">Please verify your email address to get started.</p>
      <div style="background: #F0EBE1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-size: 14px;">Your verification code is:</p>
        <span style="font-size: 40px; font-weight: 600; letter-spacing: 8px; color: #3D6B4F;">${otp}</span>
        <p style="margin: 12px 0 0; font-size: 12px; color: #8a7460;">This code expires in 10 minutes.</p>
      </div>
      <p style="font-size: 13px; color: #8a7460;">If you didn't create an account, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #E2D9CE; margin: 24px 0;">
      <p style="font-size: 12px; color: #8a7460; margin: 0;">Aahaar — Food for everyone, wasted by no one.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Aahaar" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${otp} is your Aahaar verification code`,
    html,
  });
};

/**
 * Send approval/rejection notification email.
 */
const sendApprovalEmail = async (to, name, approved, reason = '') => {
  const transporter = createTransporter();

  const subject = approved
    ? 'Your Aahaar account has been approved! 🎉'
    : 'Update on your Aahaar account application';

  const html = approved
    ? `<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #FAF7F2; border-radius: 16px; padding: 40px; color: #2C2416;">
        <h2 style="color: #3D6B4F;">You're live on Aahaar, ${name}!</h2>
        <p>Your account has been verified and approved. You can now log in and start making an impact.</p>
        <a href="${process.env.CLIENT_URL}/login" style="display:inline-block;background:#3D6B4F;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">Go to Dashboard</a>
      </div>`
    : `<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #FAF7F2; border-radius: 16px; padding: 40px; color: #2C2416;">
        <h2 style="color: #C0392B;">Application not approved</h2>
        <p>Hi ${name}, unfortunately your application could not be approved at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>Please contact us if you believe this is an error.</p>
      </div>`;

  await transporter.sendMail({
    from: `"Aahaar" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

/**
 * Send password reset email.
 */
const sendPasswordResetEmail = async (to, name, resetUrl) => {
  const transporter = createTransporter();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #FAF7F2; border-radius: 16px; padding: 40px; color: #2C2416;">
      <h2 style="color: #3D6B4F;">Reset your password</h2>
      <p>Hi ${name}, we received a request to reset your Aahaar password.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#E8943A;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;margin: 16px 0;">Reset Password</a>
      <p style="font-size: 13px; color: #8a7460;">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Aahaar" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your Aahaar password',
    html,
  });
};

module.exports = { sendVerificationEmail, sendApprovalEmail, sendPasswordResetEmail };
