"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
//import { loadEnv } from '../../../../config/env';
const env = (0, env_1.loadEnv)();
const app = (0, app_1.createApp)();
app.listen(env.PORT, () => {
    console.log(`[OK] API escuchando en puerto ${env.PORT}`);
});
