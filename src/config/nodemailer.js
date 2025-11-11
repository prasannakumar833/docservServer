const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "prasannakumar833199@gmail.com",
    pass: "zzxffcblkpvjkibi"
  }
});

module.exports = transporter;
