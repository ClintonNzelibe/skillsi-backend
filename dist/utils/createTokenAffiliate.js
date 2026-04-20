const createTokenAffiliate = (tutor) => {
    const { affiliateId, email, firstName, lastName, userName } = tutor;
    return {
        affiliateId,
        email,
        firstName,
        lastName,
        userName,
    };
};
export default createTokenAffiliate;
