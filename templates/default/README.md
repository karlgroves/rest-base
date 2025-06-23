# {{projectName}}

{{description}}

## Overview

This project was generated using the REST-SPEC template, providing a robust foundation for building RESTful APIs with
Node.js, Express, and MySQL.

## Features

- **Express.js**: Fast, unopinionated, minimalist web framework
- **MySQL with Sequelize**: Robust database ORM with migrations and validations
- **Security**: Built-in security middleware (helmet, cors, rate limiting)
- **Authentication**: JWT-based authentication ready to implement
- **Logging**: Bunyan logger with file and console outputs
- **Error Handling**: Comprehensive error handling with custom error classes
- **Validation**: Input validation middleware
- **Testing**: Jest testing framework setup
- **Code Quality**: ESLint and Prettier configuration
- **API Documentation**: Swagger/OpenAPI documentation
- **Environment Configuration**: Multiple environment support

## Prerequisites

- Node.js >= 22.11.0
- MySQL 8.0+
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd {{projectName}}
```

1. Install dependencies:

```bash
npm install
```

1. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

1. Set up the database:

```bash
# Create databases
mysql -u root -p -e "CREATE DATABASE {{projectName}}_dev;"
mysql -u root -p -e "CREATE DATABASE {{projectName}}_test;"

# Run migrations
npm run db:migrate
```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Database Operations

```bash
# Run migrations
npm run db:migrate

# Rollback migration
npm run db:migrate:undo

# Create new migration
npm run db:migration:create -- --name migration-name

# Seed database
npm run db:seed

# Create new seeder
npm run db:seeder:create -- --name seeder-name
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Project Structure

```text
{{projectName}}/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── app.js           # Express application
├── tests/               # Test files
├── docs/                # Documentation
├── logs/                # Log files
├── .env.example         # Environment variables template
├── .gitignore           # Git ignore rules
├── .eslintrc.js         # ESLint configuration
├── .prettierrc          # Prettier configuration
├── jest.config.js       # Jest configuration
└── package.json         # Project dependencies
```

## API Documentation

Once the server is running, API documentation is available at:

- Development: <http://localhost:3000/api-docs>
- Production: <https://your-domain.com/api-docs>

## Environment Variables

See `.env.example` for all available configuration options.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact {{author}}.
