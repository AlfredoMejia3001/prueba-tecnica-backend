const mongoose = require('mongoose');
require('dotenv').config();

async function testReport() {
  try {
    console.log('🔗 Conectando a MongoDB Atlas...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Conexión exitosa a MongoDB Atlas!');
    
    const Conversion = require('./src/models/conversion.model');
    
    // Test 1: Ver todas las conversiones
    console.log('\n📊 Todas las conversiones:');
    const allConversions = await Conversion.find();
    console.log(`Total: ${allConversions.length}`);
    
    // Test 2: Ver conversiones de hoy
    const today = new Date('2025-08-07');
    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    
    console.log('\n📅 Conversiones de hoy (2025-08-07):');
    console.log(`Start: ${startDate.toISOString()}`);
    console.log(`End: ${endDate.toISOString()}`);
    
    const todayConversions = await Conversion.find({
      conversionDate: {
        $gte: startDate,
        $lte: endDate
      }
    });
    console.log(`Encontradas: ${todayConversions.length}`);
    
    // Test 3: Ver fechas de conversiones
    console.log('\n📅 Fechas de conversiones:');
    allConversions.forEach((conv, index) => {
      console.log(`${index + 1}. ${conv.fromCurrency} -> ${conv.toCurrency}: ${conv.conversionDate}`);
    });
    
    // Test 4: Estadísticas
    console.log('\n📈 Estadísticas:');
    const stats = await Conversion.aggregate([
      {
        $group: {
          _id: null,
          totalConversions: { $sum: 1 },
          totalOriginalAmount: { $sum: '$originalAmount' },
          totalConvertedAmount: { $sum: '$convertedAmount' },
          averageRate: { $avg: '$rate' }
        }
      }
    ]);
    console.log(stats[0] || 'No hay estadísticas');
    
    await mongoose.disconnect();
    console.log('\n🔌 Conexión cerrada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testReport(); 