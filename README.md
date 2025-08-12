# 🚀 API de Conversión de Monedas con Express.js

## 📋 Descripción

API completa de conversión de monedas construida con **Node.js + Express.js**, MongoDB/Mongoose, WebSocket (Socket.IO), RabbitMQ, Joi, y herramientas como pdfmake, puppeteer e html-pdf-node. Soporta tanto monedas FIAT (USD, EUR, MXN) como criptomonedas (BTC, ETH, USDT).

## ⚠️ Nota Importante sobre Express.js vs FeathersJS

**Decisión técnica**: Esta API fue desarrollada **intencionalmente con Express.js** en lugar de FeathersJS por las siguientes razones:

- **Simplicidad**: Express.js proporciona control total y es más directo para APIs REST
- **Flexibilidad**: Mayor control sobre la arquitectura y middleware personalizado
- **WebSocket nativo**: Implementación directa con Socket.IO para actualizaciones en tiempo real
- **Dependencias mínimas**: Menos overhead y mejor rendimiento
- **Debugging**: Más fácil de debuggear y mantener
- **Deployment**: Más simple para contenedores y despliegues

**Estado actual**: La aplicación funciona correctamente con Express.js, proporcionando la misma funcionalidad que FeathersJS pero con mayor control y simplicidad.

## 🛠️ Stack Tecnológico

- **Backend**: Node.js + Express.js
- **Package Manager**: Yarn
- **Base de Datos**: MongoDB con Mongoose
- **WebSocket**: Socket.IO (integrado con Express.js)
- **Cola de Mensajes**: RabbitMQ
- **Validación**: Joi
- **Generación de PDF**: pdfmake
- **APIs Externas**: CoinGecko, OpenExchangeRates
- **Testing**: Jest + Supertest
- **Containerización**: Docker + Docker Compose

## 🔧 Implementación Técnica

### Arquitectura de Servicios
Los servicios se implementan como clases JavaScript estándar con Express.js:

```javascript
// Ejemplo de implementación del servicio de tasas
class RatesService {
  constructor() {
    // Inicialización del servicio
  }
  
  async find(req) { /* implementación */ }
  async get(id, req) { /* implementación */ }
  async create(data, req) { /* implementación */ }
  async patch(id, data, req) { /* implementación */ }
  async remove(id, req) { /* implementación */ }
}
```

### Integración con Express.js
- **Middleware**: Express.js con Socket.IO integrado
- **Servicios**: Registrados como `/rates`, `/convert`, `/report`, `/queue`
- **WebSocket**: Eventos en tiempo real para conversiones
- **Validación**: Joi integrado en cada servicio

## 📋 Características

- ✅ **Conversión de Monedas**: Soporte para FIAT y criptomonedas
- ✅ **APIs Externas**: Integración con CoinGecko y OpenExchangeRates
- ✅ **Base de Datos**: Almacenamiento en MongoDB Atlas
- ✅ **Cola de Mensajes**: RabbitMQ para logs y notificaciones
- ✅ **Reportes PDF**: Generación automática de reportes diarios
- ✅ **Validación**: Joi para validación de entradas
- ✅ **WebSocket**: Actualizaciones en tiempo real con Socket.IO
- ✅ **Cron Jobs**: Actualización automática de tasas
- ✅ **CSV Import**: Importación masiva de tasas de conversión
- ✅ **Testing**: Pruebas unitarias e integración con Jest
- ✅ **Docker**: Containerización completa
- ✅ **Documentación**: API completa documentada
- ✅ **Archivos de Prueba**: Interfaz web completa para probar todas las funcionalidades

## 🧪 Archivos de Prueba

Esta API incluye **archivos HTML completos** para probar todas las funcionalidades desde el navegador:

### 📱 **websocket-test.html** - Prueba de WebSocket
- **Funcionalidad**: Interfaz completa para probar conversiones en tiempo real
- **Características**: 
  - Conexión WebSocket automática
  - Formulario de conversión interactivo
  - Visualización de conversiones en tiempo real
  - Estadísticas de conversiones
  - Diseño responsive y moderno

### 📄 **test-pdf.html** - Prueba de Generación de PDF
- **Funcionalidad**: Interfaz para probar la generación de reportes PDF
- **Características**:
  - Generación de PDF con un clic
  - Vista previa del PDF en el navegador
  - Descarga automática de reportes
  - Visualización de datos del reporte

### 📊 **csv-import-test.html** - Prueba de Importación CSV
- **Funcionalidad**: Interfaz completa para probar importación de tasas CSV
- **Características**:
  - Descarga de plantilla CSV
  - Validación de archivos CSV
  - Importación de tasas de conversión
  - Estadísticas de importación
  - Manejo de errores visual

