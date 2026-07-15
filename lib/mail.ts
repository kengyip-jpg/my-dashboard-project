import nodemailer from 'nodemailer';

// 建立一個 SMTP 傳輸器，使用 Gmail 服務
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// 建立一個專門用來寄送驗證碼的函數
export async function sendOTPEmail(toEmail: string, otpCode: string) {
  const mailOptions = {
    from: `"Office Coffee Lifesaver ☕" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Your game login verification code',
    html: `
      <div style="font-family: sans-serif; text-align: center; padding: 20px;">
        <h2>Welcome to the office slacking-off universe!</h2>
        <p>Your login verification code is:</p>
        <h1 style="color: #d97706; font-size: 40px; letter-spacing: 5px;">${otpCode}</h1>
        <p style="color: #666; font-size: 14px;">This verification code will expire in 5 minutes. Do not share this code with your supervisor.🤫</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification code sent successfully. ${otpCode} 給 ${toEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
}