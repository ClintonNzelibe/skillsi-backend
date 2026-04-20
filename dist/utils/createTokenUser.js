const createTokenUser = (user) => {
    const { userId, email, fullName } = user;
    return {
        userId,
        email,
        fullName,
    };
};
export default createTokenUser;
