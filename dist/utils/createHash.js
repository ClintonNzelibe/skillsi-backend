import crypto from "crypto";
const ENCRYPTION_KEY = process.env.BANK_ENCRYPTION_KEY; // must be 32 chars for AES-256
const IV_LENGTH = 16; // AES block size
const hashString = (string) => crypto.createHash("md5").update(string).digest("hex");
export default hashString;
// Hash for lookup (deterministic)
export const hashAccountNumber = (accountNumber) => {
    return crypto.createHash("sha256").update(accountNumber).digest("hex");
};
// Helper functions
export function encrypt(text) {
    if (!text)
        return "";
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted; // store iv with data
}
export function decrypt(text) {
    if (!text)
        return "";
    const parts = text.split(":");
    if (parts.length !== 2) {
        throw new Error("Invalid encrypted text format");
    }
    const [ivHex, encryptedData] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
