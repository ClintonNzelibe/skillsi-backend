const GenerateRandomPassword = async () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const specialChars = "!@#$%^&*()";
    const allChars = uppercase + lowercase + digits + specialChars;
    let password = "";
    // Ensure one uppercase, one lowercase, one special character, and two digits
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
    password += digits[Math.floor(Math.random() * digits.length)];
    password += digits[Math.floor(Math.random() * digits.length)];
    // Fill the rest of the password length randomly
    for (let i = password.length; i < 12; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    // Shuffle the password to randomize character positions
    password = password
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
    return password;
};
export default GenerateRandomPassword;
