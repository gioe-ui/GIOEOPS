import mysql from "mysql2/promise";

const poolConnection = await mysql.createPool({
  uri: process.env.DATABASE_URL,
});

try {
  console.log("Executando migração 0007...");
  const connection = await poolConnection.getConnection();
  
  const sql = "ALTER TABLE `users` ADD COLUMN `approved` tinyint DEFAULT 0 NOT NULL;";
  
  try {
    await connection.execute(sql);
    console.log("Coluna 'approved' adicionada com sucesso!");
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Coluna 'approved' já existe na tabela!");
    } else {
      throw error;
    }
  }
  
  connection.release();
} catch (error) {
  console.error("Erro na migração:", error.message);
}

await poolConnection.end();
