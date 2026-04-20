import sendEmail from "../utils/sendEmail.js";
import { SendInAppNotification } from "./index.js";
const LearningReminderNotification = async (deviceToken, fullName) => {
    try {
        await SendInAppNotification(deviceToken, {
            title: "Learning Reminder",
            body: `Hi ${fullName}, it's time for your learning session!`,
        });
    }
    catch (error) {
        console.error("Error sending notification:", error);
        return false;
    }
};
const LearningReminderEmail = async ({ email, fullName, }) => {
    const message = `<div style="background-color: #e2e2ff; padding: 3rem 1.5rem; display: flex; flex-direction: column; align-items: center;">
                        <div style="clear: both; width: 90%; background-color: #ffffff; margin: auto; padding: 2rem; border-radius: 2rem; display: block;">
                          <h4 style="margin-bottom: 1.2rem; font-size: 1.5rem; text-align: center;">Learning Reminder</h4>
                          <hr />

                          <h6 style="font-size: 1.2rem;">Hello, ${fullName}</h6>

                          <p class="message-font">This is your scheduled reminder to continue your learning journey.
                          </p> 

                          <p>Taking consistent steps is the key to mastering any subject!.</p>

                          <div style="margin-top: 30px; padding: 15px; background-color: #f0f0f0; border-radius: 5px;">
                             <p style="margin: 0;">Open your learning app now to continue where you left off.</p>
                        </div>
                        </div>

                        </div>`;
    return sendEmail({
        to: email,
        subject: "Learning Reminder",
        html: `${message}`,
    });
};
export { LearningReminderNotification, LearningReminderEmail };
