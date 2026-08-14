require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');

const app = express();

app.use(express.json());

// Conectar a MongoDB
connectDB();

app.get('/', (req, res) => {
    res.json({
        msj: 'API funcionando correctamente'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});