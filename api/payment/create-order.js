const https = require('https');

const TRUSTED_PRODUCTS = {
  "sambar-powder": { name: "Sambar Powder", variants: { "100g": 52, "200g": 98, "500g": 235, "1kg": 450 } },
  "rasam-powder": { name: "Rasam Powder", variants: { "100g": 54, "200g": 102, "500g": 245, "1kg": 470 } },
  "garam-masala": { name: "Garam Masala", variants: { "50g": 48, "100g": 90, "200g": 175, "500g": 420 } },
  "turmeric-powder": { name: "Turmeric Powder", variants: { "100g": 38, "200g": 72, "500g": 170, "1kg": 320 } },
  "red-chilli-powder": { name: "Red Chilli Powder", variants: { "100g": 58, "200g": 110, "500g": 265, "1kg": 510 } },
  "coriander-powder": { name: "Coriander Powder", variants: { "100g": 42, "200g": 80, "500g": 190, "1kg": 360 } },
  "cumin-powder": { name: "Cumin Powder", variants: { "50g": 45, "100g": 85, "200g": 165, "500g": 395 } },
  "pepper-powder": { name: "Pepper Powder", variants: { "50g": 60, "100g": 115, "200g": 220, "500g": 520 } }
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder';
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder';

  const body = req.body || {};
  const items = body.items || [];

  if (!items.length) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  let serverSubtotal = 0;
  const validatedItems = [];

  items.forEach(item => {
    const prodKey = item.slug || (item.id ? item.id.replace('hipa-', '') : '');
    const prod = TRUSTED_PRODUCTS[prodKey];
    const unitPrice = (prod && prod.variants && prod.variants[item.size]) ? prod.variants[item.size] : Number(item.price || 0);
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const lineTotal = unitPrice * qty;

    serverSubtotal += lineTotal;
    validatedItems.push({
      slug: prodKey,
      name: prod ? prod.name : item.name,
      size: item.size,
      unitPrice,
      quantity: qty,
      lineTotal,
      image: item.image || ''
    });
  });

  if (serverSubtotal < 999) {
    return res.status(400).json({
      error: `Online orders require a minimum order value of ₹999. Current subtotal is ₹${serverSubtotal}.`
    });
  }

  const shipping = 0;
  const finalAmount = serverSubtotal + shipping;
  const amountInPaise = Math.round(finalAmount * 100);

  const isRealRazorpay = RAZORPAY_KEY_ID.startsWith('rzp_') && RAZORPAY_KEY_SECRET !== 'rzp_secret_placeholder';

  if (isRealRazorpay) {
    try {
      const postData = JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: 'rcpt_' + Date.now().toString().slice(-8),
        notes: {
          customer_name: body.customer?.name || 'Customer',
          customer_phone: body.customer?.phone || '',
          items_count: validatedItems.length
        }
      });

      const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

      return new Promise((resolve) => {
        const rzpReq = https.request('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        }, (rzpRes) => {
          let rzpBody = '';
          rzpRes.on('data', chunk => rzpBody += chunk);
          rzpRes.on('end', () => {
            try {
              const rzpOrder = JSON.parse(rzpBody);
              if (rzpRes.statusCode >= 200 && rzpRes.statusCode < 300) {
                res.status(200).json({
                  success: true,
                  orderId: rzpOrder.id,
                  amount: rzpOrder.amount,
                  currency: rzpOrder.currency,
                  keyId: RAZORPAY_KEY_ID,
                  subtotal: serverSubtotal,
                  shipping,
                  total: finalAmount,
                  items: validatedItems
                });
              } else {
                throw new Error(rzpOrder.error?.description || 'Razorpay order failed');
              }
            } catch (err) {
              const mockOrderId = 'order_test_' + Date.now().toString().slice(-10);
              res.status(200).json({
                success: true,
                orderId: mockOrderId,
                amount: amountInPaise,
                currency: 'INR',
                keyId: RAZORPAY_KEY_ID,
                subtotal: serverSubtotal,
                shipping,
                total: finalAmount,
                items: validatedItems,
                mode: 'test_sandbox'
              });
            }
            resolve();
          });
        });

        rzpReq.on('error', () => {
          const mockOrderId = 'order_test_' + Date.now().toString().slice(-10);
          res.status(200).json({
            success: true,
            orderId: mockOrderId,
            amount: amountInPaise,
            currency: 'INR',
            keyId: RAZORPAY_KEY_ID,
            subtotal: serverSubtotal,
            shipping,
            total: finalAmount,
            items: validatedItems,
            mode: 'test_sandbox'
          });
          resolve();
        });

        rzpReq.write(postData);
        rzpReq.end();
      });
    } catch (e) {
      console.error(e);
    }
  }

  const mockOrderId = 'order_test_' + Date.now().toString().slice(-10);
  return res.status(200).json({
    success: true,
    orderId: mockOrderId,
    amount: amountInPaise,
    currency: 'INR',
    keyId: RAZORPAY_KEY_ID,
    subtotal: serverSubtotal,
    shipping,
    total: finalAmount,
    items: validatedItems,
    mode: 'test_sandbox'
  });
};
