import express from "express";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { createApi } from "./api.mjs";
const dist = resolve("dist");
if (!existsSync(resolve(dist, "index.html")))
  throw new Error("Run npm run build before npm start.");
const app = express();
app.disable("x-powered-by");
app.use("/api", createApi());
app.use(express.static(dist));
app.get("/{*path}", (_req, res) => res.sendFile(resolve(dist, "index.html")));
app.listen(Number(process.env.PORT) || 3000, "0.0.0.0", () =>
  console.log("Colonist lobby is listening."),
);
