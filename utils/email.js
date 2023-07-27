const nodeMailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

// new Email(user,url).sendWelcome();

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Leting sun <${process.env.EMAIL_FROM}>`;
    }
    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            //sendgrid
            return 1;
        }
        //1. create a transporter
        // const transporter = nodeMailer.createTransport({
        //     host: process.env.EMAIL_HOST,
        //     port: process.env.EMAIL_PORT,
        //     auth: {
        //         user: process.env.EMAIL_USERNAME, // generated ethereal user
        //         pass: process.env.EMAIL_PASSWORD, // generated ethereal password
        //     },
        // });
        return nodeMailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "0c4fbc40b4063e",
                pass: "4a9176cf589135"
            }
        });

    }
    async send(template, subject) {
        // 1) Render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
        firstName: this.firstName,
        url: this.url,
        subject
    });
    const text = htmlToText(html);
    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }
    async sendWelcome() {
        await this.send('welcome', 'Welcome to the natours family!');
    }
    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)');
    }
}

