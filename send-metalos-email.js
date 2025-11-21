
const nodemailer = require('nodemailer');
const fs = require('fs');
require('dotenv').config();

// Read the email content from the file
const emailContent = fs.readFileSync('METALOS_EMAIL_TO_SEND.txt', 'utf8');

// Parse the email content to get the to, cc, from, subject, and body
const lines = emailContent.split('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const to = lines[2].match(/TO: (.*)/)[1];
const cc = lines[2].match(/CC: (.*)/)[1];
const from = lines[2].match(/FROM: (.*)/)[1];
const subject = lines[2].match(/SUBJECT: (.*)/)[1];
const body = lines[4];


// Create a transporter object using the SMTP transport
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'kristopherr@gmx.com', // your-email@example.com
    pass: process.env.AGENT_EMAIL_PASSWORD, // your-email-password
  },
});

// Define the email options
const mailOptions = {
  from: from,
  to: to,
  cc: cc,
  subject: subject,
  text: body,
};

// Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.log(`Error: ${error}`);
  }
  console.log(`Message sent: ${info.messageId}`);
});
