import axios from 'axios';
import { loadEnv } from '../../../config/env';

const env = loadEnv();

export const makeHttp = axios.create({
  timeout: env.MAKE_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});
