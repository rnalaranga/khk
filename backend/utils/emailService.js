const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendInvoiceEmail = async (email, userDetails, order, items) => {
  const transporter = createTransporter();

  // Format date
  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate totals matching the screenshot
  const subTotal = order.total_amount;
  // Assume discount is 0 for now since it's not fully tracked at order level, 
  // or calculate if there is a difference. We'll just show 0 discount if none.
  const discount = 0; 
  const grandTotal = subTotal - discount;

  // Invoice Number (pad to 7 digits)
  const invoiceNo = String(order.id).padStart(7, '0');

  // Build items HTML
  const itemsHtml = items.map(item => {
    const itemQty = item.qty || item.quantity;
    const itemPrice = item.finalPrice || item.price;
    return `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #ddd; color: #333; font-size: 14px;">${item.name}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #ddd; text-align: right; color: #333; font-size: 14px;">${Number(itemPrice).toLocaleString()}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #ddd; text-align: center; color: #333; font-size: 14px;">${itemQty}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #ddd; text-align: right; color: #333; font-size: 14px;">${(itemPrice * itemQty).toLocaleString()}</td>
    </tr>
  `;
  }).join('');

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Invoice</title>
  </head>
  <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
    <table width="100%" maxWidth="800" style="max-width: 800px; margin: 0 auto; background: #fff; border-collapse: collapse; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <tr>
        <!-- Left Vertical Invoice Text (Fallback to normal if client doesn't support writing-mode) -->
        <td width="60" style="vertical-align: bottom; padding: 20px 10px; border-right: 1px solid #eee;">
          <div style="writing-mode: vertical-rl; transform: rotate(180deg); color: #8b1e15; font-size: 28px; font-family: Arial, sans-serif; white-space: nowrap;">
            Invoice ${invoiceNo}
          </div>
        </td>
        
        <!-- Main Content Area -->
        <td style="padding: 40px; vertical-align: top;">
          
          <!-- Header: Address & Logo -->
          <table width="100%" style="border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="vertical-align: top;">
                <h1 style="color: #9c1c15; margin: 0 0 5px 0; font-size: 24px; font-family: Arial, sans-serif;">KHK AUTO PARTS</h1>
                <p style="margin: 0; color: #666; font-size: 13px; line-height: 1.5;">
                  1530, Matale road, Alawathugoda<br>
                  Kandy.<br><br>
                  <strong>Tel:</strong> +94 719 010 751 | +94 703 013 068<br>
                  <strong>Email:</strong> autopartskhk@gmail.com<br>
                  <strong>Web:</strong> www.khkautoparts.com
                </p>
              </td>
              <td style="vertical-align: top; text-align: right;">
                <img src="https://khkautoparts.com/logo.png" alt="KHK Auto Parts Logo" style="max-width: 120px; height: auto;">
              </td>
            </tr>
          </table>

          <hr style="border: none; border-top: 1px solid #9c1c15; margin-bottom: 20px;">

          <!-- Thank You Message -->
          <div style="background-color: #fff9f9; border-left: 4px solid #9c1c15; padding: 15px 20px; margin-bottom: 25px; border-radius: 0 4px 4px 0;">
            <p style="margin: 0; color: #444; font-size: 14px; line-height: 1.6;">
              <strong style="color: #9c1c15; font-size: 16px;">Hi ${userDetails.name},</strong><br><br>
              Thank you for trusting <strong>KHK Auto Parts</strong>! We have successfully received your order and it is currently being processed. We truly appreciate your business and hope our premium products keep your vehicle running smoothly. Please find your invoice details below.
            </p>
          </div>

          <!-- Billing Info -->
          <table width="100%" style="border-collapse: collapse; margin-bottom: 30px;">
            <tr>
              <td style="vertical-align: top; width: 33%;">
                <p style="margin: 0 0 5px 0; color: #9c1c15; font-size: 14px;">Date</p>
                <p style="margin: 0; color: #666; font-size: 13px;">${orderDate}</p>
              </td>
              <td style="vertical-align: top; width: 33%;">
                <p style="margin: 0 0 5px 0; color: #9c1c15; font-size: 14px;">To</p>
                <p style="margin: 0; color: #666; font-size: 13px; line-height: 1.5;">
                  ${userDetails.name.toUpperCase()}<br>
                  ${order.shipping_address}<br>
                  ${order.shipping_city}
                </p>
              </td>
              <td style="vertical-align: top; width: 33%;">
                <p style="margin: 0 0 5px 0; color: #9c1c15; font-size: 14px;">Ship To</p>
                <p style="margin: 0; color: #666; font-size: 13px;">Same as recipient</p>
              </td>
            </tr>
          </table>

          <!-- Items Table -->
          <table width="100%" style="border-collapse: collapse; margin-bottom: 20px; font-family: Arial, sans-serif;">
            <thead>
              <tr>
                <th style="background-color: #9c1c15; color: white; padding: 10px 8px; text-align: left; font-size: 14px; font-weight: bold;">Item & Description</th>
                <th style="background-color: #9c1c15; color: white; padding: 10px 8px; text-align: right; font-size: 14px; font-weight: bold;">Unit Price</th>
                <th style="background-color: #9c1c15; color: white; padding: 10px 8px; text-align: center; font-size: 14px; font-weight: bold;">Qty</th>
                <th style="background-color: #9c1c15; color: white; padding: 10px 8px; text-align: right; font-size: 14px; font-weight: bold;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totals Table -->
          <table width="100%" style="border-collapse: collapse; margin-bottom: 30px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #333; font-size: 14px;">SUB TOTAL</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: #333; font-size: 14px;">${subTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #333; font-size: 14px;">DISCOUNT</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: #333; font-size: 14px;">${discount > 0 ? discount.toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 8px; border-bottom: 2px solid #333; font-size: 14px; font-weight: bold;">GRAND TOTAL</td>
              <td style="padding: 12px 8px; border-bottom: 2px solid #333; text-align: right; font-size: 16px; font-weight: bold;">${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            </tr>
          </table>

          <div style="text-align: right; margin-bottom: 40px;">
            <p style="color: #9c1c15; font-size: 18px; margin: 0;">Thank you for your ORDER!</p>
          </div>

          <!-- Payment Method -->
          <div>
            <h3 style="color: #9c1c15; font-size: 18px; margin: 0 0 10px 0; border-bottom: 1px solid #9c1c15; display: inline-block;">Payment Method</h3>
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 5px 0 0 0;">
              Bank: Commercial Bank<br>
              Account Name: K K M H S DILHARI<br>
              Account Number: 8006350853
            </p>
          </div>

        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const mailOptions = {
    from: `"KHK Auto Parts" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Invoice ${invoiceNo} - KHK Auto Parts`,
    html: htmlContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invoice email sent to ${email}`);
  } catch (error) {
    console.error('Error sending invoice email:', error);
  }
};

module.exports = {
  createTransporter,
  sendInvoiceEmail
};
