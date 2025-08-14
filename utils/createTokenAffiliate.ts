import { TokenAffiliate, Affiliate } from "../type.js";

const createTokenAffiliate = (tutor: Affiliate): TokenAffiliate => {
  const { affiliateId, email, firstName, lastName, userName } = tutor;
  return {
    affiliateId,
    email,
    firstName,
    lastName,
    userName,
  };
};

export default createTokenAffiliate;
