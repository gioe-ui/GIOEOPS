import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, protectedProcedure, router } from "./trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  runMigration: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Only allow admin to run migrations
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can run migrations" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }

      try {
        // Add audit columns if they don't exist
        // First add updatedBy column
        await db.execute(sql.raw(`
          ALTER TABLE evaluations 
          ADD COLUMN IF NOT EXISTS updatedBy TEXT AFTER parecer
        `));
        
        // Then add updatedAt column
        await db.execute(sql.raw(`
          ALTER TABLE evaluations 
          ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER updatedBy
        `));

        // Add observation columns
        await db.execute(sql.raw(`
          ALTER TABLE evaluations 
          ADD COLUMN IF NOT EXISTS observacoes TEXT AFTER parecer
        `));
        
        await db.execute(sql.raw(`
          ALTER TABLE evaluations 
          ADD COLUMN IF NOT EXISTS outrasObservacoes TEXT AFTER observacoes
        `));

        return { success: true, message: "Migration completed successfully" };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Migration error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Migration failed: ${errorMessage}` });
      }
    }),
});
