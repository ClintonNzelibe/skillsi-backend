import jwt from "jsonwebtoken";
const createUserJWT = ({ userId, email, fullName }) => {
    const payload = { userId, email, fullName };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_LIFETIME,
    });
    return token;
};
const createTutorJWT = ({ tutorId, email, fName, lName, }) => {
    const payload = {
        tutorId,
        email,
        fName,
        lName,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_LIFETIME,
    });
    return token;
};
const createAdminJWT = ({ adminId, firstName, lastName, userName, email, role, }) => {
    const payload = {
        adminId,
        firstName,
        lastName,
        userName,
        email,
        role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_LIFETIME,
    });
    return token;
};
const createAffiliateJWT = ({ affiliateId, email, firstName, lastName, userName, }) => {
    const payload = {
        affiliateId,
        email,
        firstName,
        lastName,
        userName,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_LIFETIME,
    });
    return token;
};
const isTokenValid = ({ token }) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    }
    catch (error) {
        return false;
    }
};
const attachCookiesToResponse = ({ res, user }) => {
    const token = createUserJWT(user);
    return token;
};
export { createUserJWT, createTutorJWT, createAdminJWT, createAffiliateJWT, isTokenValid, attachCookiesToResponse, };
