import { createApp } from './app';
import { loadEnv } from './config/env';
//import { loadEnv } from '../../../../config/env';

const env = loadEnv();
const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[OK] API escuchando en puerto ${env.PORT}`);
});
