const { Resend } = require('resend');
const config = require('../config/env');

function stripTags(str) {
  return typeof str === 'string' ? str.replace(/<[^>]*>/g, '').trim() : '';
}

async function handleContactForm(req, res, next) {
  const name = stripTags(req.body.name);
  const email = stripTags(req.body.email);
  const message = stripTags(req.body.message);

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required.',
      data: null,
    });
  }

  const resend = new Resend(config.resendApiKey);

  const { error } = await resend.emails.send({
    to: config.contactReceiverEmail,
    from: config.resendFromEmail,
    reply_to: email,
    subject: `HireSignal Contact: Message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p style="white-space:pre-wrap">${message.replace(/\n/g, '<br>')}</p>
    `,
  });

  if (error) {
    console.error('[contact] Resend error:', JSON.stringify(error));
    return next(error);
  }

  return res.status(200).json({
    success: true,
    message: 'Message sent successfully.',
    data: null,
  });
}

module.exports = { handleContactForm };
