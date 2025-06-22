/**
 * Items API Tests
 *
 * Tests for the items CRUD operations
 * @author {{author}}
 */

const request = require('supertest');
const app = require('../src/app');

describe('Items API', () => {
  let createdItemId;

  describe('GET /api/items', () => {
    it('should return list of items', async () => {
      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('offset');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/items?limit=1&offset=0')
        .expect(200);

      expect(response.body.meta.limit).toBe(1);
      expect(response.body.meta.offset).toBe(0);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/items?search=sample')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/items?limit=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid query parameters');
      expect(response.body).toHaveProperty('details');
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const newItem = {
        name: 'Test Item',
        description: 'This is a test item'
      };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(newItem.name);
      expect(response.body.data.description).toBe(newItem.description);
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('message', 'Item created successfully');

      createdItemId = response.body.data.id;
    });

    it('should create item without description', async () => {
      const newItem = {
        name: 'Test Item Without Description'
      };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      expect(response.body.data.name).toBe(newItem.name);
      expect(response.body.data.description).toBeNull();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body).toHaveProperty('details');
    });

    it('should validate field lengths', async () => {
      const longName = 'a'.repeat(101);
      const response = await request(app)
        .post('/api/items')
        .send({ name: longName })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should trim whitespace from fields', async () => {
      const newItem = {
        name: '  Test Item with Spaces  ',
        description: '  Description with spaces  '
      };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      expect(response.body.data.name).toBe('Test Item with Spaces');
      expect(response.body.data.description).toBe('Description with spaces');
    });
  });

  describe('GET /api/items/:id', () => {
    it('should return item by ID', async () => {
      const response = await request(app)
        .get('/api/items/1')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', 1);
      expect(response.body.data).toHaveProperty('name');
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .get('/api/items/99999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Item not found');
      expect(response.body).toHaveProperty('message');
    });

    it('should validate ID parameter', async () => {
      const response = await request(app)
        .get('/api/items/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid ID parameter');
    });
  });

  describe('PUT /api/items/:id', () => {
    it('should update an existing item', async () => {
      const updatedItem = {
        name: 'Updated Test Item',
        description: 'Updated description'
      };

      const response = await request(app)
        .put('/api/items/1')
        .send(updatedItem)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.name).toBe(updatedItem.name);
      expect(response.body.data.description).toBe(updatedItem.description);
      expect(response.body.data).toHaveProperty('updatedAt');
      expect(response.body).toHaveProperty('message', 'Item updated successfully');
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .put('/api/items/99999')
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .put('/api/items/1')
        .send({ name: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should validate ID parameter for updates', async () => {
      const response = await request(app)
        .put('/api/items/invalid')
        .send({ name: 'Valid Name' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid ID parameter');
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete an item', async () => {
      if (!createdItemId) {
        // Create an item to delete if none was created
        const createResponse = await request(app)
          .post('/api/items')
          .send({ name: 'Item to Delete' });
        createdItemId = createResponse.body.data.id;
      }

      const response = await request(app)
        .delete(`/api/items/${createdItemId}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(createdItemId);
      expect(response.body).toHaveProperty('message', 'Item deleted successfully');

      // Verify item is actually deleted
      await request(app)
        .get(`/api/items/${createdItemId}`)
        .expect(404);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .delete('/api/items/99999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should validate ID parameter for deletion', async () => {
      const response = await request(app)
        .delete('/api/items/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid ID parameter');
    });
  });

  describe('Content-Type Validation', () => {
    it('should require JSON content-type for POST', async () => {
      const response = await request(app)
        .post('/api/items')
        .set('Content-Type', 'text/plain')
        .send('name=test')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should require JSON content-type for PUT', async () => {
      const response = await request(app)
        .put('/api/items/1')
        .set('Content-Type', 'text/plain')
        .send('name=test')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Boundary Testing', () => {
    it('should handle maximum valid name length', async () => {
      const maxName = 'a'.repeat(100);
      const response = await request(app)
        .post('/api/items')
        .send({ name: maxName })
        .expect(201);

      expect(response.body.data.name).toBe(maxName);
    });

    it('should handle maximum valid description length', async () => {
      const maxDescription = 'a'.repeat(500);
      const response = await request(app)
        .post('/api/items')
        .send({ 
          name: 'Test Item',
          description: maxDescription 
        })
        .expect(201);

      expect(response.body.data.description).toBe(maxDescription);
    });

    it('should handle minimum valid limit', async () => {
      const response = await request(app)
        .get('/api/items?limit=1')
        .expect(200);

      expect(response.body.meta.limit).toBe(1);
    });

    it('should handle maximum valid limit', async () => {
      const response = await request(app)
        .get('/api/items?limit=100')
        .expect(200);

      expect(response.body.meta.limit).toBe(100);
    });
  });
});