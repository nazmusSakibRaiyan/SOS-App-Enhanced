// utils/sendEmail.js
import nodemailer from "nodemailer";
import dotenv from 'dotenv';

dotenv.config();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);

});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5
});


const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; 


const retry = async (fn, retries, delay, ...args) => {
  try {
    return await fn(...args);
  } catch (error) {

    if (error.responseCode === 421 && retries > 0) {
      console.log(`Temporary email error, retrying (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, delay));

      return retry(fn, retries - 1, delay * 1.5, ...args);
    }
    
    console.error(`Email error after ${MAX_RETRIES} retries:`, error);

    return null;
  }
};

export const sendEmail = async (to, subject, text, html = null) => {
  const mailOptions = {
    from: `"Quick Response Team" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html: html || undefined
  };

  try {

    const info = await retry(async () => {
      return await transporter.sendMail(mailOptions);
    }, MAX_RETRIES, RETRY_DELAY);
    
    if (info) {
      console.log("Email sent:", info.messageId);
      return info;
    } else {
      console.warn("Failed to send email after retries");
      return null;
    }
  } catch (error) {
    console.error("Failed to send email:", error);

    return null;
  }
};

export const sendBroadcastEmail = async (to, subject, text) => {
  return sendEmail(to, subject, text);
};


export const sendSOSEmergencyAlert = async (to, userName, message, coordinates, timestamp) => {
  const subject = `URGENT: SOS EMERGENCY ALERT - ${userName} NEEDS HELP`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #ff0000; border-radius: 5px;">
      <h2 style="color: #ff0000; text-align: center;">EMERGENCY SOS ALERT</h2>
      <p style="font-size: 16px; margin-bottom: 20px;"><strong>${userName}</strong> has triggered an emergency SOS alert and may need immediate assistance.</p>
      <p style="font-size: 16px;"><strong>Message:</strong> ${message || 'No message provided'}</p>
      <p style="font-size: 16px;"><strong>Location:</strong> <a href="https://maps.google.com/?q=${coordinates.latitude},${coordinates.longitude}" target="_blank">View on Google Maps</a></p>
      <p style="font-size: 16px;"><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
      <div style="margin-top: 30px; padding: 15px; background-color: #f8f8f8; border-radius: 5px;">
        <p style="font-size: 14px; margin: 0;">This is an automated emergency alert from the Quick Response Team app. Please contact emergency services if you believe this is a serious situation.</p>
      </div>
    </div>
  `;
  
  const textContent = `
    EMERGENCY SOS ALERT
    
    ${userName} has triggered an emergency SOS alert and may need immediate assistance.
    
    Message: ${message || 'No message provided'}
    Location: https://maps.google.com/?q=${coordinates.latitude},${coordinates.longitude}
    Time: ${new Date(timestamp).toLocaleString()}
    
    This is an automated emergency alert from the Quick Response Team app. Please contact emergency services if you believe this is a serious situation.
  `;
  
  return sendEmail(to, subject, textContent, htmlContent).catch(error => {
    console.error("Failed to send emergency alert:", error);
    return null;
  });
};

export const sendSMS = async (phoneNumber, message, carrier) => {
  try {
    const carriers = {
      'att': `${phoneNumber}@txt.att.net`,
      'tmobile': `${phoneNumber}@tmomail.net`,
      'verizon': `${phoneNumber}@vtext.com`,
      'sprint': `${phoneNumber}@messaging.sprintpcs.com`,
      'boost': `${phoneNumber}@sms.myboostmobile.com`,
      'cricket': `${phoneNumber}@sms.cricketwireless.net`,
      'metro': `${phoneNumber}@mymetropcs.com`,
      'uscellular': `${phoneNumber}@email.uscc.net`,
      'virgin': `${phoneNumber}@vmobl.com`,
    };
    
    let recipient;
    if (carrier && carriers[carrier.toLowerCase()]) {
      recipient = carriers[carrier.toLowerCase()];
    } else {
      recipient = [
        carriers.att,
        carriers.tmobile, 
        carriers.verizon
      ].join(',');
    }
    
    const mailOptions = {
      from: `"EMERGENCY" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: 'SOS ALERT',
      text: message.substring(0, 160) 
    };
    
    const info = await retry(async () => {
      return await transporter.sendMail(mailOptions);
    }, MAX_RETRIES, RETRY_DELAY);
    
    if (info) {
      console.log("SMS sent via email gateway:", info.messageId);
      return info;
    }
    return null;
  } catch (error) {
    console.error("Failed to send SMS via email gateway:", error);

    return null;
  }
};
