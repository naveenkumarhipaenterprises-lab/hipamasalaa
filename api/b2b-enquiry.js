module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const refCode = body.refCode || ('B2B-' + Math.floor(10000 + Math.random() * 90000));

  const enquiry = {
    refCode,
    fullName: body.fullName || '',
    companyName: body.companyName || '',
    phone: body.phone || '',
    email: body.email || '',
    city: body.city || '',
    businessType: body.businessType || '',
    products: body.products || [],
    bulkRequirement: body.bulkRequirement || '',
    message: body.message || '',
    created_at: new Date().toISOString()
  };

  return res.status(200).json({ success: true, refCode });
};
