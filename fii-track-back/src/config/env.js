import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Sobe dois níveis (src/config → src → raiz) para encontrar os arquivos .env
const rootDir = resolve(__dirname, '../../');

const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: resolve(rootDir, `.env.${env}`) });
