import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth.routes';
import usuariosRoutes from './routes/usuarios.routes';
import beneficiariosRoutes from './routes/beneficiarios.routes';
import casosRoutes from './routes/casos.routes';
import intervencionesRoutes from './routes/intervenciones.routes';
import documentosRoutes from './routes/documentos.routes';
import etiquetasRoutes from './routes/etiquetas.routes';
import dashboardRoutes from './routes/dashboard.routes';
import notificacionesRoutes from './routes/notificaciones.routes';
import tiposCasoRoutes from './routes/tipos-caso.routes';
import estadisticasRoutes from './routes/estadisticas.routes';

import { startCronJobs } from './lib/cron';

import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: (origin, callback) => {
    // Permite cualquier origen dinámicamente reflejándolo (soluciona problemas de trailing slashes)
    callback(null, origin || true);
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
// Servir archivos estáticos subidos desde la raíz de ejecución
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/beneficiarios', beneficiariosRoutes);
app.use('/api/casos', casosRoutes);
app.use('/api/intervenciones', intervencionesRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/etiquetas', etiquetasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/tipos-caso', tiposCasoRoutes);
app.use('/api/estadisticas', estadisticasRoutes);

app.get('/', (req, res) => {
  res.send('Gestor de Casos Sociales API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startCronJobs();
});
// Trigger restart para cargar tipos-caso y notificaciones
