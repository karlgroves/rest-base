/**
 * Secure Defaults Configuration Type Definitions
 */

export interface HelmetConfig {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: string[];
      styleSrc: string[];
      scriptSrc: string[];
      objectSrc: string[];
      upgradeInsecureRequests: string[];
    };
  };
  hsts: {
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
}

export interface CorsConfig {
  origin: boolean | string | string[];
  credentials: boolean;
  optionsSuccessStatus: number;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

export interface SessionConfig {
  secret: string | null;
  resave: boolean;
  saveUninitialized: boolean;
  cookie: {
    secure: boolean;
    httpOnly: boolean;
    maxAge: number;
    sameSite: "strict" | "lax" | "none";
  };
}

export interface BodyParserConfig {
  json: { limit: string };
  urlencoded: { limit: string; extended: boolean };
}

export interface ExpressDefaults {
  helmet: HelmetConfig;
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
  session: SessionConfig;
  bodyParser: BodyParserConfig;
}

export interface MySQLConfig {
  host: string;
  port: number;
  ssl: {
    rejectUnauthorized: boolean;
  };
  connectionLimit: number;
  acquireTimeout: number;
  timeout: number;
  reconnect: boolean;
  charset: string;
}

export interface SequelizeConfig {
  dialect: string;
  dialectOptions: {
    ssl: {
      require: boolean;
      rejectUnauthorized: boolean;
    };
  };
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
  logging: boolean;
  define: {
    timestamps: boolean;
    paranoid: boolean;
    underscored: boolean;
    freezeTableName: boolean;
  };
}

export interface DatabaseDefaults {
  mysql: MySQLConfig;
  sequelize: SequelizeConfig;
}

export interface WinstonConfig {
  level: string;
  format: string;
  defaultMeta: { service: string };
  transports: Array<{
    type: string;
    handleExceptions?: boolean;
    json?: boolean;
    colorize?: boolean;
    filename?: string;
    level?: string;
    maxsize?: number;
    maxFiles?: number;
  }>;
}

export interface LoggingDefaults {
  winston: WinstonConfig;
}

export interface JWTConfig {
  algorithm: string;
  expiresIn: string;
  issuer: string;
  audience: string;
}

export interface BcryptConfig {
  rounds: number;
}

export interface PasswordConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxLength: number;
}

export interface AuthDefaults {
  jwt: JWTConfig;
  bcrypt: BcryptConfig;
  password: PasswordConfig;
}

export interface UploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  destination: string;
  limits: {
    fileSize: number;
    files: number;
  };
}

export interface PathsConfig {
  allowedDirectories: string[];
  forbiddenDirectories: string[];
}

export interface FileDefaults {
  upload: UploadConfig;
  paths: PathsConfig;
}

export interface ResponseConfig {
  removeStackTrace: boolean;
  maxResponseSize: number;
  defaultHeaders: Record<string, string>;
}

export interface ValidationConfig {
  stripUnknown: boolean;
  abortEarly: boolean;
  allowUnknown: boolean;
}

export interface APIDefaults {
  response: ResponseConfig;
  validation: ValidationConfig;
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  defaults: any;
}

/**
 * Get secure defaults for a specific component
 */
export function getSecureDefaults(
  component: "express" | "database" | "logging" | "auth" | "file" | "api",
  environment?: "development" | "test" | "production",
): any;

/**
 * Validate configuration against secure defaults
 */
export function validateConfiguration(
  config: any,
  component: "express" | "database" | "logging" | "auth" | "file" | "api",
): ValidationResult;

export const expressDefaults: ExpressDefaults;
export const databaseDefaults: DatabaseDefaults;
export const loggingDefaults: LoggingDefaults;
export const authDefaults: AuthDefaults;
export const fileDefaults: FileDefaults;
export const apiDefaults: APIDefaults;
export const environmentDefaults: Record<string, any>;
