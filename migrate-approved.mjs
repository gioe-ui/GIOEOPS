import { migrate } from "drizzle-orm/mysql2/migrator";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const poolConnection = await mysql.createPool({
  uri: process.env.DATABASE_URL,
});

const db = drizzle(poolConnection);

try {
  console.log("Iniciando migração...");
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Migração concluída com sucesso!");
} catch (error) {
  console.error("Erro na migração:", error.message);
}

await poolConnection.end();
