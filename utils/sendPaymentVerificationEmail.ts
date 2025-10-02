import sendEmail from "./sendEmail.js";

interface SendPaymentVerificationEmailParams {
  email: string;
  verificationToken: string;
  amount: number;
  fName: string;
  accountNumber: string;
  bankName: string;
}

const sendPaymentVerificationEmail = async ({
  email,
  verificationToken,
  amount,
  fName,
  accountNumber,
  bankName,
}: SendPaymentVerificationEmailParams) => {
  const stringedAmount = amount.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
  });

  // Mask account number (only last 4 digits visible)
  const maskedAccount = accountNumber.replace(/\d(?=\d{4})/g, "*");

  const message = `<div style="background-color: #e2e2ff; padding: 3rem 1.5rem; display: flex; flex-direction: column; align-items: center;">
                        <div style="clear: both; width: 90%; background-color: #ffffff; margin: auto; padding: 2rem; border-radius: 2rem; display: block;">
                          <h4 style="margin-bottom: 1.2rem; font-size: 1.2rem; text-align: center;">Payment withdrawal confirmation email</h4>
                          <hr />

                          <h6 style="font-size: 1.2rem;">Hello, ${fName}</h6>

                          <p class="message-font">This email confirms that we have received your request to withdraw ${stringedAmount} from your account on ${new Date().toLocaleString()}.
                          </p> 

                          <p>The withdrawal is currently being processed and is expected to be completed within 7 business days. Once the funds have been sent, you will receive another notification confirming the transfer.</p>

                          <p>To continue with this payment process, kindly input the One Time Password below to the payment stage. Transaction details are provided below:</p>

                          <p>Your OTP: <b>${verificationToken}</b></p>

                          <div>
                            <h3>Withdrawal details:</h3>
                            <ul>
                              <li><b>Amount:</b> ${stringedAmount}</li>
                              <li><b>Request Date:</b> ${new Date().toLocaleString()}</li>
                              <li><b>To:</b> ${bankName} - ${maskedAccount}</li>
                            </ul>
                          </div>

                          <p>This OTP expires in <strong>10 minutes</strong>. You will need to request a new OTP after expiration.</p>

                          <p>You can view the status of this withdrawal and your other transactions by logging into your account at any time.</p>

                          <p>If you did not initiate this request, please contact our support team immediately by replying to this email or calling us at +234 810 0000 000.</p>

                          <p>Thank you for your business.</p>

                          <p>Sincerely,</p>
                          <p>The Skillsi Team</p>

                        </div>

                        </div>`;
  // ${bottomMessage}
  //   minimumFractionDigits: 0,
  // maximumFractionDigits: 0,

  return sendEmail({
    to: email,
    subject: `Confirmation of your withdrawal request for ${stringedAmount}`,
    html: `${message}`,
  });
};

export default sendPaymentVerificationEmail;
