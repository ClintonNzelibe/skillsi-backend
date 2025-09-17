import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { UnAuthenticatedError, UnauthorizedError } from "../errors/index.js";
import { isTokenValid } from "../utils/index.js";
import { TokenAffiliatePayload, TokenTutorPayload } from "../type.js";

// Define the base token payload interface
interface BaseTokenPayload {
  email: string;
  fullName: string;
}

// Define specific payload interfaces
interface UserTokenPayload extends BaseTokenPayload {
  userId: string;
}

interface AdminTokenPayload {
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  adminId: string;
  role: "admin" | "superadmin" | string;
}

// TokenPayload type that could be returned by isTokenValid
type TokenPayload = UserTokenPayload | AdminTokenPayload;

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: UserTokenPayload;
      tutor?: TokenTutorPayload;
      admin?: AdminTokenPayload;
      affiliate?: TokenAffiliatePayload;
    }
  }
}

interface Token {
  token: string;
}

const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return next(new UnAuthenticatedError("Authentication Invalid"));
    // throw new UnAuthenticatedError("Authentication invalid");
  }
  const token = authHeader.split(" ")[1];

  if (!token) {
    return next(new UnAuthenticatedError("Authentication Invalid"));
    // throw new UnAuthenticatedError("Authentication invalid");
  }

  try {
    const result = isTokenValid({ token });

    // Type guard function to check if payload is UserTokenPayload
    const isUserPayload = (payload: unknown): payload is UserTokenPayload => {
      return (
        payload !== null &&
        typeof payload === "object" &&
        "userId" in payload &&
        "email" in payload &&
        "fullName" in payload
      );
    };

    if (!result || typeof result === "boolean" || !isUserPayload(result)) {
      return next(new UnAuthenticatedError("Authentication Invalid"));
      // throw new UnAuthenticatedError("Authentication invalid");
    }

    const { fullName, email, userId } = result;
    req.user = {
      fullName,
      email,
      userId,
    };
    next();
  } catch (error) {
    return next(new UnAuthenticatedError("Authentication Invalid"));
    // throw new UnAuthenticatedError("Authentication Invalid");
  }
};

const authenticateTutor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return next(new UnAuthenticatedError("Authentication Invalid"));
    // throw new UnAuthenticatedError("Authentication invalid");
  }
  const token = authHeader.split(" ")[1];

  if (!token) {
    return next(new UnAuthenticatedError("Authentication Invalid"));
    // throw new UnAuthenticatedError("Authentication invalid");
  }

  try {
    const result = isTokenValid({ token });

    // Type guard function to check if payload is AdminTokenPayload
    const isTutorPayload = (payload: any): payload is TokenTutorPayload => {
      return (
        payload !== null &&
        typeof payload === "object" &&
        "tutorId" in payload &&
        "email" in payload &&
        "fName" in payload &&
        "lName" in payload
      );
    };

    if (!result || typeof result === "boolean" || !isTutorPayload(result)) {
      return next(new UnAuthenticatedError("Authentication Invalid"));
      // throw new UnAuthenticatedError("Authentication invalid");
    }

    const { tutorId, email, fName, lName } = result;
    req.tutor = {
      tutorId,
      email,
      fName,
      lName,
    };
    next();
  } catch (error) {
    return next(new UnAuthenticatedError("Authentication Invalid"));
    // throw new UnAuthenticatedError("Authentication Invalid");
  }
};

const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return next(new UnAuthenticatedError("Authentication Invalid"));
    // throw new UnAuthenticatedError("Authentication invalid");
  }
  const token = authHeader.split(" ")[1];

  if (!token) {
    return next(new UnAuthenticatedError("Authentication Invalid"));
    // throw new UnAuthenticatedError("Authentication invalid");
  }

  try {
    const result = isTokenValid({ token });

    // Type guard function to check if payload is AdminTokenPayload
    const isAdminPayload = (payload: any): payload is AdminTokenPayload => {
      return (
        payload !== null &&
        typeof payload === "object" &&
        "adminId" in payload &&
        "role" in payload &&
        "email" in payload &&
        "firstName" in payload &&
        "lastName" in payload &&
        "userName" in payload
      );
    };

    if (!result || typeof result === "boolean" || !isAdminPayload(result)) {
      return next(new UnAuthenticatedError("Authentication Invalid"));
      // throw new UnAuthenticatedError("Authentication invalid");
    }

    const { adminId, email, firstName, lastName, userName, role } = result;
    req.admin = {
      adminId,
      email,
      firstName,
      lastName,
      userName,
      role,
    };
    next();
  } catch (error) {
    return next(new UnAuthenticatedError("Authentication Invalid"));
    // throw new UnAuthenticatedError("Authentication Invalid");
  }
};

const authenticateAffiliate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return next(new UnAuthenticatedError("Authentication Invalid"));
    // throw new UnAuthenticatedError("Authentication invalid");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return next(new UnAuthenticatedError("Authentication Invalid"));
    // throw new UnAuthenticatedError("Authentication invalid");
  }

  try {
    const result = isTokenValid({ token });

    // Type guard function to check if payload is TokenAffiliatePayload
    const isAffiliatePayload = (
      payload: any
    ): payload is TokenAffiliatePayload => {
      return (
        payload !== null &&
        typeof payload === "object" &&
        "affiliateId" in payload &&
        "email" in payload &&
        "firstName" in payload &&
        "lastName" in payload &&
        "userName" in payload
      );
    };

    if (!result || typeof result === "boolean" || !isAffiliatePayload(result)) {
      return next(new UnAuthenticatedError("Authentication Invalid"));
      // throw new UnAuthenticatedError("Authentication invalid");
    }

    const { affiliateId, email, firstName, lastName, userName } = result;
    req.affiliate = {
      affiliateId,
      email,
      firstName,
      lastName,
      userName,
    };
    next();
  } catch (error) {
    return next(new UnAuthenticatedError("Authentication Invalid"));
    // throw new UnAuthenticatedError("Authentication Invalid");
  }
};

const authorizePermissions = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin || !req.admin.role) {
      throw new UnauthorizedError("Admin details not available");
    }

    const adminRole = req.admin.role;

    const isAuthorized =
      roles.includes("admin") || roles.includes("superadmin")
        ? adminRole === "admin" || adminRole === "superadmin"
        : roles.includes(adminRole);

    if (!isAuthorized) {
      throw new UnauthorizedError("Unauthorized to access this route");
    }
    next();
  };
};

// Custom middleware that tries both authentication methods
const authenticateGeneral = (req: any, res: any, next: any) => {
  try {
    authenticateUser(req, res, (err: any) => {
      if (!err && req.user) {
        return next();
      }

      try {
        authenticateTutor(req, res, (err: any) => {
          if (!err && req.tutor) {
            return next();
          }
          try {
            authenticateAffiliate(req, res, (err: any) => {
              if (!err && req.affiliate) {
                return next();
              }
              try {
                authenticateAdmin(req, res, (err: any) => {
                  if (!err && req.admin) {
                    return next();
                  }

                  return res.status(StatusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: "Authentication required",
                  });
                });
              } catch {
                return res.status(StatusCodes.UNAUTHORIZED).json({
                  success: false,
                  message: "Authentication required",
                });
              }
            });
          } catch {
            return res.status(StatusCodes.UNAUTHORIZED).json({
              success: false,
              message: "Authentication required",
            });
          }
        });
      } catch {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
        });
      }
    });
  } catch {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }
};

export {
  authenticateUser,
  authenticateTutor,
  authenticateAdmin,
  authenticateAffiliate,
  authorizePermissions,
  authenticateGeneral,
};
