import nodemailer from "nodemailer";
import nodemailerConfig from "./nodemailerConfig.js";
const sendEmail = async ({ to, subject, html }) => {
    try {
        const transporter = nodemailer.createTransport(nodemailerConfig);
        const info = await transporter.sendMail({
            from: `"Pyralink_CAMP" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        return info;
    }
    catch (error) {
        console.error("Email sending failed:", error);
        throw error;
    }
};
export default sendEmail;
