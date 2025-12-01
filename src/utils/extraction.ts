// Enhanced OCR extraction utilities

export interface ExtractedData {
  dates: ExtractedDate[];
  amounts: ExtractedAmount[];
  fields: Record<string, string>;
}

export interface ExtractedDate {
  type: 'due_date' | 'renewal_date' | 'warranty_date' | 'issue_date' | 'expiry_date' | 'general';
  date: string;
  originalText: string;
}

export interface ExtractedAmount {
  type: 'total' | 'subtotal' | 'tax' | 'payment' | 'general';
  amount: number;
  currency: string;
  originalText: string;
}

// Simulate enhanced OCR extraction
export function extractStructuredData(text: string): ExtractedData {
  const dates: ExtractedDate[] = [];
  const amounts: ExtractedAmount[] = [];
  const fields: Record<string, string> = {};

  // Extract dates
  const datePatterns = [
    { regex: /due\s*(?:date)?[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi, type: 'due_date' as const },
    { regex: /renewal\s*(?:date)?[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi, type: 'renewal_date' as const },
    { regex: /warranty\s*(?:until|through|expires?)?[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi, type: 'warranty_date' as const },
    { regex: /expir(?:y|es|ation)\s*(?:date)?[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi, type: 'expiry_date' as const },
    { regex: /(?:date|dated)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi, type: 'issue_date' as const },
  ];

  datePatterns.forEach(({ regex, type }) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      dates.push({
        type,
        date: match[1],
        originalText: match[0],
      });
    }
  });

  // Extract amounts
  const amountPatterns = [
    { regex: /total[:\s]*[\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, type: 'total' as const },
    { regex: /subtotal[:\s]*[\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, type: 'subtotal' as const },
    { regex: /tax[:\s]*[\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, type: 'tax' as const },
    { regex: /(?:amount|payment)[:\s]*[\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, type: 'payment' as const },
    { regex: /[\$€£]\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, type: 'general' as const },
  ];

  amountPatterns.forEach(({ regex, type }) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const amountStr = match[1].replace(/,/g, '');
      amounts.push({
        type,
        amount: parseFloat(amountStr),
        currency: 'USD',
        originalText: match[0],
      });
    }
  });

  // Extract common fields
  const fieldPatterns: Record<string, RegExp> = {
    invoiceNumber: /invoice\s*(?:#|no\.?|number)?[:\s]*([A-Z0-9\-]+)/i,
    orderNumber: /order\s*(?:#|no\.?|number)?[:\s]*([A-Z0-9\-]+)/i,
    modelNumber: /model\s*(?:#|no\.?|number)?[:\s]*([A-Z0-9\-]+)/i,
    serialNumber: /serial\s*(?:#|no\.?|number)?[:\s]*([A-Z0-9\-]+)/i,
    accountNumber: /account\s*(?:#|no\.?|number)?[:\s]*([A-Z0-9\-]+)/i,
    warrantyPeriod: /warranty[:\s]*(\d+\s*(?:year|month|day)s?)/i,
    vendor: /(?:from|vendor|seller|company)[:\s]*([A-Za-z\s&]+?)(?:\n|$)/i,
  };

  Object.entries(fieldPatterns).forEach(([key, regex]) => {
    const match = text.match(regex);
    if (match) {
      fields[key] = match[1].trim();
    }
  });

  return { dates, amounts, fields };
}

// Generate sample OCR text based on document type
export function generateSampleOCR(type: string, fileName: string): string {
  const templates: Record<string, string[]> = {
    receipt: [
      `RECEIPT\nStore: Tech Supplies Inc.\nDate: ${new Date().toLocaleDateString()}\n\nItem: Wireless Mouse\nPrice: $45.99\nItem: USB Cable\nPrice: $12.99\n\nSubtotal: $58.98\nTax: $5.31\nTotal: $64.29\n\nThank you for shopping!`,
      `PURCHASE RECEIPT\nAmazon.com\nOrder #123-4567890\nDate: ${new Date().toLocaleDateString()}\n\nProduct: Bluetooth Headphones\nQty: 1\nPrice: $79.99\n\nShipping: $0.00\nTax: $7.20\nTotal: $87.19`,
    ],
    invoice: [
      `INVOICE #INV-2024-001\nDate: ${new Date().toLocaleDateString()}\nDue Date: ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}\n\nBill To:\nJohn Smith\n123 Main Street\n\nDescription: Professional Services\nAmount: $1,500.00\n\nSubtotal: $1,500.00\nTax (10%): $150.00\nTotal: $1,650.00\n\nPayment Terms: Net 30`,
      `INVOICE\nFrom: ABC Consulting\nInvoice No: 2024-0042\nDate: ${new Date().toLocaleDateString()}\n\nServices Rendered:\n- Consultation (5 hrs): $500.00\n- Implementation: $1,200.00\n\nTotal Amount: $1,700.00\nDue Date: ${new Date(Date.now() + 14*24*60*60*1000).toLocaleDateString()}`,
    ],
    bill: [
      `UTILITY BILL\nElectric Company Inc.\nAccount #: 1234567890\nBilling Period: Nov 1 - Nov 30, 2024\n\nPrevious Balance: $0.00\nCurrent Charges: $125.47\nTotal Due: $125.47\nDue Date: ${new Date(Date.now() + 21*24*60*60*1000).toLocaleDateString()}\n\nPay online at electriccompany.com`,
      `PHONE BILL\nMobile Carrier\nAccount: 555-0123-4567\n\nMonthly Plan: $65.00\nData Overage: $10.00\nTaxes & Fees: $8.25\nTotal: $83.25\nDue Date: ${new Date(Date.now() + 15*24*60*60*1000).toLocaleDateString()}`,
    ],
    warranty: [
      `WARRANTY CERTIFICATE\nProduct: Samsung Galaxy S24\nModel Number: SM-S921B\nSerial Number: R5CT123ABC\nPurchase Date: ${new Date().toLocaleDateString()}\n\nWarranty Period: 2 years\nWarranty Expires: ${new Date(Date.now() + 730*24*60*60*1000).toLocaleDateString()}\n\nThis product is covered against manufacturing defects.`,
      `PRODUCT WARRANTY\nAppliance: Dishwasher DW500\nModel: DW500-SS\nSerial: XYZ789012\n\nWarranty: 1 year parts and labor\nExpiration Date: ${new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString()}\n\nRegister at manufacturer.com for extended coverage.`,
    ],
    id_card: [
      `DRIVER'S LICENSE\nState of California\n\nName: John A. Smith\nDOB: 01/15/1985\nAddress: 123 Oak Street\nCity: Los Angeles, CA 90001\n\nLicense #: D1234567\nClass: C\nExpires: ${new Date(Date.now() + 1825*24*60*60*1000).toLocaleDateString()}`,
      `IDENTIFICATION CARD\n\nName: Jane Doe\nID Number: 987654321\nDate of Birth: March 10, 1990\nIssue Date: ${new Date().toLocaleDateString()}\nExpiry Date: ${new Date(Date.now() + 3650*24*60*60*1000).toLocaleDateString()}`,
    ],
    bank_statement: [
      `BANK STATEMENT\nFirst National Bank\nAccount: ****4567\nStatement Period: Nov 1-30, 2024\n\nOpening Balance: $5,234.56\nDeposits: $3,500.00\nWithdrawals: $2,150.00\nClosing Balance: $6,584.56\n\nRecent Transactions:\n11/05 - Payroll Deposit: $3,500.00\n11/10 - Rent Payment: -$1,500.00\n11/15 - Grocery Store: -$125.50`,
    ],
    certificate: [
      `CERTIFICATE OF COMPLETION\n\nThis certifies that\nJohn Smith\n\nhas successfully completed the course\n"Advanced Web Development"\n\nDate: ${new Date().toLocaleDateString()}\nCertificate ID: CERT-2024-12345\n\nInstructor: Dr. Jane Wilson`,
    ],
    contract: [
      `SERVICE AGREEMENT\nContract #: SA-2024-001\nEffective Date: ${new Date().toLocaleDateString()}\n\nParties:\n- Provider: ABC Services LLC\n- Client: John Smith\n\nTerm: 12 months\nRenewal Date: ${new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString()}\n\nMonthly Fee: $299.00\nPayment Due: 1st of each month`,
    ],
    note: [
      `MEETING NOTES\nDate: ${new Date().toLocaleDateString()}\nProject: Q4 Planning\n\nAttendees: John, Sarah, Mike\n\nDiscussion Points:\n- Review Q3 performance\n- Set Q4 goals\n- Assign responsibilities\n\nAction Items:\n- John: Prepare budget proposal by ${new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString()}\n- Sarah: Complete market analysis\n- Mike: Schedule follow-up meeting`,
    ],
  };

  const typeTemplates = templates[type] || templates.note;
  return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
}
