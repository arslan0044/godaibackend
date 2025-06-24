require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();
const logger = require("./startup/logger"); // Adjust the path as needed
const cron = require("node-cron");
const moment = require("moment");

const admin = require("firebase-admin");
const Reminder = require("./models/Reminder");

const config = {
  type: process.env.TYPE,
  project_id: process.env.PROJECTID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY,
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENTID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URL,
  auth_provider_x509_cert_url: process.env.AUTHPROVIDER,
  client_x509_cert_url: process.env.CLIENT_CERT,
  universe_domain: process.env.DOMAIN,
};

admin.initializeApp({
  credential: admin.credential.cert(config),
  storageBucket: "gs://godai-507ae.appspot.com",
});

app.use(cors());

require("./startup/config")();
require("./startup/logging")();
require("./startup/routes")(app);
require("./startup/db")();
require("./startup/validation")();

const port = process.env.PORT || 8080;
const server = app.listen(port, () =>
  logger.info(`Listening on port  ${port}...`)
);

// require('./startup/sockets')(server, app);

app.get("/terms", async (req, res) => {
  const termsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>GodAI - Terms and Conditions</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
      line-height: 1.6;
      background-color: #f9f9f9;
      color: #333;
    }
    .container {
      max-width: 900px;
      margin: auto;
      background: #fff;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-radius: 8px;
    }
    h1, h2 {
      color: #111;
    }
    h1 {
      font-size: 2em;
      margin-bottom: 0.5em;
    }
    h2 {
      font-size: 1.3em;
      margin-top: 1.5em;
    }
    ul {
      padding-left: 20px;
    }
    a {
      color: #007BFF;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Terms and Conditions of Use</h1>

    <p>These Terms and Conditions (“Terms”) govern your access to and use of the GodAI platform, including its web application, mobile applications, AI agent features, and blockchain-enabled services (collectively, the “Services”). By accessing or using the Services, you agree to be bound by these Terms and our Privacy Policy, which is incorporated herein by reference.</p>
    <p>If you do not agree with these Terms, you may not use the Services.</p>

    <h2>1. About GodAI</h2>
    <p>GodAI (“we,” “us,” “our”) provides a companion AI Agent that offers mood-based discovery of entertainment content (movies, music, games), task assistance (reminders, groceries), and a blockchain-based engagement system that rewards eligible user activity with $GOD tokens (“Crypto Farming”).</p>

    <h2>2. Eligibility</h2>
    <p>You must be at least 13 years old (or the minimum age in your jurisdiction) to use the Services. If you are under the age of majority, you must have permission from your parent or legal guardian.</p>
    <p>By using the Services, you represent that you are legally eligible to enter into these Terms and that you agree to comply with all applicable laws and regulations.</p>

    <h2>3. User Accounts and Wallets</h2>
    <p>You may access certain features of the Services by registering an account or connecting a supported cryptocurrency wallet. You are responsible for maintaining the confidentiality and security of your credentials and wallet keys. We do not collect, store, or have access to your private keys or recovery phrases.</p>
    <p>You agree to notify us immediately at <a href="mailto:info@mygodai.app">info@mygodai.app</a> of any unauthorized use or security breach related to your account or wallet.</p>

    <h2>4. Prohibited Conduct</h2>
    <p>You agree not to:</p>
    <ul>
      <li>Use multiple accounts or automated tools to fraudulently exploit Crypto Farming (“Sybil attacks”)</li>
      <li>Engage in any activity intended to manipulate, game, or exploit the reward system</li>
      <li>Upload or transmit unlawful, harmful, or misleading content via the Services</li>
      <li>Interfere with or disrupt the integrity or performance of our systems or blockchain contracts</li>
      <li>Use the Services in violation of any applicable law, including financial or data privacy regulations</li>
    </ul>
    <p>We reserve the right to suspend or terminate access to the Services for any prohibited conduct or suspected abuse.</p>

    <h2>5. Crypto Farming and $GOD Tokens</h2>
    <p>GodAI offers a rewards system that may grant users $GOD tokens based on activity within the platform. By participating:</p>
    <ul>
      <li>You understand that $GOD tokens are digital assets without guaranteed monetary value and may be subject to market volatility and regulatory changes.</li>
      <li>You acknowledge that rewards are discretionary and may be modified, reduced, or discontinued at any time without notice.</li>
      <li>You agree to comply with any eligibility criteria, terms of participation, and security practices as we may establish from time to time.</li>
      <li>You are solely responsible for compliance with any applicable tax or regulatory obligations.</li>
    </ul>

    <h2>6. Intellectual Property</h2>
    <p>All intellectual property related to the GodAI Services—including but not limited to trademarks, software, content, AI models, and user interface—are owned by or licensed to us. You are granted a limited, non-exclusive, non-transferable license to use the Services solely for personal, non-commercial use in accordance with these Terms.</p>

    <h2>7. AI-Generated Content Disclaimer</h2>
    <p>GodAI uses AI systems to generate responses based on your inputs. The content provided is:</p>
    <ul>
      <li>For informational or entertainment purposes only</li>
      <li>Not professional advice (e.g., legal, financial, medical)</li>
      <li>Based on algorithms and publicly available data, and not manually verified</li>
    </ul>
    <p>We do not endorse or take responsibility for third-party content shown or recommended by the AI. Use your own judgment when acting on any suggestions.</p>

    <h2>8. Availability and Changes to Services</h2>
    <p>We reserve the right to modify, suspend, or discontinue any aspect of the Services at any time, with or without notice. We are not liable for any loss or inconvenience caused by such changes or downtime.</p>

    <h2>9. Limitation of Liability</h2>
    <p>To the fullest extent permitted by law:</p>
    <ul>
      <li>GodAI disclaims all warranties, express or implied, including fitness for a particular purpose</li>
      <li>GodAI is not liable for indirect, incidental, punitive, or consequential damages</li>
      <li>Your sole and exclusive remedy for dissatisfaction with the Services is to stop using them</li>
    </ul>

    <h2>10. Indemnification</h2>
    <p>You agree to indemnify, defend, and hold harmless GodAI and its affiliates, officers, employees, and agents from any claims, liabilities, damages, and expenses (including attorneys’ fees) arising out of your use of the Services, your violation of these Terms, or your violation of any applicable law or third-party rights.</p>

    <h2>11. Governing Law and Dispute Resolution</h2>
    <p>These Terms shall be governed by and construed in accordance with the laws of <strong>[Insert Jurisdiction]</strong>. Any disputes arising under or related to these Terms shall be resolved exclusively in the courts of <strong>[Insert Location]</strong>, unless otherwise required by applicable consumer protection laws.</p>

    <h2>12. Termination</h2>
    <p>We may terminate or suspend your access to the Services immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Services will cease immediately.</p>

    <h2>13. Updates to These Terms</h2>
    <p>We reserve the right to modify these Terms at any time. Changes will be effective upon posting to the app or website. Your continued use of the Services after the effective date constitutes your acceptance of the revised Terms.</p>

    <h2>14. Contact Information</h2>
    <p>If you have questions or concerns about these Terms, please contact us at:<br/>
      📧 <a href="mailto:info@mygodai.app">info@mygodai.app</a>
    </p>
  </div>
</body>
</html>
`;
  res.send(termsHtml);
});

app.get("/privacy", async (req, res) => {
  const termsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Privacy Policy | GodAI</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      padding: 40px;
      background-color: #f9f9f9;
      color: #333;
    }
    h1, h2 {
      color: #222;
    }
    h1 {
      font-size: 2em;
      margin-bottom: 10px;
    }
    h2 {
      font-size: 1.3em;
      margin-top: 30px;
    }
    ul {
      list-style: disc;
      margin-left: 20px;
    }
    p {
      margin: 10px 0;
    }
    .contact {
      margin-top: 40px;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <h1>Privacy Policy for GodAI</h1>
  <p><strong>Effective Date:</strong> [Insert Date]</p>
  <p><strong>Last Updated:</strong> [Insert Date]</p>

  <p>
    GodAI (“Company”, “we”, “us”, or “our”) respects your privacy and is committed to protecting it through our compliance with this Privacy Policy. 
    This document explains how we collect, use, store, and disclose your information when you access or use the GodAI platform, which includes our 
    website, mobile applications, and related services (collectively, the “Services”).
  </p>
  <p>If you do not agree with the terms of this Privacy Policy, please do not use our Services.</p>

  <h2>1. Information We Collect</h2>
  <p><strong>a. Information You Provide to Us</strong></p>
  <ul>
    <li>Email address, username, or other identifiers used during registration (if applicable)</li>
    <li>Inputs provided to the AI (e.g., messages, mood tags, grocery lists, reminders)</li>
  </ul>

  <p><strong>b. Wallet and Token Participation</strong></p>
  <ul>
    <li>Public blockchain wallet address (for $GOD token distribution and crypto farming)</li>
    <li>On-chain and off-chain activity associated with the wallet address</li>
    <li>We do not collect private keys or seed phrases</li>
  </ul>

  <p><strong>c. Automatically Collected Information</strong></p>
  <ul>
    <li>Device identifiers (IP address, browser type, OS)</li>
    <li>App usage statistics and behavioral data</li>
    <li>Region or country (inferred from IP address)</li>
  </ul>

  <h2>2. How We Use Your Information</h2>
  <ul>
    <li>To operate, maintain, and improve our Services</li>
    <li>To personalize your experience and provide relevant content</li>
    <li>To facilitate participation in the crypto farming ecosystem</li>
    <li>To detect, prevent, and respond to security incidents or fraudulent activities</li>
    <li>To comply with legal obligations, including applicable financial regulations</li>
    <li>To contact you with important notices or user support (only with consent)</li>
  </ul>

  <h2>3. Legal Basis for Processing (GDPR Compliance)</h2>
  <p>If you are located in the European Economic Area (EEA), our legal basis for collecting and using personal data depends on the context in which it is collected. We rely on:</p>
  <ul>
    <li>Performance of a contract – to provide the Services</li>
    <li>Consent – for marketing communications or optional features</li>
    <li>Legal obligations – for compliance with applicable laws</li>
    <li>Legitimate interests – for fraud prevention and service improvement</li>
  </ul>

  <h2>4. Data Retention</h2>
  <p>We retain personal data only as long as necessary to:</p>
  <ul>
    <li>Provide the Services</li>
    <li>Fulfill the purposes outlined in this Privacy Policy</li>
    <li>Comply with legal and regulatory obligations</li>
  </ul>
  <p>You may request deletion of your data at any time by contacting us at <a href="mailto:info@mygodai.app">info@mygodai.app</a>.</p>

  <h2>5. Disclosure of Your Information</h2>
  <p>We do not sell your personal information. We may share personal data with:</p>
  <ul>
    <li>Service providers who assist in hosting, analytics, and security</li>
    <li>Law enforcement or regulatory agencies, when legally required</li>
    <li>Affiliates or successors in the event of a merger, acquisition, or asset sale</li>
  </ul>
  <p>All third-party service providers are contractually obligated to safeguard personal data and use it only for the intended purpose.</p>

  <h2>6. International Data Transfers</h2>
  <p>Your data may be processed in countries outside your jurisdiction, including the United States or other countries with differing data protection laws. 
    By using our Services, you consent to such transfers, as permitted by applicable law.</p>

  <h2>7. Data Security</h2>
  <p>We implement appropriate technical and organizational measures to protect personal data, including:</p>
  <ul>
    <li>Encrypted data transmission</li>
    <li>Limited access control</li>
    <li>Routine vulnerability scans and secure infrastructure practices</li>
  </ul>
  <p>However, no system is 100% secure, and we cannot guarantee absolute security.</p>

  <h2>8. Your Rights</h2>
  <p>Depending on your location, you may have the right to:</p>
  <ul>
    <li>Access the personal data we hold about you</li>
    <li>Correct inaccuracies in your data</li>
    <li>Request deletion of your data</li>
    <li>Object to or restrict certain types of processing</li>
    <li>Withdraw consent at any time (where applicable)</li>
  </ul>
  <p>To exercise your rights, email us at <a href="mailto:info@mygodai.app">info@mygodai.app</a>.</p>

  <h2>9. Children's Privacy</h2>
  <p>Our Services are not intended for children under 13 years of age, or the minimum legal age in your jurisdiction. 
    We do not knowingly collect personal data from children. If you believe we have collected such data, please contact us for deletion.</p>

  <h2>10. Crypto-Specific Disclaimers</h2>
  <ul>
    <li>Blockchain wallet addresses are public by nature. Interactions with smart contracts and public ledgers are outside our control and may be visible to third parties.</li>
    <li>By using the crypto farming feature, you acknowledge and accept the inherent risks of using blockchain-based technology, including token volatility, gas fees, and regulatory changes.</li>
  </ul>

  <h2>11. Changes to This Policy</h2>
  <p>We reserve the right to update or modify this Privacy Policy at any time. We will notify you of material changes through the Services or via email. 
    Your continued use after changes are posted constitutes acceptance.</p>

  <h2>12. Contact Us</h2>
  <p class="contact">
    If you have any questions about this Privacy Policy or your personal data, please contact:<br/>
    GodAI Team<br/>
    📧 <a href="mailto:info@mygodai.app">info@mygodai.app</a>
  </p>

</body>
</html>
`;
  res.send(termsHtml);
});

