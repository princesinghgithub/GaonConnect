const dns = require('dns');
const nodemailer = require('nodemailer');

const GMAIL_HOST = 'smtp.gmail.com';
const GMAIL_PORT = 465;

const resolveIPv4 = (hostname) =>
  new Promise((resolve) => {
    dns.resolve4(hostname, (err, addresses) => {
      resolve(!err && addresses && addresses.length ? addresses[0] : hostname);
    });
  });

// nodemailer resolves both A/AAAA records and picks one at random, which
// keeps hitting Gmail's IPv6 address on Railway (no outbound IPv6 route).
// Resolving IPv4 ourselves and passing the literal IP skips that lookup.
const createGmailTransporter = async () => {
  const host = await resolveIPv4(GMAIL_HOST);
  return nodemailer.createTransport({
    host,
    port: GMAIL_PORT,
    secure: true,
    tls: { servername: GMAIL_HOST },
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

module.exports = { createGmailTransporter };
