import jwt from "jsonwebtoken";
import {
  AdminJwtPayload,
  JwtPayload,
  TokenAdminPayload,
  TokenPayload,
  TokenTutorPayload,
  TutorJwtPayload,
} from "../type.js";

interface Token {
  token: string;
}

interface ResponseUser {
  res: any; // You can replace 'any' with the actual type of 'res' if you know it
  user: JwtPayload;
}

const createUserJWT = ({ userId, email, fullName }: JwtPayload): string => {
  const payload: TokenPayload = { userId, email, fullName };
  const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_LIFETIME as any,
  });
  return token;
};

const createTutorJWT = ({
  tutorId,
  email,
  fName,
  lName,
}: TutorJwtPayload): string => {
  const payload: TokenTutorPayload = {
    tutorId,
    email,
    fName,
    lName,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_LIFETIME as any,
  });
  return token;
};

const createAdminJWT = ({
  adminId,
  firstName,
  lastName,
  userName,
  email,
  role,
}: AdminJwtPayload): string => {
  const payload: TokenAdminPayload = {
    adminId,
    firstName,
    lastName,
    userName,
    email,
    role,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_LIFETIME as any,
  });
  return token;
};

const isTokenValid = ({ token }: Token): TokenPayload | false => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;
    return decoded;
  } catch (error) {
    return false;
  }
};
const attachCookiesToResponse = ({ res, user }: ResponseUser): string => {
  const token = createUserJWT(user);

  return token;
};

export {
  createUserJWT,
  createTutorJWT,
  createAdminJWT,
  isTokenValid,
  attachCookiesToResponse,
};
