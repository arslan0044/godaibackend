const nodemailer = require("nodemailer");
const logger = require("../startup/logger"); // Adjust the path as needed

exports.sendEmail = async (email, code) => {
  // Create a Nodemailer transporter object
  //  const transporter = nodemailer.createTransport({
  //         service: 'Gmail',
  //         auth: {
  //              user: 'danishgoheer17@gmail.com',
  //              pass: 'zzmftuogtusnnriu',
  //         },
  //    });
  const transporter = nodemailer.createTransport({
    host: "mail.joinchainai.com",
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: "noreply@joinchainai.com",
      pass: "ChainAi@2025",
    },
    // tls: {
    //   rejectUnauthorized: false, // Optional: Disables certificate validation
    // },
    // name: "chainai-mailserver",
    logger: true,
    debug: true,
  });
  // const transporter = nodemailer.createTransport({
  //   host: "mail.joinchainai.com",
  //   port: 587,
  //   secure: true, // Use TLS
  //   auth: {
  //     user: "noreply@joinchainai.com",
  //     pass: "ChainAi@2025",
  //   },
  // });
  await transporter.verify();
  // Email data
  const mailOptions = {
    from: '"ChainAI" <noreply@joinchainai.com>',
    to: email, // Replace with the recipient's email address
    //     MIME-Version: 1.0,
    // Content-Type: text/html; charset=utf-8,
    // headers: {
    //   "X-Priority": "1", // High priority
    //   "X-Mailer": "ChainAI Mailer",
    //   "List-Unsubscribe": "<https://joinchainai.com/unsubscribe>",
    //   "MIME-Version": "1.0",
    //   "Content-Type": "text/html; charset=UTF-8",
    //   // "X-Auto-Response-Suppress": "OOF, AutoReply",
    //   // "Content-Transfer-Encoding": "quoted-printable",
    //   // Precedence: "bulk",
    // },

    subject: "🔐 Your ChainAI Verification Code Inside – Let’s Get Started!",
    // html: `
    //     <!DOCTYPE html>
    // <html lang="en">
    // <head>
    //   <meta charset="UTF-8" />
    //   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    //   <style>
    //     body {
    //       margin: 0;
    //       padding: 0;
    //       font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    //       background-color: #ffffff;
    //       color: #1c1c1c;
    //     }

    //     .email-container {
    //       max-width: 600px;
    //       margin: 0 auto;
    //       background-color: #f9f9f9;
    //       border: 1px solid #e0e0e0;
    //       border-radius: 12px;
    //       overflow: hidden;
    //       box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    //     }

    //     .header {
    //       background-color: #000000;
    //       padding: 30px;
    //       text-align: center;
    //     }

    //     .header h1 {
    //       margin: 0;
    //       font-size: 28px;
    //       color: #ffffff;
    //       letter-spacing: 2px;
    //       text-transform: uppercase;
    //     }

    //     .body {
    //       padding: 40px 30px;
    //       text-align: center;
    //     }

    //     .body p {
    //       font-size: 18px;
    //       color: #333333;
    //       line-height: 1.6;
    //     }

    //     .code-box {
    //       display: inline-block;
    //       margin: 30px 0;
    //       padding: 20px 40px;
    //       font-size: 36px;
    //       font-family: 'Courier New', Courier, monospace;
    //       background-color: #000000;
    //       color: #ffffff;
    //       border-radius: 10px;
    //       font-weight: bold;
    //       letter-spacing: 6px;
    //       animation: pulse 1.5s infinite ease-in-out;
    //     }

    //     .footer {
    //       background-color: #f1f1f1;
    //       text-align: center;
    //       padding: 20px;
    //       font-size: 13px;
    //       color: #666666;
    //     }

    //     @keyframes pulse {
    //       0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0.3); }
    //       70% { transform: scale(1.03); box-shadow: 0 0 8px 8px rgba(0,0,0,0.03); }
    //       100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0); }
    //     }

    //     @media only screen and (max-width: 600px) {
    //       .body p {
    //         font-size: 16px;
    //       }

    //       .code-box {
    //         font-size: 28px;
    //         padding: 16px 30px;
    //       }
    //     }
    //   </style>
    // </head>
    // <body>
    //   <div class="email-container">
    //     <div class="header">
    //       <h1>ChainAI</h1>
    //     </div>
    //     <div class="body">
    //       <p>Welcome to ChainAI 👋</p>
    //       <p>Use the verification code below to activate your account:</p>
    //       <div class="code-box">${code}</div>
    //       <p>This code will expire in 10 minutes.<br>If you didn't request this email, you can safely ignore it.</p>
    //     </div>
    //     <div class="footer">
    //       &copy; 2025 ChainAI. All rights reserved.
    //     </div>
    //   </div>
    // </body>
    // </html>

    // `,
    html: `
    Hi,
    Here is your verification code for ChainAI: <strong>${code}</strong>.
    This code will expire in 10 minutes. If you didn't request this email, you can safely ignore it.
    `,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      logger.error("Error sending email: ", error);
    } else {
      logger.info("Email sent: ", info);
    }
  });
};

