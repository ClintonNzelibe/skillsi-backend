import crypto from "crypto";
import { createHash } from "../utils/index.js";

const TokenGenerator = async () => {
  const bytes = crypto.randomBytes(2);
  const number = bytes.readUInt16BE(0);
  const fourDigitNumber = number % 10000; // Ensure it's 4 digits

  const verificationToken: string = fourDigitNumber.toString().padStart(4, "0");

  const sixtyMinutes = 1000 * 60 * 60;
  const verificationTokenExpirationDate = new Date(Date.now() + sixtyMinutes);

  const finalVerificationToken = createHash(verificationToken);

  // const finalVerificationToken: string = crypto
  //   .createHash("sha256")
  //   .update(verificationToken)
  //   .digest("hex");

  return {
    finalVerificationToken,
    verificationToken,
    verificationTokenExpirationDate,
  };
};

export default TokenGenerator;
