export default () => ({
  email: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
    from: process.env.MAIL_FROM_ADDRESS,
    fromName: process.env.MAIL_FROM_NAME,
    encryption: process.env.MAIL_ENCRYPTION,
  },
});
