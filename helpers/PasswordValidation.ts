const PasswordValidation = (password: string): string | null => {
  const minLength = 12;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength)
    return "Password must be at least 12 characters long.";
  if (!hasUpperCase)
    return "Password must include at least one uppercase letter.";
  if (!hasLowerCase)
    return "Password must include at least one lowercase letter.";
  if (!hasNumber) return "Password must include at least one number.";
  if (!hasSpecialChar)
    return "Password must include at least one special character.";

  return null; // Valid password
};

export default PasswordValidation;
