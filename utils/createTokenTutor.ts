import { TokenTutor, Tutor } from "../type.js";

const createTokenTutor = (tutor: Tutor): TokenTutor => {
  const { tutorId, email, fName, lName } = tutor;
  return {
    tutorId,
    email,
    fName,
    lName,
  };
};

export default createTokenTutor;
