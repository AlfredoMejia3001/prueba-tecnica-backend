#!/bin/bash

echo "🔗 Conectando a MongoDB Atlas..."
echo "📊 Base de datos: currency_conversion"
echo "👤 Usuario: prueba-backend"
echo ""

# Comando para conectarse a MongoDB Atlas
mongosh "mongodb+srv://prueba-backend:SoymainMorde1@cluster0.8ovvw6n.mongodb.net/currency_conversion?retryWrites=true&w=majority&appName=Cluster0" 