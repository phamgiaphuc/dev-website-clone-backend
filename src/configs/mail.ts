import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library"
import { ADMIN_EMAIL_ADDRESS, GOOGLE_MAILER_CLIENT_ID, GOOGLE_MAILER_CLIENT_SECRET, GOOGLE_MAILER_REFRESH_TOKEN } from "./environment";
import { logger } from "./logger";

const mailOAuth2Client = new OAuth2Client(GOOGLE_MAILER_CLIENT_ID, GOOGLE_MAILER_CLIENT_SECRET);

mailOAuth2Client.setCredentials({
  refresh_token: GOOGLE_MAILER_REFRESH_TOKEN,
})

export const sendVerificationCode = async (code: string, email: string, fullname: string) => {
  try {
    const accessTokenObject = await mailOAuth2Client.getAccessToken();
    const access_token = accessTokenObject?.token;
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: ADMIN_EMAIL_ADDRESS,
        clientId: GOOGLE_MAILER_CLIENT_ID,
        clientSecret: GOOGLE_MAILER_CLIENT_SECRET,
        refresh_token: GOOGLE_MAILER_REFRESH_TOKEN,
        accessToken: access_token
      }
    } as nodemailer.TransportOptions);
    const mailOptions = {
      to: email,
      subject: 'Account Verification - DEV Clone Website 🚀',
      html: `
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.2); font-size:18px">
          <h2 style="color: #333; text-align: center">Welcome to DEV Clone Website 🚀</h2>
            <p style="color: #666; margin-bottom: 15px;">Hi ${fullname}. You are now signing up for a new account.</p>
            <p style="color: #666; margin-bottom: 15px;">Here's a verification code. Make sure you enter the code correctly.</p>
            <div style="text-align: center; padding: 4px; background-color: #f8f8f8; border-radius: 8px; font-size: 18px; margin-bottom: 20px;">
              <h2>${code}</h2>
            </div>
            <p style="color: #666; margin-bottom: 15px;">Stay tuned for more updates on our website.</p>
        </div>
      `
    }
    await transport.sendMail(mailOptions);
    logger.info(`Verification mail sent to ${email} successfully.`);
  } catch (error) {
    console.log(error);
    logger.error(error.message);
  }
} 