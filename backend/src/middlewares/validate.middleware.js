/**
 * Validate incoming request schema using Zod
 * @param {object} schemas Object containing body, query, or params Zod schemas
 */
const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    return next();
  } catch (err) {
    if (err.name === 'ZodError') {
      const errors = err.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return res.status(400).json({
        success: false,
        message: 'Request validation failed.',
        data: { errors },
      });
    }
    return next(err);
  }
};

module.exports = { validate };
