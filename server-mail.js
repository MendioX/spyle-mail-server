require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // Permite solicitudes desde el frontend

// Ruta para enviar correos
app.post("/api/send-email", async (req, res) => {
  const { toClient,email, motivo, mensaje } = req.body;

  if (!email || !motivo || !mensaje || !toClient) {
    return res.status(400).json({ error: "Todos los campos son obligatorios"});
  }

  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Tu correo
        pass: process.env.EMAIL_PASS, // Tu contraseña o App Password
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

// Iniciar servidor sa
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
