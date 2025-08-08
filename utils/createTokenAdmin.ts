import { TokenAdmin, Admin } from "../type.js";

const createTokenAdmin = (admin: Admin): TokenAdmin => {
  const { adminId, firstName, lastName, userName, email, role } = admin;
  return {
    adminId,
    firstName,
    lastName,
    userName,
    email,
    role,
  };
};

export default createTokenAdmin;
