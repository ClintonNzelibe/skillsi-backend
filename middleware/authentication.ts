import { Request, Response, NextFunction } from "express";
import { UnAuthenticatedError, UnauthorizedError } from "../errors/index.js";
import { isTokenValid } from "../utils/index.js";
import { TokenTutorPayload } from "../type.js";

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
  fName: string;
  lName: string;
  adminId: string;
  companyName: string;
  type: "company" | "admin" | string;
  role: "user" | "admin" | "superadmin" | string;
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
    throw new UnAuthenticatedError("Authentication invalid");
  }
  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new UnAuthenticatedError("Authentication invalid");
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
      throw new UnAuthenticatedError("Authentication invalid");
    }

    const { fullName, email, userId } = result;
    req.user = {
      fullName,
      email,
      userId,
    };
    next();
  } catch (error) {
    throw new UnAuthenticatedError("Authentication Invalid");
  }
};

const authenticateTutor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnAuthenticatedError("Authentication invalid");
  }
  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new UnAuthenticatedError("Authentication invalid");
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
      throw new UnAuthenticatedError("Authentication invalid");
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
    throw new UnAuthenticatedError("Authentication Invalid");
  }
};

const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnAuthenticatedError("Authentication invalid");
  }
  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new UnAuthenticatedError("Authentication invalid");
  }

  try {
    const result = isTokenValid({ token });

    // Type guard function to check if payload is AdminTokenPayload
    const isAdminPayload = (payload: any): payload is AdminTokenPayload => {
      return (
        payload !== null &&
        typeof payload === "object" &&
        "adminId" in payload &&
        "companyName" in payload &&
        "type" in payload &&
        "role" in payload &&
        "email" in payload &&
        "fName" in payload &&
        "lName" in payload
      );
    };

    if (!result || typeof result === "boolean" || !isAdminPayload(result)) {
      throw new UnAuthenticatedError("Authentication invalid");
    }

    const { adminId, email, companyName, fName, lName, type, role } = result;
    req.admin = {
      adminId,
      email,
      companyName,
      fName,
      lName,
      type,
      role,
    };
    next();
  } catch (error) {
    throw new UnAuthenticatedError("Authentication Invalid");
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
const authenticateUserOrTutorOrAdmin = (req: any, res: any, next: any) => {
  // Try user authentication first
  authenticateUser(req, res, (userErr: any) => {
    if (!userErr && req.user) {
      return next(); // User authenticated successfully
    }

    // If user auth fails, try tutor authentication
    authenticateTutor(req, res, (tutorErr: any) => {
      if (!tutorErr && req.tutor) {
        return next(); // Tutor authenticated successfully
      }

      // Both authentications failed
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    });
  });
};

export {
  authenticateUser,
  authenticateTutor,
  authenticateAdmin,
  authorizePermissions,
  authenticateUserOrTutorOrAdmin,
};
