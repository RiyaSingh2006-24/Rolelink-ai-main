const { ZodError } = require('zod');

const formatZodErrors = (error) =>
  error.errors.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message
  }));

const validateBody = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: formatZodErrors(error) });
    }
    return res.status(400).json({ message: 'Invalid request' });
  }
};

module.exports = { validateBody };
