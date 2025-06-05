const nodemailer = require('nodemailer');
const logger = require('../startup/logger'); // Adjust the path as needed

exports.sendEmail = async (email, code) => {
     // Create a Nodemailer transporter object
     const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
               user: 'danishgoheer17@gmail.com',
               pass: 'zzmftuogtusnnriu',
          },
     });

     // Email data
     const mailOptions = {
          from: 'danishgoheer17@gmail.com',
          to: email, // Replace with the recipient's email address
          subject: 'FoodTrack app Verification',
          text: 'Your FoodTrack app verification code is ' + code,
     };

     // Send the email
     transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
               logger.error('Error sending email: ', error);
          } else {
               logger.info('Email sent: ' + info.response);
          }
     });
}

