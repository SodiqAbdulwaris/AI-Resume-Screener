const { z } = require('zod')

const envSchema = z.object({
    MONGO_URI: z.string().url('MongoDB URI must be a valid URL'),
    JWT_SECRET: z.string().min(32, 'JWT must be 32 characters'),
    JWT_LAST_FOR: z.string().default('7d'),
    BACKEND_PORT: z.string().default(5000),
    AI_SERVICE_URL: z.string().url('AI Service URL must be a valid URL'),
    MAX_FILE_UPLOAD: z.string().default(5),
    NODE_ENV: z.enum(['production', 'development']).default('development')
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success){
    console.log('Invalid environmental variables')
    parsed.error.errors.forEach(err => {
        console.log(`${err.path[0]}: ${err.message}`)
    });
    process.exit(1)
}

module.exports = parsed.data

