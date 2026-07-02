/**
 * Test SMTP Connection
 * This will verify if the SMTP configuration is working
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSMTP() {
  console.log('\n🧪 Testing SMTP Connection...\n');
  
  // Show configuration (hide password)
  console.log('📋 Configuration:');
  console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || '❌ NOT SET'}`);
  console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '❌ NOT SET'}`);
  console.log(`   SMTP_USER: ${process.env.SMTP_USER || '❌ NOT SET'}`);
  console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '✅ SET (hidden)' : '❌ NOT SET'}`);
  console.log(`   SMTP_FROM: ${process.env.SMTP_FROM || '❌ NOT SET'}\n`);

  if (!process.env.SMTP_HOST) {
    console.error('❌ SMTP_HOST is not set! Emails will fail.\n');
    process.exit(1);
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    console.log('📡 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Send to yourself
      subject: 'Test Email from MedCore BD',
      html: `
        <h2>✅ SMTP Test Successful!</h2>
        <p>This is a test email from MedCore BD backend.</p>
        <p>If you received this, your SMTP configuration is working correctly.</p>
        <hr>
        <p><small>Sent at: ${new Date().toLocaleString()}</small></p>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}\n`);
    
    console.log('✨ SMTP is working correctly! Order confirmation emails should work now.\n');

  } catch (error) {
    console.error('\n❌ SMTP Test Failed!\n');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n💡 Authentication failed. Possible issues:');
      console.error('   1. Wrong SMTP_USER or SMTP_PASS');
      console.error('   2. Gmail app password expired or revoked');
      console.error('   3. Gmail "Less secure apps" blocked (use app passwords)');
      console.error('\n🔧 Solution: Generate new Gmail app password at:');
      console.error('   https://myaccount.google.com/apppasswords\n');
    } else if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
      console.error('\n💡 Connection failed. Possible issues:');
      console.error('   1. Wrong SMTP_HOST or SMTP_PORT');
      console.error('   2. Firewall blocking connection');
      console.error('   3. Network issues\n');
    }
    
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testSMTP();
