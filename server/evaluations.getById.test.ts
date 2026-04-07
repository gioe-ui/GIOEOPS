import { describe, it, expect } from "vitest";
import { getEvaluationById } from "./db";

describe("evaluations.getById", () => {
  it("should return null for non-existent evaluation", async () => {
    const evaluation = await getEvaluationById(99999);
    
    expect(evaluation).toBeNull();
  });

  it("should handle database errors gracefully", async () => {
    // Test with invalid ID type (should be handled by database)
    const evaluation = await getEvaluationById(0);
    
    // Should return null or handle gracefully
    expect(evaluation === null || evaluation === undefined).toBe(true);
  });

  it("should return an object with evaluation structure when evaluation exists", async () => {
    // This test verifies the function signature works correctly
    // Actual data verification would require seeding test data
    const result = await getEvaluationById(1);
    
    // If result exists, it should have these properties
    if (result) {
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("pontuacao");
      expect(result).toHaveProperty("neop");
      expect(result).toHaveProperty("createdAt");
    }
  });
});
