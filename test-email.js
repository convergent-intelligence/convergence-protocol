const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmx.com',
  port: 587,
  secure: false,
  tls: {
    rejectUnauthorized: false
  },
  auth: {
    user: 'kristopherr@gmx.com',
    pass: process.env.AGENT_EMAIL_PASSWORD,
  },
});

const mailOptions = {
  from: 'kristopherr@gmx.com',
  to: 'kristopherrichards78@gmail.com',
  subject: 'Test Email from Convergence Server',
  text: 'This is a test email from the convergence mail server routing through GMX.',
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log(`Error: ${error}`);
    process.exit(1);
  }
  console.log(`Message sent: ${info.messageId}`);
  process.exit(0);
});
