import nodemailer from 'nodemailer'
import nodemailerConfig from './nodemailerConfig.js'

const sendEmail = async ({ to, subject, html } :any) => {
  // let testAccount = await nodemailer.createTestAccount()

  const transporter = nodemailer.createTransport(nodemailerConfig)

  return transporter.sendMail({
    from: '"Pyralink_CAMP" <ajibolaisaac09@gmail.com>', // sender address
    to,
    subject,
    html,
  })
}

export default sendEmail

// import AWS from "aws-sdk";

// const ses = new AWS.SES({
//   region: process.env.AWS_REGION, // Ensure this matches your SES region
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// });

// const sendEmail = async ({to, subject, html}: any) => {
//   const sourceEmail = process.env.AWS_SES_FROM_EMAIL! || "";
//   if (!sourceEmail) {
//     throw new Error("AWS_SES_FROM_EMAIL is not defined in environment variables");
//   }

//   const params = {
//     Source: sourceEmail, // Must be a verified sender
//     Destination: {
//       ToAddresses: [to],
//     },
//     Message: {
//       Subject: { Data: subject },
//       Body: {
//         Html: { Data: html },
//       },
//     },
//   };

//   try {
//     await ses.sendEmail(params).promise();
//     console.log("Email sent successfully");
//   } catch (error) {
//     console.error("Error sending email:", error);
//   }
// };

// export default sendEmail;
