import { TokenUser, User } from "../type.js";

const createTokenUser = (user: User): TokenUser => {
  const { userId, email, fullName } = user;
  return {
    userId,
    email,
    fullName,
  };
};

export default createTokenUser;
