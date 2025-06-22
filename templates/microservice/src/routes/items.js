/**
 * Items Routes
 *
 * RESTful routes for managing items in the microservice
 * @author {{author}}
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

// Mock data - replace with actual database operations
let items = [
  { id: 1, name: 'Sample Item 1', description: 'This is a sample item', createdAt: new Date().toISOString() },
  { id: 2, name: 'Sample Item 2', description: 'Another sample item', createdAt: new Date().toISOString() }
];
let nextId = 3;

// Validation middleware
const validateItem = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

const validateId = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Invalid ID parameter',
        details: errors.array()
      });
    }
    next();
  }
];

const validateQuery = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term too long'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: errors.array()
      });
    }
    next();
  }
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier
 *         name:
 *           type: string
 *           description: Item name
 *           minLength: 1
 *           maxLength: 100
 *         description:
 *           type: string
 *           description: Item description
 *           maxLength: 500
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /items:
 *   get:
 *     summary: List all items
 *     description: Retrieve a list of items with optional filtering and pagination
 *     tags: [Items]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of items to skip
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search term for filtering items
 *     responses:
 *       200:
 *         description: List of items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Item'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 */
router.get('/', validateQuery, (req, res) => {
  const { limit = 10, offset = 0, search } = req.query;
  
  let filteredItems = items;
  
  // Apply search filter
  if (search) {
    filteredItems = items.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
    );
  }
  
  // Apply pagination
  const paginatedItems = filteredItems.slice(
    parseInt(offset), 
    parseInt(offset) + parseInt(limit)
  );
  
  res.json({
    data: paginatedItems,
    meta: {
      total: filteredItems.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (parseInt(offset) + parseInt(limit)) < filteredItems.length
    }
  });
});

/**
 * @swagger
 * /items/{id}:
 *   get:
 *     summary: Get item by ID
 *     description: Retrieve a specific item by its ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Item'
 *       404:
 *         description: Item not found
 */
router.get('/:id', validateId, (req, res) => {
  const id = parseInt(req.params.id);
  const item = items.find(item => item.id === id);
  
  if (!item) {
    return res.status(404).json({
      error: 'Item not found',
      message: `No item found with ID ${id}`
    });
  }
  
  res.json({ data: item });
});

/**
 * @swagger
 * /items:
 *   post:
 *     summary: Create new item
 *     description: Create a new item
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Item'
 *       400:
 *         description: Validation error
 */
router.post('/', validateItem, (req, res) => {
  const { name, description } = req.body;
  
  const newItem = {
    id: nextId++,
    name: name.trim(),
    description: description?.trim() || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  items.push(newItem);
  
  res.status(201).json({
    data: newItem,
    message: 'Item created successfully'
  });
});

/**
 * @swagger
 * /items/{id}:
 *   put:
 *     summary: Update item
 *     description: Update an existing item
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       404:
 *         description: Item not found
 *       400:
 *         description: Validation error
 */
router.put('/:id', validateId, validateItem, (req, res) => {
  const id = parseInt(req.params.id);
  const itemIndex = items.findIndex(item => item.id === id);
  
  if (itemIndex === -1) {
    return res.status(404).json({
      error: 'Item not found',
      message: `No item found with ID ${id}`
    });
  }
  
  const { name, description } = req.body;
  
  items[itemIndex] = {
    ...items[itemIndex],
    name: name.trim(),
    description: description?.trim() || null,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    data: items[itemIndex],
    message: 'Item updated successfully'
  });
});

/**
 * @swagger
 * /items/{id}:
 *   delete:
 *     summary: Delete item
 *     description: Delete an item by ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *       404:
 *         description: Item not found
 */
router.delete('/:id', validateId, (req, res) => {
  const id = parseInt(req.params.id);
  const itemIndex = items.findIndex(item => item.id === id);
  
  if (itemIndex === -1) {
    return res.status(404).json({
      error: 'Item not found',
      message: `No item found with ID ${id}`
    });
  }
  
  const deletedItem = items.splice(itemIndex, 1)[0];
  
  res.json({
    data: deletedItem,
    message: 'Item deleted successfully'
  });
});

module.exports = router;