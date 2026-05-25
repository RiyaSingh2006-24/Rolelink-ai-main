const EMAIL_DOMAIN_SUGGESTIONS = {
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.comm': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yahoo.comm': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmail.comm': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'outlook.con': 'outlook.com',
  'outlook.comm': 'outlook.com'
};

const getEmailDomainSuggestion = (email) => {
  const domain = String(email).trim().toLowerCase().split('@')[1];
  return domain ? EMAIL_DOMAIN_SUGGESTIONS[domain] : undefined;
};

const hasKnownEmailDomainTypo = (email) => Boolean(getEmailDomainSuggestion(email));

const buildEmailDomainTypoMessage = (email) => {
  const suggestion = getEmailDomainSuggestion(email);
  return suggestion ? `Email domain looks misspelled. Did you mean ${suggestion}?` : 'Valid email is required';
};

module.exports = {
  buildEmailDomainTypoMessage,
  getEmailDomainSuggestion,
  hasKnownEmailDomainTypo
};
