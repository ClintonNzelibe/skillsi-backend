const createTokenAdmin = (admin) => {
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
