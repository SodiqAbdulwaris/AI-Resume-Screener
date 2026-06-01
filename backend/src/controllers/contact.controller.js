const sgMail = require('@sendgrid/mail');
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

  sgMail.setApiKey(config.sendgridApiKey);

  try {
    await sgMail.send({
      to: config.contactReceiverEmail,
      from: config.sendgridFromEmail,
      replyTo: email,
      subject: `HireSignal Contact: Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p style="white-space:pre-wrap">${message.replace(/\n/g, '<br>')}</p>
      `,
    });
  } catch (err) {
    // TEMPORARY DEBUG — remove before final production commit
    const sgBody = err?.response?.body;
    console.error('[contact] SendGrid error:', JSON.stringify(sgBody ?? err?.message));
    return res.status(500).json({
      success: false,
      message: 'Failed to send message.',
      // eslint-disable-next-line no-underscore-dangle
      _debug: sgBody ?? err?.message ?? String(err),
      data: null,
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Message sent successfully.',
    data: null,
  });
}

module.exports = { handleContactForm };
