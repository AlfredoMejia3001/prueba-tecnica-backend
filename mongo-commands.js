// Comandos útiles para explorar la base de datos MongoDB Atlas
// Ejecuta estos comandos dentro de mongosh

// 1. Ver todas las colecciones
show collections

// 2. Ver todas las conversiones
db.conversions.find().pretty()

// 3. Contar total de conversiones
db.conversions.countDocuments()

// 4. Ver conversiones ordenadas por fecha (más recientes primero)
db.conversions.find().sort({conversionDate: -1}).pretty()

// 5. Ver conversiones de hoy
db.conversions.find({
  conversionDate: {
    $gte: new Date("2025-08-07T00:00:00.000Z"),
    $lte: new Date("2025-08-07T23:59:59.999Z")
  }
}).pretty()

// 6. Ver conversiones por moneda origen
db.conversions.find({fromCurrency: "USD"}).pretty()

// 7. Ver conversiones por fuente de tasa
db.conversions.find({rateSource: "external"}).pretty()

// 8. Estadísticas de conversiones
db.conversions.aggregate([
  {
    $group: {
      _id: null,
      totalConversions: { $sum: 1 },
      totalOriginalAmount: { $sum: "$originalAmount" },
      totalConvertedAmount: { $sum: "$convertedAmount" },
      averageRate: { $avg: "$rate" }
    }
  }
])

// 9. Pares de monedas más populares
db.conversions.aggregate([
  {
    $group: {
      _id: { from: "$fromCurrency", to: "$toCurrency" },
      count: { $sum: 1 },
      totalAmount: { $sum: "$originalAmount" }
    }
  },
  { $sort: { count: -1 } }
])

// 10. Ver conversiones de criptomonedas
db.conversions.find({
  fromCurrency: { $in: ["BTC", "ETH", "USDT"] }
}).pretty()

// 11. Ver conversiones de monedas FIAT
db.conversions.find({
  fromCurrency: { $in: ["USD", "EUR", "MXN", "JPY"] }
}).pretty()

// 12. Eliminar una conversión específica (cuidado!)
// db.conversions.deleteOne({_id: ObjectId("ID_AQUI")})

// 13. Ver estructura de una conversión
db.conversions.findOne()

// 14. Ver conversiones con límite
db.conversions.find().limit(3).pretty()

// 15. Buscar conversiones por rango de fechas
db.conversions.find({
  conversionDate: {
    $gte: new Date("2025-08-07T17:00:00.000Z"),
    $lte: new Date("2025-08-07T18:00:00.000Z")
  }
}).pretty() 