// Centralized contact details sourced dynamically from environment variables
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'thehungrylab.kitchen@gmail.com';
export const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || '6291872593';

export const formatPhoneNumber = (phone = CONTACT_PHONE) => {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
};

export const FORMATTED_PHONE = formatPhoneNumber(CONTACT_PHONE);

