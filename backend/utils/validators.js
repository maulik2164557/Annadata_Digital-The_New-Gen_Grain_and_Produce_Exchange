/**
 * Validate Indian Phone Number format
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate Email address format
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Validate minimum password strength (at least 6 characters)
 */
const isStrongPassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

module.exports = {
  isValidPhone,
  isValidEmail,
  isStrongPassword,
};