// Run every minute
cron.schedule("* * * * *", async () => {
  try {
    const reminders = await Reminder.find({
      reminderAt: { $lte: new Date() },
    }).populate("user");
    reminders.forEach(async (reminder) => {
      if (reminder.remind == "none") {
        await Reminder.findByIdAndDelete(reminder._id);
      } else {
        const nextDay = moment(reminder.reminderAt).add(1, "day").toISOString();
        const nextWeek = moment(reminder.reminderAt)
          .add(1, "week")
          .toISOString();
        await Reminder.findByIdAndUpdate(reminder._id, {
          $set: { reminderAt: reminder.remind == "daily" ? nextDay : nextWeek },
        });
      }
      try {
        const title =
          reminder.type == "family"
            ? "Reminder: " + reminder.title
            : "Reminder";
        const message = {
          token: reminder.user.fcmtoken, // replace with the user's device token
          notification: {
            title: title,
            body:
              reminder.type == "family"
                ? reminder.description
                : reminder.title + reminder.type == "grocery"
                ? "Quantity" + reminder.quantity
                : "",
          },
          android: {
            notification: {
              sound: "default",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
              },
            },
          },
        };
        await admin.messaging().send(message);
      } catch (error) {}
    });
  } catch (err) {
    console.error("❌ Cron Job Error:", err);
  }
});

module.exports = server;
