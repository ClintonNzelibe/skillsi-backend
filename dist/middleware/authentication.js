import { StatusCodes } from "http-status-codes";
import { UnAuthenticatedError, UnauthorizedError } from "../errors/index.js";
import { isTokenValid } from "../utils/index.js";
const authenticateUser = async (req, res, next) => {
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
        const isUserPayload = (payload) => {
            return (payload !== null &&
                typeof payload === "object" &&
                "userId" in payload &&
                "email" in payload &&
                "fullName" in payload);
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
    }
    catch (error) {
        return next(new UnAuthenticatedError("Authentication Invalid"));
        // throw new UnAuthenticatedError("Authentication Invalid");
    }
};
const authenticateTutor = async (req, res, next) => {
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
        const isTutorPayload = (payload) => {
            return (payload !== null &&
                typeof payload === "object" &&
                "tutorId" in payload &&
                "email" in payload &&
                "fName" in payload &&
                "lName" in payload);
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
    }
    catch (error) {
        return next(new UnAuthenticatedError("Authentication Invalid"));
        // throw new UnAuthenticatedError("Authentication Invalid");
    }
};
const authenticateAdmin = async (req, res, next) => {
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
        const isAdminPayload = (payload) => {
            return (payload !== null &&
                typeof payload === "object" &&
                "adminId" in payload &&
                "role" in payload &&
                "email" in payload &&
                "firstName" in payload &&
                "lastName" in payload &&
                "userName" in payload);
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
    }
    catch (error) {
        return next(new UnAuthenticatedError("Authentication Invalid"));
        // throw new UnAuthenticatedError("Authentication Invalid");
    }
};
const authenticateAffiliate = async (req, res, next) => {
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
        const isAffiliatePayload = (payload) => {
            return (payload !== null &&
                typeof payload === "object" &&
                "affiliateId" in payload &&
                "email" in payload &&
                "firstName" in payload &&
                "lastName" in payload &&
                "userName" in payload);
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
    }
    catch (error) {
        return next(new UnAuthenticatedError("Authentication Invalid"));
        // throw new UnAuthenticatedError("Authentication Invalid");
    }
};
const authorizePermissions = (...roles) => {
    return (req, res, next) => {
        if (!req.admin || !req.admin.role) {
            throw new UnauthorizedError("Admin details not available");
        }
        const adminRole = req.admin.role;
        const isAuthorized = roles.includes("admin") || roles.includes("superadmin")
            ? adminRole === "admin" || adminRole === "superadmin"
            : roles.includes(adminRole);
        if (!isAuthorized) {
            throw new UnauthorizedError("Unauthorized to access this route");
        }
        next();
    };
};
// Custom middleware that tries both authentication methods
const authenticateGeneral = (req, res, next) => {
    try {
        authenticateUser(req, res, (err) => {
            if (!err && req.user) {
                return next();
            }
            try {
                authenticateTutor(req, res, (err) => {
                    if (!err && req.tutor) {
                        return next();
                    }
                    try {
                        authenticateAffiliate(req, res, (err) => {
                            if (!err && req.affiliate) {
                                return next();
                            }
                            try {
                                authenticateAdmin(req, res, (err) => {
                                    if (!err && req.admin) {
                                        return next();
                                    }
                                    return res.status(StatusCodes.UNAUTHORIZED).json({
                                        success: false,
                                        message: "Authentication required",
                                    });
                                });
                            }
                            catch {
                                return res.status(StatusCodes.UNAUTHORIZED).json({
                                    success: false,
                                    message: "Authentication required",
                                });
                            }
                        });
                    }
                    catch {
                        return res.status(StatusCodes.UNAUTHORIZED).json({
                            success: false,
                            message: "Authentication required",
                        });
                    }
                });
            }
            catch {
                return res.status(StatusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: "Authentication required",
                });
            }
        });
    }
    catch {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "Authentication required",
        });
    }
};
export { authenticateUser, authenticateTutor, authenticateAdmin, authenticateAffiliate, authorizePermissions, authenticateGeneral, };