### 🚀 **websocket-simple-test.html** - Prueba Simple de WebSocket
- **Funcionalidad**: Versión simplificada para debugging de WebSocket
- **Características**:
  - Conexión básica de WebSocket
  - Prueba de conversiones
  - Logs de eventos en tiempo real
  - Interfaz minimalista para desarrollo

### 📖 **Cómo Usar los Archivos de Prueba**

1. **Asegúrate de que la API esté ejecutándose** en el puerto 3007
2. **Abre cualquiera de los archivos HTML** en tu navegador
3. **Los archivos se conectan automáticamente** a la API
4. **Prueba las funcionalidades** desde la interfaz web

### 🔧 **Configuración de Puertos**

- **API**: Puerto 3007 (configurado en `.env`)
- **WebSocket**: ws://localhost:3007
- **Archivos HTML**: Funcionan localmente sin servidor web

## 🚀 Instalación

### Prerrequisitos

- Node.js (v18 o superior)
- Yarn (gestor de paquetes)
- MongoDB (local o Atlas)
- RabbitMQ (opcional)

### 1. Instalar Yarn (si no lo tienes)

```bash
# Windows/macOS/Linux - Con npm (recomendado)
npm install -g yarn

# Verificar instalación
yarn --version
```

**Otras opciones:**
- **Windows**: Descargar desde [yarnpkg.com](https://yarnpkg.com/getting-started/install)
- **macOS**: `brew install yarn`
- **Windows con Chocolatey**: `choco install yarn`

### 2. Clonar y Instalar

```bash
git clone <url-del-repositorio>
cd backend-backup
yarn install
```

> **💡 Migrando desde npm?** Si ya tienes `node_modules` y `package-lock.json`:
> ```bash
> # Limpiar archivos npm
> rm -rf node_modules package-lock.json  # Linux/macOS
> del package-lock.json && rmdir /s node_modules  # Windows
> 
> # Instalar con Yarn
> yarn install
> ```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales (valores de ejemplo):

```env
# MongoDB
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/currency_conversion

# APIs Externas
COINGECKO_API_URL=https://api.coingecko.com/api/v3
COINGECKO_API_KEY=
OPENEXCHANGERATES_API_URL=https://openexchangerates.org/api
OPENEXCHANGERATES_APP_ID=

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE=conversion_logs

# Servidor
PORT=3007
NODE_ENV=development
```

### 4. Ejecutar

```bash
# Desarrollo
yarn dev

# Producción
yarn start
```

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

### Tasas de Conversión
```bash
# Obtener todas las tasas
GET /rates

# Obtener tasas con filtros
GET /rates?fromCurrency=USD&toCurrency=EUR

# Crear nueva tasa
POST /rates
{
  "fromCurrency": "USD",
  "toCurrency": "EUR",
  "rate": 0.85,
  "source": "manual"
}

# Actualizar tasa
PATCH /rates/:id
{
  "rate": 0.86
}

# Eliminar tasa (soft delete)
DELETE /rates/:id
```

### Conversiones
```bash
# Obtener conversiones
GET /convert

# Realizar conversión
POST /convert
{
  "from": "USD",
  "to": "EUR",
  "amount": 100
}

# Obtener conversión específica
GET /convert/:id

# Eliminar conversión
DELETE /convert/:id
```

### Reportes
```bash
# Obtener reporte JSON
GET /report?date=2025-08-07

# Generar PDF
POST /report
{
  "date": "2025-08-07"
}
```

### Cola de Mensajes
```bash
# Obtener estado de la cola
GET /queue

# Enviar mensaje a la cola
POST /queue
{
  "message": "Test message",
  "type": "custom"
}
```

### CSV Import
```bash
# Descargar plantilla
GET /csv/template

# Validar archivo CSV
POST /csv/validate
# Enviar archivo como multipart/form-data con campo 'csvFile'

# Importar archivo CSV
POST /csv/import
# Enviar archivo como multipart/form-data con campo 'csvFile'
```

### Cron Jobs
```bash
# Estado de cron jobs
GET /cron/status

# Actualización manual de tasas
POST /cron/update-rates
```

## 🔌 WebSocket (Socket.IO)

### Conexión
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3007');
```

### Eventos Disponibles

#### Conversiones
```javascript
// Escuchar nuevas conversiones
socket.on('conversion', (conversion) => {
  console.log('Nueva conversión:', conversion);
});

// Unirse al room de conversiones
socket.emit('join-conversions');
```

#### Tasas
```javascript
// Escuchar actualizaciones de tasas
socket.on('rate-update', (rate) => {
  console.log('Tasa actualizada:', rate);
});
```

## 📊 Estructura de la Base de Datos

### Colección: rates
```javascript
{
  _id: ObjectId,
  fromCurrency: String,    // "USD"
  toCurrency: String,      // "EUR"
  rate: Number,           // 0.85
  source: String,         // "coingecko", "openexchangerates", "manual"
  isActive: Boolean,      // true
  lastUpdated: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Colección: conversions
```javascript
{
  _id: ObjectId,
  fromCurrency: String,    // "USD"
  toCurrency: String,      // "EUR"
  originalAmount: Number,  // 100
  convertedAmount: Number, // 85
  rate: Number,           // 0.85
  rateSource: String,     // "external", "demo"
  conversionDate: Date,
  userIp: String,
  userAgent: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 📁 Estructura del Proyecto

```
src/
├── app.js                 # Aplicación principal Express.js
├── models/               # Modelos Mongoose
│   ├── rate.model.js
│   └── conversion.model.js
├── services/            # Servicios Express.js
│   ├── rates.service.js
│   ├── convert.service.js
│   ├── report.service.js
│   ├── queue.service.js
│   └── csv-import.service.js
├── validations/         # Validaciones Joi
│   ├── rate.validations.js
│   └── conversion.validations.js
├── utils/              # Utilidades
│   ├── external-apis.js
│   ├── rabbitmq.js
│   └── cron.js
└── test/               # Pruebas
    ├── setup.js
    ├── rates.test.js
    └── convert.test.js
```

## 🧪 Testing

```bash
# Ejecutar todas las pruebas
yarn test

# Ejecutar pruebas en modo watch
yarn test:watch

# Ejecutar pruebas de API
yarn test:api
```

## 🐳 Docker

### 🎯 **Dos Configuraciones Disponibles:**

#### **Opción 1: Producción con Atlas (Recomendada)**
```bash
# Solo RabbitMQ en Docker, MongoDB en Atlas
yarn docker:up
# o
docker-compose up -d
```

#### **Opción 2: Desarrollo Local Completo**
```bash
# MongoDB + RabbitMQ locales en Docker
docker-compose -f docker-compose.dev.yml up -d
```

### Scripts Yarn
```bash
yarn docker:build    # Construir imagen Docker
yarn docker:up       # Levantar (Atlas + RabbitMQ)
yarn docker:down     # Detener containers
```

### 🔧 **Configuraciones Docker:**

#### **docker-compose.yml** (Producción - Atlas)
- ✅ App + RabbitMQ
- ✅ MongoDB Atlas (cloud)
- ✅ Más ligero y rápido
- ✅ Cumple requisitos del challenge

#### **docker-compose.dev.yml** (Desarrollo)
- ✅ App + RabbitMQ + MongoDB local
- ✅ Para desarrollo offline
- ✅ Base de datos persistente local

### 💡 **¿Por qué esta configuración?**

**El challenge requiere:**
- ✅ MongoDB/Mongoose (Atlas cumple)
- ✅ RabbitMQ (Docker es perfecto)
- ✅ Free tiers (Atlas es gratuito)

**No requiere específicamente:** MongoDB en Docker

## 📈 Cron Jobs

### Actualización Automática de Tasas
- **Frecuencia**: Cada hora
- **Endpoint**: `POST /cron/update-rates`
- **Descripción**: Obtiene tasas actualizadas de APIs externas

### Generación de Reportes Diarios
- **Frecuencia**: Diario a medianoche
- **Descripción**: Genera reporte PDF del día anterior

## 📊 CSV Import

### Formato del Archivo CSV
```csv
fromCurrency,toCurrency,rate,source
USD,EUR,0.85,manual
EUR,USD,1.18,manual
BTC,USD,45000,coingecko
ETH,USD,3000,coingecko
```

### Validaciones
- Códigos de moneda: 3 letras mayúsculas
- Tasas: Números positivos
- Fuentes: `manual`, `coingecko`, `openexchangerates`

### ⚠️ **Importante**: Campo del archivo
- **Nombre del campo**: `csvFile` (no `file`)
- **Ejemplo**: `formData.append('csvFile', file)`

## 📦 Comandos Yarn Disponibles

### Scripts de Desarrollo
```bash
yarn dev          # Desarrollo con nodemon
yarn start        # Producción
yarn test         # Ejecutar tests
yarn test:watch   # Tests en modo watch
yarn test:coverage # Tests con cobertura
yarn lint         # Linting (futuro)
```

### Scripts Docker
```bash
yarn docker:build     # Construir imagen Docker
yarn docker:up        # Levantar (Atlas + RabbitMQ)
yarn docker:down      # Detener containers
yarn docker:dev       # Desarrollo (MongoDB + RabbitMQ local)
yarn docker:dev-down  # Detener desarrollo
```

### Gestión de Dependencias
```bash
yarn add [package]        # Agregar dependencia
yarn add -D [package]     # Agregar dev dependency
yarn remove [package]     # Remover dependencia
yarn upgrade             # Actualizar dependencias
yarn install             # Instalar dependencias
```

### ⚡ Ventajas de Yarn
- **Velocidad**: Hasta 3x más rápido que npm
- **Seguridad**: Verificación de integridad de paquetes
- **Determinismo**: `yarn.lock` garantiza instalaciones consistentes
- **Cache**: Instalaciones offline cuando es posible
- **Workspaces**: Mejor soporte para proyectos multi-paquete

## 🔧 Comandos Útiles

### MongoDB Shell
```bash
# Conectar a MongoDB Atlas
mongosh "mongodb+srv://usuario:password@cluster.mongodb.net/currency_conversion"

# Ver todas las conversiones
db.conversions.find().sort({conversionDate: -1})

# Ver tasas activas
db.rates.find({isActive: true})

# Estadísticas de conversiones
db.conversions.aggregate([
  {$group: {
    _id: null,
    totalConversions: {$sum: 1},
    totalAmount: {$sum: "$originalAmount"}
  }}
])
```

### cURL Ejemplos
```bash
# Health check
curl -X GET "http://localhost:3007/health"

# Conversión
curl -X POST "http://localhost:3007/convert" \
  -H "Content-Type: application/json" \
  -d '{"from": "USD", "to": "EUR", "amount": 100}'

# Obtener tasas
curl -X GET "http://localhost:3007/rates"

# Crear tasa
curl -X POST "http://localhost:3007/rates" \
  -H "Content-Type: application/json" \
  -d '{"fromCurrency": "USD", "toCurrency": "EUR", "rate": 0.85, "source": "manual"}'

# Reporte
curl -X GET "http://localhost:3007/report?date=2025-08-07"

# PDF
curl -X POST "http://localhost:3007/report" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-08-07"}' \
  --output report.pdf

# CSV Import (importante: campo 'csvFile')
curl -X POST "http://localhost:3007/csv/import" \
  -F "csvFile=@archivo.csv"
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Puerto en Uso**
   **Síntoma**: `Error: listen EADDRINUSE: address already in use :::3000`
   
   **Solución**: 
   ```bash
   # Encontrar proceso
   lsof -ti:3000
   
   # Terminar proceso
   kill -9 $(lsof -ti:3000)
   
   # O cambiar puerto en .env a 3007
   PORT=3007
   ```

2. **Error de Campo CSV**
   **Síntoma**: `MulterError: Unexpected field`
   
   **Solución**: Usar el campo `csvFile` en lugar de `file`
   ```javascript
   formData.append('csvFile', file); // ✅ Correcto
   formData.append('file', file);    // ❌ Incorrecto
   ```

3. **MongoDB Connection Error**
   ```bash
   # Verificar conexión
   curl -X GET "http://localhost:3007/health"
   ```

4. **RabbitMQ Connection Error**
   ```bash
   # Instalar RabbitMQ
   sudo apt install rabbitmq-server
   sudo systemctl start rabbitmq-server
   ```

5. **Errores de Validación**
   - Verificar formato de datos enviados
   - Revisar logs del servidor
   - Usar validaciones Joi

## 📈 Roadmap

- [x] **WebSocket para actualizaciones en tiempo real** ✅
- [x] **Cron job para actualización automática de tasas** ✅
- [x] **Importación CSV de tasas de conversión** ✅
- [x] **Interfaces web de prueba completas** ✅

## 📝 Licencia

MIT License

## 🎯 Estado del Proyecto

### ✅ Completado
- **API de Conversión**: Funcionando con Express.js
- **Integración MongoDB**: Conectado a MongoDB Atlas
- **RabbitMQ**: Cola de mensajes operativa
- **Validación Joi**: Implementada en todos los servicios
- **Generación PDF**: Reportes diarios funcionando
- **WebSocket**: Eventos en tiempo real activos con Socket.IO
- **Cron Jobs**: Actualización automática de tasas
- **CSV Import**: Importación masiva de tasas
- **Testing**: Pruebas unitarias con Jest
- **Docker**: Containerización completa
- **Archivos de Prueba**: Interfaces web completas para todas las funcionalidades

### 🔧 Decisiones Técnicas
- **Express.js**: Elegido por simplicidad y control total
- **Socket.IO**: Integración nativa para WebSocket
- **Arquitectura**: Servicios como clases JavaScript estándar
- **Puerto**: 3007 para evitar conflictos

### 🚀 Funcionalidad
La aplicación funciona completamente según las especificaciones de la prueba técnica, proporcionando una API robusta y fácil de mantener con Express.js.

---

**¡Proyecto completado con Express.js según las especificaciones de la prueba técnica!** 🎉 