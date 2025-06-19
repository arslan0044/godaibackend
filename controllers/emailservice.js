const nodemailer = require("nodemailer");
const logger = require("../startup/logger"); // Adjust the path as needed

exports.sendEmail = async (email, code) => {
  // Create a Nodemailer transporter object
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "danishgoheer17@gmail.com",
      pass: "zzmftuogtusnnriu",
    },
  });

  // Email data
  const mailOptions = {
    from: "ChainAI",
    to: email, // Replace with the recipient's email address
    subject: "🔐 Your ChainAI Verification Code Inside – Let’s Get Started!",
    html: `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #ffffff;
      color: #1c1c1c;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    }

    .header {
      background-color: #000000;
      padding: 30px;
      text-align: center;
    }

    .header h1 {
      margin: 0;
      font-size: 28px;
      color: #ffffff;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .body {
      padding: 40px 30px;
      text-align: center;
    }

    .body p {
      font-size: 18px;
      color: #333333;
      line-height: 1.6;
    }

    .code-box {
      display: inline-block;
      margin: 30px 0;
      padding: 20px 40px;
      font-size: 36px;
      font-family: 'Courier New', Courier, monospace;
      background-color: #000000;
      color: #ffffff;
      border-radius: 10px;
      font-weight: bold;
      letter-spacing: 6px;
      animation: pulse 1.5s infinite ease-in-out;
    }

    .footer {
      background-color: #f1f1f1;
      text-align: center;
      padding: 20px;
      font-size: 13px;
      color: #666666;
    }

    @keyframes pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0.3); }
      70% { transform: scale(1.03); box-shadow: 0 0 8px 8px rgba(0,0,0,0.03); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0); }
    }

    @media only screen and (max-width: 600px) {
      .body p {
        font-size: 16px;
      }

      .code-box {
        font-size: 28px;
        padding: 16px 30px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>ChainAI</h1>
    </div>
    <div class="body">
      <p>Welcome to ChainAI 👋</p>
      <p>Use the verification code below to activate your account:</p>
      <div class="code-box">${code}</div>
      <p>This code will expire in 10 minutes.<br>If you didn't request this email, you can safely ignore it.</p>
    </div>
    <div class="footer">
      &copy; 2025 ChainAI. All rights reserved.
    </div>
  </div>
</body>
</html>

`,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      logger.error("Error sending email: ", error);
    } else {
      logger.info("Email sent: " + info.response);
    }
  });
};
