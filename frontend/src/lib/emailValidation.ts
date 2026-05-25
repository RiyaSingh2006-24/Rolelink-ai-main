const EMAIL_DOMAIN_SUGGESTIONS: Record<string, string> = {
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.comm": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yahoo.comm": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmail.comm": "hotmail.com",
  "outlok.com": "outlook.com",
  "outlook.co": "outlook.com",
  "outlook.con": "outlook.com",
  "outlook.comm": "outlook.com",
};

const EMAIL_FORMAT_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

export const getEmailValidationMessage = (email: string) => {
  const trimmedEmail = email.trim();

  if (!EMAIL_FORMAT_PATTERN.test(trimmedEmail)) {
    return "Please enter a valid email address like riya@gmail.com.";
  }

  const typoMessage = getEmailDomainTypoMessage(trimmedEmail);
  return typoMessage;
};

export const getEmailDomainTypoMessage = (email: string) => {
  const domain = email.trim().toLowerCase().split("@")[1];
  const suggestion = domain ? EMAIL_DOMAIN_SUGGESTIONS[domain] : undefined;
  return suggestion ? `Email domain looks misspelled. Did you mean ${suggestion}?` : "";
};
