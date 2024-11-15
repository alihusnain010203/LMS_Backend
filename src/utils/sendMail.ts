// import fs from 'fs';
// import nodemailer from 'nodemailer';

// export const sendMail = async (to: string, subject: string, html: string) => {
//     const body = fs.readFileSync(html, 'utf8');
//     console.log("body", body)
//     // const transporter = nodemailer.createTransport({
//     //     service: 'gmail',
//     //     auth: {
//     //         user: process.env.EMAIL,
//     //         pass: process.env.PASSWORD
//     //     }
//     // });
//     // const mailOptions = {
//     //     from: process.env.EMAIL,
//     //     to: to,
//     //     subject: subject,
//     //     html: body
//     // };

//     // transporter.sendMail(mailOptions, function (error, info) {
//     //     if (error) {
//     //         console.log(error);
//     //     } else {
//     //         console.log('Email sent: ' + info.response);

//     //     }
//     // });
// }
require('dotenv').config();
import nodemailer, {Transporter} from 'nodemailer';
import ejs from 'ejs';
import path from 'path';

interface EmailOptions{
    email:string;
    subject:string;
    template:string;
    data: {[key:string]:any};
}

const sendMail = async (options: EmailOptions):Promise <void> => {
    const transporter: Transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        service: process.env.SMTP_SERVICE,
        auth:{
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const {email,subject,template,data} = options;

    const templatePath = path.join(__dirname,`../templates/${template}`);

    // Render the email template with EJS
    const html:string = await ejs.renderFile(templatePath,data);
 

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html: html,
    };

    await transporter.sendMail(mailOptions);
};

export default sendMail;