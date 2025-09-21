import sendEmail from "./sendEmail.js";

interface SendPasswordEmailParams {
  fName: string;
  email: string;
  password: string;
  // images: EmailImages;
}

const sendPasswordEmail = async ({
  fName,
  email,
  password,
}: SendPasswordEmailParams) => {
  const year = new Date().getFullYear();

  const bottomMessage = `<div style=" clear: both; width: 60%; background-color: #5A27D5; margin: auto; padding: 1rem 2rem; border-radius: 2rem; display: block;">
    <p style="color: #ffffff; text-align: center; margin-top: 1rem;">&copy; EverPDF ${year}</p>
    </div>`;

  const message = `<div style="background-color: #e2e2ff; padding: 3rem 1.5rem; display: flex; flex-direction: column; align-items: center;">
                        <div style="clear: both; width: 90%; background-color: #ffffff; margin: auto; padding: 2rem; border-radius: 2rem; display: block;">
                          <h4 style="margin-bottom: 1.2rem; font-size: 1.2rem; text-align: center;">Your Default Password Credential</h4>
                          <hr />

                          <h6 style="font-size: 1.2rem;">Hello, ${fName}</h6>

                          <p>Thank you for registering with Skillsi. Below is your temporary password:</p>

                          <p>Your Password: <b>${password}</b></p>

                          <p>For security reasons, please update your password after logging in.</p>

                          <p>This password will expire in <strong>an hour</strong>. If it expires, request a new one.</p>
                        </div>

                        </div>`;
  // ${bottomMessage}

  return sendEmail({
    to: email,
    subject: "Your Default Password Credential",
    html: `${message}`,
  });
};

export default sendPasswordEmail;
