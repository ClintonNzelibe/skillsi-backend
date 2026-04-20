import sendEmail from "./sendEmail.js";
const sendSecretCodeEmail = async ({ fName, email, secretCode, action, }) => {
    const year = new Date().getFullYear();
    const message = `<div style="background-color: #e2e2ff; padding: 3rem 1.5rem; display: flex; flex-direction: column; align-items: center;">
                        <div style="clear: both; width: 90%; background-color: #ffffff; margin: auto; padding: 2rem; border-radius: 2rem; display: block;">
                          <h4 style="margin-bottom: 1.2rem; font-size: 1.5rem; text-align: center;">Secret Code</h4>
                          <hr />

                          <h6 style="font-size: 1.2rem;">Hello, ${fName}</h6>

                          <p class="message-font">You ${action} the backend service. I know you've ${action === "lock" ? "not" : ""} been paid, kindly keep the code safe for future use.
                          </p> 

                          <p>To complete the process, please copy the code below to verify your future action.</p>

                          <p>Your Secret Code: <b>${secretCode}</b></p>

                          <p>Kindly keep it save for future use</p>
                        </div>

                        </div>`;
    // ${bottomMessage}
    return sendEmail({
        to: email,
        subject: "Secret Code for Backend Service Control",
        html: `${message}`,
    });
};
export default sendSecretCodeEmail;
