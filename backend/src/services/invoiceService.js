const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const logger = require('../utils/logger');

/**
 * Convert number to words in Indian Numbering System
 * @param {number} num 
 * @returns {string} e.g. "Rupees Four Thousand Five Hundred and Twenty Only"
 */
const numberToWords = (num) => {
  const integerPart = Math.floor(num);
  if (integerPart === 0) return 'Rupees Zero Only';

  const ones = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
    'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + integerPart).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return `Rupees ${integerPart} Only`;

  let str = '';
  str += Number(n[1]) !== 0 ? (ones[Number(n[1])] || tens[n[1][0]] + ' ' + ones[n[1][1]]) + 'Crore ' : '';
  str += Number(n[2]) !== 0 ? (ones[Number(n[2])] || tens[n[2][0]] + ' ' + ones[n[2][1]]) + 'Lakh ' : '';
  str += Number(n[3]) !== 0 ? (ones[Number(n[3])] || tens[n[3][0]] + ' ' + ones[n[3][1]]) + 'Thousand ' : '';
  str += Number(n[4]) !== 0 ? (ones[Number(n[4])] || tens[n[4][0]] + ' ' + ones[n[4][1]]) + 'Hundred ' : '';
  str += Number(n[5]) !== 0 ? ((str !== '') ? 'and ' : '') + (ones[Number(n[5])] || tens[n[5][0]] + ' ' + ones[n[5][1]]) : '';

  return 'Rupees ' + str.trim() + ' Only';
};

/**
 * Map product category or name to standard Indian HSN / SAC Code
 */
const getHsnCode = (item) => {
  if (item.sku && item.sku.startsWith('HSN-')) {
    return item.sku.replace('HSN-', '');
  }
  const name = (item.name || '').toLowerCase();
  if (name.includes('phone') || name.includes('laptop') || name.includes('headphone') || name.includes('electronic')) return '8517';
  if (name.includes('shirt') || name.includes('dress') || name.includes('shoe') || name.includes('wear')) return '6109';
  if (name.includes('book') || name.includes('novel') || name.includes('guide')) return '4901';
  if (name.includes('beauty') || name.includes('cream') || name.includes('perfume')) return '3304';
  if (name.includes('home') || name.includes('chair') || name.includes('desk') || name.includes('table') || name.includes('furniture') || name.includes('light')) return '9403';
  return '9983';
};

/**
 * Generate official GST Tax Invoice PDF Document
 * @param {Object} order - Mongoose Order document
 * @param {WritableStream} outputStream - Response stream or write stream
 * @returns {Promise<void>}
 */
