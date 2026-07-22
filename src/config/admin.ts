export const ADMIN_EMAIL = "sharma.priyanshu3434@gmail.com";

export const ADMIN_EMAILS = [
  "sharma.priyanshu3434@gmail.com",
  "nikhilbhor201@gmail.com"
];

export const isAdminEmail = (email: string | null | undefined) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
};
