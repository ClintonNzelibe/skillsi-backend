import sendEmail from "./sendEmail.js";

interface SendPhishingEmailParams {
    email: string;
    fName: string;
  subject: string;
  html: string;
  bannerImage: string;
  // images: EmailImages;
}

const sendPhishingEmail = async ({
    email,
    fName,
  subject,
  html,
  bannerImage
}: SendPhishingEmailParams) => {

  const message = `<div style="background-color: #e2e2ff; padding: 3rem 1.5rem; display: flex; flex-direction: column; align-items: center;">
                        <div style="clear: both; width: 90%; background-color: #ffffff; margin: auto; padding: 2rem; border-radius: 2rem; display: block;">
                          <h4 style="margin-bottom: 1.2rem; font-size: 1.2rem; text-align: center;">Your Default Password Credential</h4>
                          <hr />

                          <h6 style="font-size: 1.2rem;">Hello, ${fName}</h6>

                          <p>Thank you for registering with CAMP. Below is your temporary password:</p>

                          <p>Your Password: <b></b></p>

                          <p>For security reasons, please update your password after logging in.</p>

                          <p>This password will expire in <strong>an hour</strong>. If it expires, request a new one.</p>
                        </div>

                        </div>`;
  // ${bottomMessage}

  return sendEmail({
    to: email,
    subject: subject,
    html: `<div style="">
                   <a href="#" style="width: 100%;">
                      <img src="">
                     </a>
                    ${message}
                   </div>`,
  });
};

export default sendPhishingEmail;