const generateInvoice = async (order, outputStream) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `Tax Invoice - ${order.orderNumber}`,
          Author: 'E-Shop Retail Technologies Pvt. Ltd.',
          Subject: `Official GST Tax Invoice for Order ${order.orderNumber}`,
          Keywords: 'GST, Invoice, Tax, E-Shop, Indian GST'
        }
      });

      doc.pipe(outputStream);

      // --- Colors & Branding Constants ---
      const PRIMARY = '#4F46E5';
      const DARK = '#0F172A';
      const TEXT_MUTED = '#64748B';
      const BORDER_COLOR = '#E2E8F0';
      const BG_LIGHT = '#F8FAFC';
      const SUCCESS_COLOR = '#16A34A';

      // --- GST Calculations ---
      const subtotal = order.subtotal || 0;
      const totalTax = order.tax || Math.round(subtotal * 0.18);
      const shippingCost = order.shippingCost || 0;
      const discount = order.discount || 0;
      const grandTotal = order.total || (subtotal + totalTax + shippingCost - discount);

      const customerState = (order.shippingAddress?.state || 'Delhi').trim();
      const isKarnataka = customerState.toLowerCase().includes('karnataka');

      // Intrastate: CGST 9% + SGST 9% | Interstate: IGST 18%
      const cgst = isKarnataka ? +(totalTax / 2).toFixed(2) : 0;
      const sgst = isKarnataka ? +(totalTax / 2).toFixed(2) : 0;
      const igst = !isKarnataka ? +totalTax.toFixed(2) : 0;

      const invoiceNumber = `INV-${order.orderNumber}`;
      const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      // --- QR Code Generation (Digital Verification) ---
      const qrPayload = JSON.stringify({
        doc: 'TAX_INVOICE',
        seller: 'E-Shop Retail Technologies Pvt Ltd',
        gstin: '29AABCE1234F1Z5',
        invNo: invoiceNumber,
        invDate: invoiceDate,
        orderId: order.orderNumber,
        amt: grandTotal,
        gst: totalTax,
        state: customerState,
        status: (order.payment?.status || 'PENDING').toUpperCase()
      });

      const qrBuffer = await QRCode.toBuffer(qrPayload, {
        width: 150,
        margin: 1,
        color: { dark: '#0F172A', light: '#FFFFFF' }
      });

      // ==========================================
      // 1. TOP HEADER & BRANDING
      // ==========================================
      // Brand Logo Box
      doc.roundedRect(36, 36, 62, 22, 4).fill(PRIMARY);
      doc.fillColor('#FFFFFF').fontSize(10.5).font('Helvetica-Bold').text('E-SHOP', 44, 42);

      // Company Title & GST Credentials
      doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text('E-Shop Retail Technologies Private Limited', 108, 36);
      doc.fillColor(PRIMARY).fontSize(8.5).font('Helvetica-Bold').text('TAX INVOICE / BILL OF SUPPLY', 108, 50);
      doc.fillColor(TEXT_MUTED).fontSize(7).font('Helvetica')
        .text('GSTIN: 29AABCE1234F1Z5  |  PAN: AABCE1234F  |  CIN: U72900KA2023PTC123456', 108, 62)
        .text('Registered Office: Tech Park, Electronic City Phase 1, Bengaluru, Karnataka - 560100', 108, 72)
        .text('Toll-Free Customer Support: +91 1800-200-8803  |  Email: tax-invoices@eshop.com', 108, 82);

      // QR Code Box (Upper Right)
      doc.image(qrBuffer, 485, 36, { width: 62, height: 62 });
      doc.fillColor(SUCCESS_COLOR).fontSize(6.5).font('Helvetica-Bold').text('✓ GST VERIFIED', 484, 101, { width: 65, align: 'center' });

      // Horizontal Divider
      doc.moveTo(36, 114).lineTo(559, 114).lineWidth(1.5).strokeColor(PRIMARY).stroke();

      // ==========================================
      // 2. METADATA TWO-COLUMN SECTION
      // ==========================================
      const boxY = 124;
      const boxH = 92;
      const leftW = 256;
      const rightW = 256;
      const rightX = 303;

      // Left Box: Recipient / Customer Details
      doc.roundedRect(36, boxY, leftW, boxH, 6).fill(BG_LIGHT).strokeColor(BORDER_COLOR).lineWidth(1).stroke();
      doc.fillColor(PRIMARY).fontSize(8).font('Helvetica-Bold').text('BILLED TO / RECIPIENT DETAILS', 46, boxY + 8);

      const customerName = order.user?.name || order.shippingAddress?.name || 'Valued Customer';
      doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text(customerName, 46, boxY + 22);

      const addr1 = order.shippingAddress?.street || 'Customer Address';
      const addr2 = `${order.shippingAddress?.city || ''}, ${customerState} - ${order.shippingAddress?.zipCode || ''}`;
      const addr3 = order.shippingAddress?.country || 'India';
      const phone = order.shippingAddress?.phone ? `Phone: ${order.shippingAddress.phone}` : '';
      const email = order.user?.email ? `Email: ${order.user.email}` : '';

      doc.fillColor(TEXT_MUTED).fontSize(7.5).font('Helvetica')
        .text(addr1, 46, boxY + 34, { width: 236, lineBreak: false, ellipsis: true })
        .text(addr2, 46, boxY + 45)
        .text(addr3, 46, boxY + 56)
        .text(`${phone}${phone && email ? '  |  ' : ''}${email}`, 46, boxY + 68, { width: 236, lineBreak: false, ellipsis: true });

      doc.fillColor(DARK).fontSize(7.5).font('Helvetica-Bold')
        .text(`Place of Supply: ${customerState} (State Code: ${isKarnataka ? '29' : '99'})`, 46, boxY + 79);

      // Right Box: Invoice Details
      doc.roundedRect(rightX, boxY, rightW, boxH, 6).fill(BG_LIGHT).strokeColor(BORDER_COLOR).lineWidth(1).stroke();
      doc.fillColor(PRIMARY).fontSize(8).font('Helvetica-Bold').text('INVOICE & TRANSACTION DETAILS', rightX + 10, boxY + 8);

      const metaLines = [
        ['Invoice Number:', invoiceNumber],
        ['Invoice Date:', invoiceDate],
        ['Order Reference:', order.orderNumber],
        ['Payment Method:', (order.payment?.method || 'Online').replace(/_/g, ' ').toUpperCase()],
        ['Payment Status:', (order.payment?.status || 'Pending').toUpperCase()],
        ['Reverse Charge:', 'No (E-Commerce Operator Liable under Sec 9(5))']
      ];

      metaLines.forEach(([label, val], idx) => {
        const yPos = boxY + 22 + (idx * 11);
        doc.fillColor(TEXT_MUTED).fontSize(7.5).font('Helvetica').text(label, rightX + 10, yPos);
        const isHighlight = label === 'Invoice Number:' || label === 'Payment Status:';
        doc.fillColor(isHighlight ? PRIMARY : DARK)
          .fontSize(7.5)
          .font(isHighlight ? 'Helvetica-Bold' : 'Helvetica')
          .text(val, rightX + 85, yPos, { width: 160, lineBreak: false, ellipsis: true });
      });

      // ==========================================
      // 3. ITEMIZED GST GOODS TABLE
      // ==========================================
      const tableY = 226;
      const rowHeight = 22;

      // Table Header Row
      doc.roundedRect(36, tableY, 523, 20, 3).fill(PRIMARY);
      doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');

      doc.text('#', 42, tableY + 6, { width: 18 });
      doc.text('Item Description & SKU', 64, tableY + 6, { width: 170 });
      doc.text('HSN', 238, tableY + 6, { width: 35, align: 'center' });
      doc.text('Qty', 278, tableY + 6, { width: 25, align: 'center' });
      doc.text('Unit Rate', 308, tableY + 6, { width: 55, align: 'right' });
      doc.text('Taxable Amt', 368, tableY + 6, { width: 60, align: 'right' });
      doc.text(isKarnataka ? 'CGST+SGST' : 'IGST (18%)', 432, tableY + 6, { width: 55, align: 'right' });
      doc.text('Total (INR)', 492, tableY + 6, { width: 60, align: 'right' });

      let currentY = tableY + 20;
      const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];

      items.forEach((item, index) => {
        const isAlt = index % 2 === 1;
        if (isAlt) {
          doc.rect(36, currentY, 523, rowHeight).fill(BG_LIGHT);
        }

        // Bottom border
        doc.moveTo(36, currentY + rowHeight).lineTo(559, currentY + rowHeight).lineWidth(0.5).strokeColor(BORDER_COLOR).stroke();

        const itemPrice = Number(item.price) || 0;
        const itemQty = Number(item.quantity) || 1;
        const taxableVal = itemPrice * itemQty;
        const itemTax = +(taxableVal * 0.18).toFixed(2);
        const itemTotal = +(taxableVal + itemTax).toFixed(2);
        const hsn = getHsnCode(item);

        doc.fillColor(DARK).fontSize(7.5).font('Helvetica');
        doc.text(String(index + 1), 42, currentY + 6, { width: 18 });

        // Product Name (truncated cleanly)
        const nameText = item.name ? (item.name.length > 34 ? item.name.slice(0, 32) + '...' : item.name) : 'Product Item';
        doc.font('Helvetica-Bold').text(nameText, 64, currentY + 4, { width: 170 });
        if (item.sku) {
          doc.fillColor(TEXT_MUTED).fontSize(6).font('Helvetica').text(`SKU: ${item.sku}`, 64, currentY + 13);
        }

        doc.fillColor(DARK).fontSize(7.5).font('Helvetica');
        doc.text(hsn, 238, currentY + 6, { width: 35, align: 'center' });
        doc.text(String(itemQty), 278, currentY + 6, { width: 25, align: 'center' });
        doc.text(`Rs. ${itemPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 308, currentY + 6, { width: 55, align: 'right' });
        doc.text(`Rs. ${taxableVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 368, currentY + 6, { width: 60, align: 'right' });
        doc.text(`Rs. ${itemTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 432, currentY + 6, { width: 55, align: 'right' });
        doc.font('Helvetica-Bold').text(`Rs. ${itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 492, currentY + 6, { width: 60, align: 'right' });

        currentY += rowHeight;
      });

      // ==========================================
      // 4. SUMMARY & TOTALS SECTION
      // ==========================================
      currentY += 12;
      const summaryLeftX = 36;
      const summaryRightX = 340;
      const summaryBoxW = 219;

      // Left Summary: Amount in Words & Payment Reference
      doc.fillColor(PRIMARY).fontSize(7.5).font('Helvetica-Bold').text('INVOICE AMOUNT IN WORDS:', summaryLeftX, currentY);
      doc.fillColor(DARK).fontSize(8).font('Helvetica-Bold')
        .text(numberToWords(grandTotal), summaryLeftX, currentY + 11, { width: 285 });

      // Transaction / Settlement Box
      const pmtBoxY = currentY + 36;
      doc.roundedRect(summaryLeftX, pmtBoxY, 285, 62, 5).fill(BG_LIGHT).strokeColor(BORDER_COLOR).lineWidth(1).stroke();
      doc.fillColor(PRIMARY).fontSize(7.5).font('Helvetica-Bold').text('PAYMENT SETTLEMENT & AUTHENTICATION', summaryLeftX + 8, pmtBoxY + 7);

      const txnId = order.payment?.transactionId || (order.payment?.razorpayPaymentId || 'N/A');
      doc.fillColor(TEXT_MUTED).fontSize(7).font('Helvetica')
        .text(`Gateway Reference: Razorpay Cryptographic Settlement`, summaryLeftX + 8, pmtBoxY + 19)
        .text(`Transaction ID: ${txnId}`, summaryLeftX + 8, pmtBoxY + 29)
        .text(`Paid Timestamp: ${order.payment?.paidAt ? new Date(order.payment.paidAt).toLocaleString('en-IN') : invoiceDate}`, summaryLeftX + 8, pmtBoxY + 39);

      doc.fillColor(SUCCESS_COLOR).fontSize(7).font('Helvetica-Bold')
        .text(`Payment Status: ${(order.payment?.status || 'PENDING').toUpperCase()} (100% Secure Checkout)`, summaryLeftX + 8, pmtBoxY + 49);

      // Right Summary: Itemized Totals Table
      doc.roundedRect(summaryRightX, currentY, summaryBoxW, 106, 5).fill(BG_LIGHT).strokeColor(BORDER_COLOR).lineWidth(1).stroke();

      const totalsRows = [
        ['Taxable Subtotal:', `Rs. ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        isKarnataka ? ['Central GST (CGST @ 9%):', `Rs. ${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`] : null,
        isKarnataka ? ['State GST (SGST @ 9%):', `Rs. ${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`] : null,
        !isKarnataka ? ['Integrated GST (IGST @ 18%):', `Rs. ${igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`] : null,
        ['Shipping & Handling:', shippingCost === 0 ? 'FREE' : `Rs. ${shippingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        discount > 0 ? ['Discount Applied:', `-Rs. ${discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`] : null
      ].filter(Boolean);

      totalsRows.forEach(([lbl, val], idx) => {
        const rowY = currentY + 8 + (idx * 13);
        doc.fillColor(TEXT_MUTED).fontSize(7.5).font('Helvetica').text(lbl, summaryRightX + 10, rowY);
        doc.fillColor(DARK).fontSize(7.5).font('Helvetica-Bold').text(val, summaryRightX + 10, rowY, { width: summaryBoxW - 20, align: 'right' });
      });

      // Divider inside total box
      const grandTotalY = currentY + 85;
      doc.moveTo(summaryRightX + 10, grandTotalY - 4).lineTo(summaryRightX + summaryBoxW - 10, grandTotalY - 4).lineWidth(1).strokeColor(PRIMARY).stroke();

      doc.fillColor(PRIMARY).fontSize(9).font('Helvetica-Bold').text('GRAND TOTAL (INR):', summaryRightX + 10, grandTotalY);
      doc.fillColor(PRIMARY).fontSize(10).font('Helvetica-Bold')
        .text(`Rs. ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryRightX + 10, grandTotalY - 1, { width: summaryBoxW - 20, align: 'right' });

      // ==========================================
      // 5. SIGNATORY & LEGAL DECLARATION FOOTER
      // ==========================================
      const footerY = 690;

      // Authorized Signatory Box (Right)
      doc.fillColor(DARK).fontSize(8).font('Helvetica-Bold').text('For E-Shop Retail Technologies Pvt. Ltd.', 370, footerY);
      doc.roundedRect(385, footerY + 14, 150, 24, 3).strokeColor(SUCCESS_COLOR).lineWidth(0.8).stroke();
      doc.fillColor(SUCCESS_COLOR).fontSize(7).font('Helvetica-Bold').text('DIGITALLY SIGNED & VERIFIED', 385, footerY + 22, { width: 150, align: 'center' });
      doc.fillColor(TEXT_MUTED).fontSize(7).font('Helvetica').text('Authorized Signatory', 415, footerY + 44);

      // Legal Terms & Declarations (Left)
      doc.fillColor(PRIMARY).fontSize(7.5).font('Helvetica-Bold').text('TERMS & CONDITIONS / LEGAL DECLARATION:', 36, footerY);
      doc.fillColor(TEXT_MUTED).fontSize(6.5).font('Helvetica')
        .text('1. We declare that this invoice shows the actual price of the goods described and all particulars are true and correct.', 36, footerY + 12)
        .text('2. This is a computer-generated tax invoice issued in accordance with Section 31 of CGST Act, 2017. Does not require physical signature.', 36, footerY + 22)
        .text('3. In case of any query, contact our 24/7 E-Shop Concierge Desk with Order Reference number.', 36, footerY + 32)
        .text('4. Goods once sold can be returned within 7 days of delivery per E-Shop Standard Return Policy.', 36, footerY + 42)
        .text('5. All disputes are subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka, India.', 36, footerY + 52);

      // Bottom copyright bar
      doc.moveTo(36, 770).lineTo(559, 770).lineWidth(0.5).strokeColor(BORDER_COLOR).stroke();
      doc.fillColor(TEXT_MUTED).fontSize(6.5).font('Helvetica')
        .text('E-Shop Platform • Powered by React 19, Node.js & Machine Learning • Page 1 of 1', 36, 776, { width: 523, align: 'center' });

      doc.end();

      outputStream.on('finish', () => {
        logger.info(`Tax invoice generated successfully for order ${order.orderNumber}`);
        resolve();
      });

      outputStream.on('error', (err) => {
        logger.error(`Error in invoice PDF stream for order ${order.orderNumber}: ${err.message}`);
        reject(err);
      });
    } catch (err) {
      logger.error(`Failed to generate GST invoice: ${err.message}`);
      reject(err);
    }
  });
};

/**
 * Generate invoice as in-memory Buffer (for tests or attachments)
 * @param {Object} order 
 * @returns {Promise<Buffer>}
 */
const generateInvoiceBuffer = async (order) => {
  const { PassThrough } = require('stream');
  const stream = new PassThrough();
  const chunks = [];

  stream.on('data', (chunk) => chunks.push(chunk));

  return new Promise(async (resolve, reject) => {
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
    try {
      await generateInvoice(order, stream);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateInvoice,
  generateInvoiceBuffer,
  numberToWords,
  getHsnCode
};
