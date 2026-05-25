const nodemailer = require('nodemailer');

const getTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  return nodemailer.createTransport({
    jsonTransport: true
  });
};

const getStatusCopy = (status) => {
  if (status === 'Shortlisted') {
    return {
      tone: '#22c55e',
      title: "You've been shortlisted",
      intro: 'Congratulations! You have been shortlisted for the selected role.',
      nextSteps: 'Further information has been sent to your registered email address.'
    };
  }

  return {
    tone: '#ef4444',
    title: 'Application Rejected',
    intro: 'We appreciate your interest in this role. Unfortunately, you were not selected for this position.',
    nextSteps: 'A detailed message has been sent to your registered email.'
  };
};

const sendApplicationStatusEmail = async ({ applicant, job, status }) => {
  const copy = getStatusCopy(status);
  const companyName = job.companyName || 'RoleLink employer';
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'RoleLink <no-reply@rolelink.ai>';

  const html = `
    <div style="margin:0;padding:32px;background:#0f172a;font-family:Arial,sans-serif;color:#e5e7eb;">
      <div style="max-width:640px;margin:0 auto;border:1px solid #334155;border-radius:18px;background:#111827;overflow:hidden;">
        <div style="padding:28px;border-bottom:1px solid #334155;background:linear-gradient(135deg,rgba(59,130,246,.18),rgba(15,23,42,.95));">
          <p style="margin:0 0 8px;color:#93c5fd;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">RoleLink Application Update</p>
          <h1 style="margin:0;color:#fff;font-size:28px;line-height:1.25;">${copy.title}</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Hi ${applicant.name || 'there'},</p>
          <p style="margin:0 0 22px;font-size:16px;line-height:1.6;">${copy.intro}</p>
          <div style="border:1px solid #334155;border-radius:14px;padding:18px;background:#0f172a;">
            <p style="margin:0 0 10px;color:#94a3b8;font-size:13px;">Job title</p>
            <p style="margin:0 0 18px;color:#fff;font-size:18px;font-weight:700;">${job.title}</p>
            <p style="margin:0 0 10px;color:#94a3b8;font-size:13px;">Company</p>
            <p style="margin:0 0 18px;color:#fff;font-size:16px;font-weight:700;">${companyName}</p>
            <p style="margin:0 0 10px;color:#94a3b8;font-size:13px;">Application status</p>
            <p style="margin:0;color:${copy.tone};font-size:16px;font-weight:800;">${status}</p>
          </div>
          <p style="margin:22px 0 0;font-size:15px;line-height:1.6;">${copy.nextSteps}</p>
          <p style="margin:22px 0 0;color:#94a3b8;font-size:13px;line-height:1.6;">Thank you for using RoleLink. Keep your profile and resume updated for stronger matches.</p>
        </div>
      </div>
    </div>
  `;

  await getTransporter().sendMail({
    from,
    to: applicant.email,
    subject: `RoleLink update: ${status} for ${job.title}`,
    html,
    text: `${copy.title}\n\n${copy.intro}\n\nJob title: ${job.title}\nCompany: ${companyName}\nStatus: ${status}\n\n${copy.nextSteps}`
  });
};

module.exports = { sendApplicationStatusEmail };
