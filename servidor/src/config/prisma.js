import { PrismaClient } from '@prisma/client';

// Una sola instancia compartida en toda la app.
// Crear una nueva por cada archivo agota las conexiones a la base
// de datos rápido, sobre todo en el plan gratuito de Supabase.
export const prisma = new PrismaClient();
