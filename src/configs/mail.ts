import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library"
import { ADMIN_EMAIL_ADDRESS, GOOGLE_MAILER_CLIENT_ID, GOOGLE_MAILER_CLIENT_SECRET, GOOGLE_MAILER_REFRESH_TOKEN } from "./environment";
import { logger } from "./logger";

const mailOAuth2Client = new OAuth2Client(GOOGLE_MAILER_CLIENT_ID, GOOGLE_MAILER_CLIENT_SECRET);

mailOAuth2Client.setCredentials({
  refresh_token: GOOGLE_MAILER_REFRESH_TOKEN,
})

export const sendVerificationCode = async (code: string, email: string) => {
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
      subject: 'Account Verification',
      html: `<h3>Your verification code is ${code}</h3>`
    }
    await transport.sendMail(mailOptions);
    logger.info(`Verification mail sent to ${email} successfully.`);
  } catch (error) {
    console.log(error);
    logger.error(error.message);
  }
} 