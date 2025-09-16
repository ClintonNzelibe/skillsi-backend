import {
  createUserJWT,
  createTutorJWT,
  createAdminJWT,
  createAffiliateJWT,
  isTokenValid,
  attachCookiesToResponse,
} from "./jwt.js";
import {
  OPENAI_API_KEY,
  GOOGLE_DRIVE_APIKEY,
  PAYSTACK_SECRET_KEY,
} from "./keys.js";
import createTokenUser from "./createTokenUser.js";
import createTokenTutor from "./createTokenTutor.js";
import createTokenAdmin from "./createTokenAdmin.js";
import createTokenAffiliate from "./createTokenAffiliate.js";
import checkPermissions from "./checkPermissions.js";
import sendVerificationEmail from "./sendVerificationEmail.js";
import sendPasswordEmail from "./sendPasswordEmail.js";
import sendResetPasswordEmail from "./sendResetPasswordEmail.js";
import createHash, {
  hashAccountNumber,
  encrypt,
  decrypt,
} from "./createHash.js";

export {
  createUserJWT,
  createTutorJWT,
  createAdminJWT,
  createAffiliateJWT,
  isTokenValid,
  attachCookiesToResponse,
  OPENAI_API_KEY,
  GOOGLE_DRIVE_APIKEY,
  PAYSTACK_SECRET_KEY,
  createTokenUser,
  createTokenTutor,
  createTokenAdmin,
  createTokenAffiliate,
  checkPermissions,
  sendVerificationEmail,
  sendPasswordEmail,
  sendResetPasswordEmail,
  createHash,
  hashAccountNumber,
  encrypt,
  decrypt,
};