exports.sendReminderEmail = async (Reminder) => {
  console.log("Sending reminder email for:", Reminder);
  const transporter = nodemailer.createTransport({
    host: "mail.joinchainai.com",
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: "noreply@joinchainai.com",
      pass: "ChainAi@2025",
    },
    tls: {
      rejectUnauthorized: false, // Optional: Disables certificate validation
    },
  });
  const mailOptions = {
    from: "ChainAI",
    to: Reminder.user.email, // Replace with the recipient's email address
    // headers: {
    //   "X-Priority": "1", // High priority
    //   "X-Mailer": "ChainAI Mailer",
    //   "X-Auto-Response-Suppress": "OOF, AutoReply",
    //   Precedence: "bulk",
    //   "List-Unsubscribe": "<https://joinchainai.com/unsubscribe>",
    //   "MIME-Version": "1.0",
    //   "Content-Type": "text/html; charset=UTF-8",
    //   "Content-Transfer-Encoding": "quoted-printable",
    // },
    subject: "🔔 Reminder from ChainAI",
    html: `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ChainAI Reminder</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f7fa;
      color: #1c1c1c;
      line-height: 1.6;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #6e8efb, #a777e3);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      color: #ffffff;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .logo {
      height: 40px;
      margin-bottom: 15px;
    }
    .body {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #333333;
      margin-bottom: 25px;
    }
    .reminder-card {
      background-color: #f9f9ff;
      border-left: 4px solid #6e8efb;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
      text-align: left;
    }
    .reminder-title {
      font-size: 20px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0 0 10px 0;
    }
    .reminder-detail {
      font-size: 16px;
      color: #555555;
      margin: 8px 0;
    }
    .reminder-detail strong {
      color: #333333;
      font-weight: 500;
    }
    .priority-high {
      color: #e74c3c;
      font-weight: 600;
    }
    .priority-medium {
      color: #f39c12;
      font-weight: 600;
    }
    .priority-low {
      color: #27ae60;
      font-weight: 600;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6e8efb, #a777e3);
      color: white;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 30px;
      font-weight: 500;
      margin: 25px 0;
      transition: all 0.3s ease;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(106, 142, 251, 0.4);
    }
    .signature {
      margin-top: 30px;
      color: #555555;
    }
    .footer {
      background-color: #f1f1f1;
      text-align: center;
      padding: 25px;
      font-size: 13px;
      color: #666666;
    }
    .footer-links {
      margin: 15px 0;
    }
    .footer-links a {
      color: #6e8efb;
      text-decoration: none;
      margin: 0 10px;
    }
    .social-icons {
      margin: 15px 0;
    }
    .social-icons a {
      margin: 0 8px;
    }
    @media only screen and (max-width: 600px) {
      .header {
        padding: 30px 20px;
      }
      .body {
        padding: 30px 20px;
      }
      .reminder-title {
        font-size: 18px;
      }
      .reminder-detail {
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <!-- Replace with actual logo URL -->
      <img src="https://via.placeholder.com/150x40/ffffff/6e8efb?text=ChainAI" alt="ChainAI Logo" class="logo">
      <h1>Reminder Notification</h1>
    </div>
    <div class="body">
      <p class="greeting">Hi ${Reminder.user.name},</p>
      <p>This is a friendly reminder for your upcoming task:</p>
      
      <div class="reminder-card">
        <h2 class="reminder-title">${Reminder.title}</h2>
        <p class="reminder-detail"><strong>Description:</strong> ${
          Reminder.description || "No description provided."
        }</p>
        <p class="reminder-detail"><strong>Priority:</strong> 
          <span class="priority-${
            Reminder.priority ? Reminder.priority.toLowerCase() : "normal"
          }">
            ${Reminder.priority || "Normal"}
          </span>
        </p>
        <p class="reminder-detail"><strong>Category:</strong> ${
          Reminder.type || "General"
        }</p>
      </div>
      
      <a href="#" class="cta-button">View Task Details</a>
      
      <p class="signature">
        Best regards,<br>
        <strong>The ChainAI Team</strong>
      </p>
    </div>
    <div class="footer">
      <div class="social-icons">
        <!-- Replace with actual social media icons -->
        <a href="#"><img src="https://via.placeholder.com/24/6e8efb/ffffff?text=T" alt="Twitter"></a>
        <a href="#"><img src="https://via.placeholder.com/24/6e8efb/ffffff?text=F" alt="Facebook"></a>
        <a href="#"><img src="https://via.placeholder.com/24/6e8efb/ffffff?text=L" alt="LinkedIn"></a>
      </div>
      <div class="footer-links">
        <a href="#">Help Center</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Unsubscribe</a>
      </div>
      <p>&copy; 2025 ChainAI. All rights reserved.</p>
      <p>1234 Tech Park, San Francisco, CA 94107</p>
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
