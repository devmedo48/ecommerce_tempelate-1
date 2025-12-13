import { z } from "zod";

/**
 * Middleware to validate request data against Zod schemas.
 * Supports validating a single source (e.g., body) or multiple sources (e.g., body and query).
 *
 * @param {z.ZodSchema|Object} schemaOrMap - Zod schema or object mapping sources to schemas
 * @param {string} [defaultSource="body"] - Default source to validate if a single schema is provided
 * @returns {Function} Express middleware
 *
 * @example
 * // Validate body only (default)
 * validate(loginSchema)
 *
 * @example
 * // Validate query parameters
 * validate(searchSchema, "query")
 *
 * @example
 * // Validate multiple sources (Unified Validator)
 * validate({
 *   body: updateProfileSchema,
 *   params: userIdSchema,
 *   query: filterSchema
 * })
 */
export const validate = (schemaOrMap, defaultSource = "body") => {
  return (req, res, next) => {
    try {
      const validationMap = {};

      if (
        schemaOrMap instanceof z.ZodType ||
        schemaOrMap instanceof z.ZodSchema
      ) {
        // Old signature: validate(schema, source)
        validationMap[defaultSource] = schemaOrMap;
      } else {
        // New signature: validate({ body: schema, query: schema })
        Object.assign(validationMap, schemaOrMap);
      }

      req.validatedData = req.validatedData || {};

      for (const [source, schema] of Object.entries(validationMap)) {
        if (!schema) continue;

        // Ensure source exists on req (body, query, params)
        const dataToValidate = req[source];

        // Skip validation if source doesn't exist on req (though it usually does as empty obj)
        if (dataToValidate === undefined) continue;

        const validated = schema.parse(dataToValidate);

        // Store validated data namespaced by source to prevent collisions
        // e.g. req.validatedData.body, req.validatedData.params
        req.validatedData[source] = validated;

        // Also update the original request object with transformed data
        // This ensures subsequent middleware/controllers usage sees the validated/transformed values
        req[source] = validated;

        // Merge validated data into req.validatedData (Flat structure for backward compatibility)
        // Note: If multiple sources have same keys, last one wins. Use req.validatedData[source] for precision.
        Object.assign(req.validatedData, validated);
      }
      // Old signature: validate(schema, source)
      // EX: If validate(loginSchema, "body") and loginSchema validates { email: "user@example.com" },
      //     then req.validatedData would be { email: "user@example.com" }
      //     and req.validatedData.body would be { email: "user@example.com" }

      // New signature: validate({ body: schema, query: schema })
      // EX: If validate({ body: updateSchema, query: filterSchema })
      //     and updateSchema validates { name: "John Doe" }
      //     and filterSchema validates { page: 1, limit: 10 }
      //     then req.validatedData would be { name: "John Doe", page: 1, limit: 10 }
      //     and req.validatedData.body would be { name: "John Doe" }
      //     and req.validatedData.query would be { page: 1, limit: 10 }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};
