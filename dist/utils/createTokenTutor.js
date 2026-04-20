const createTokenTutor = (tutor) => {
    const { tutorId, email, fName, lName } = tutor;
    return {
        tutorId,
        email,
        fName,
        lName,
    };
};
export default createTokenTutor;
