const mongoose = require('mongoose');
require('dotenv').config();

async function testMongoConnection() {
  try {
    console.log('🔗 Conectando a MongoDB Atlas...');
    console.log('URI:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Conexión exitosa a MongoDB Atlas!');
    
    // Test simple query
    const Conversion = require('./src/models/conversion.model');
    const count = await Conversion.countDocuments();
    console.log(`📊 Total de conversiones en la base de datos: ${count}`);
    
    // Test insert
    const testConversion = new Conversion({
      fromCurrency: 'TEST',
      toCurrency: 'TEST',
      originalAmount: 100,
      convertedAmount: 100,
      rate: 1,
      rateSource: 'demo'
    });
    
    await testConversion.save();
    console.log('✅ Inserción de prueba exitosa');
    
    // Test find
    const conversions = await Conversion.find().limit(5);
    console.log(`📋 Conversiones encontradas: ${conversions.length}`);
    
    // Clean up test data
    await Conversion.deleteOne({ fromCurrency: 'TEST' });
    console.log('🧹 Datos de prueba eliminados');
    
    await mongoose.disconnect();
    console.log('🔌 Conexión cerrada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testMongoConnection(); 