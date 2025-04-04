import { TokenAdmin, Admin } from "../type.js";

const createTokenAdmin = (admin: Admin): TokenAdmin => {
  const { adminId, email, fName, lName, companyName, type, role } = admin;
  return {
    adminId,
    email,
    fName,
    lName,
    companyName,
    type,
    role,
  };
};

export default createTokenAdmin;
