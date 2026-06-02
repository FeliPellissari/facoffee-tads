import "dotenv/config";
import app from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`[server] Serviço Users rodando na porta ${env.port}`);
});
