require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const rateLimit = require("express-rate-limit");

const whitelist = process.env.WHITELIST.split(",");

// Middleware
const validateOrigin = (req, res, next) => {
  const allowedDomains = [
      "https://vps-4768993-x.dattaweb.com",
      "http://localhost:3000",
      "http://127.0.0.1:5000"
    ]; // Reemplaza con tu dominio
  
  
    const requestOrigin = req.headers.origin || req.headers.referer;

  if (!requestOrigin || !allowedDomains.includes(requestOrigin)) {
    return res.status(403).json({ error: "Acceso no autorizado" });
  }

  next(); // Si el dominio es válido, continúa con la siguiente función
};



const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Límite de 100 solicitudes por IP
});

app.use(limiter);

app.use(express.json({ limit: "10kb" }));



app.use(cors(
  {
    origin: ["https://vps-4768993-x.dattaweb.com",
              "http://localhost:3000"], // Reemplaza con tu dominio
    methods: ["POST", "GET"], // Métodos permitidos
  }
)); // Permite solicitudes desde el frontend

// Middleware para registrar cada petición y respuesta
app.use((req, res, next) => {
  const startTime = new Date();
  
  res.on("finish", () => {
    const logEntry = `${startTime.toISOString()} | ${req.method} ${req.url} | Status: ${res.statusCode} | Body: ${JSON.stringify(req.body)}\n`;

    fs.appendFile(path.join(__dirname, "logs.txt"), logEntry, (err) => {
      if (err) console.error("Error escribiendo en logs.txt:", err);
    });
  });

  next();
});

// Ruta para enviar correos
app.post("/api/send-email",validateOrigin ,async (req, res) => {
  const { toClient, email, motivo, mensaje } = req.body;

 
  if (!email || !motivo || !mensaje || !toClient) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  if (!whitelist.includes(toClient.toLowerCase())) {
    return res.status(400).json({ error: "No autorizado." });
  }

  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: toClient,
      subject: motivo,
      text: `Mensaje de: ${email}\n\n${mensaje}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Correo enviado con éxito" });
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    res.status(500).json({ error: "Error al enviar el correo" });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
