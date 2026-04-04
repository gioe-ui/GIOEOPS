import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function fixEmailVerified() {
  const db = await getDb();
  if (!db) {
    console.error("Database unavailable");
    process.exit(1);
  }

  const result = await db
    .update(users)
    .set({ emailVerified: 1 })
    .where(eq(users.emailVerified, 0));

  console.log("Atualizado com sucesso");
  process.exit(0);
}

fixEmailVerified().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
