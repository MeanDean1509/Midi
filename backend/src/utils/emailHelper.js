/**
 * Send reset password verification code to user's email via Resend HTTP API.
 * @param {string} toEmail
 * @param {string} resetCode
 * @returns {Promise<any>}
 */
export const sendResetPasswordEmail = async (toEmail, resetCode) => {
    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
    const fromName = process.env.RESEND_FROM_NAME?.trim() || 'Midi Chat Support';

    if (!resendApiKey || !fromEmail) {
        throw new Error('Resend configuration is missing');
    }

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #4F46E5; margin: 0;">Midi Chat</h2>
            </div>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
            <h3 style="color: #111827; margin-top: 0;">Yêu cầu khôi phục mật khẩu</h3>
            <p style="color: #4b5563; line-height: 1.5;">Chào bạn,</p>
            <p style="color: #4b5563; line-height: 1.5;">Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản Midi liên kết với email này. Vui lòng sử dụng mã xác thực (OTP) dưới đây để tiếp tục:</p>
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 25px 0;">
                <span style="color: #4f46e5; font-size: 32px; font-weight: bold; letter-spacing: 5px; font-family: monospace;">${resetCode}</span>
            </div>
            <p style="color: #ef4444; font-size: 14px; line-height: 1.5;"><strong>Lưu ý:</strong> Mã này có hiệu lực trong vòng 10 phút. Nếu không phải bạn yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">&copy; ${new Date().getFullYear()} Midi Chat. All rights reserved.</p>
        </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [toEmail],
            subject: 'Mã xác thực khôi phục mật khẩu - Midi Chat',
            html,
        }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const error = new Error(data?.message || 'Failed to send email with Resend');
        error.status = response.status;
        error.response = data;
        throw error;
    }

    return data;
};
