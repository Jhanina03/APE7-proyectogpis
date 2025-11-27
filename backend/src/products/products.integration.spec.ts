import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ImagesService } from '../images/images.service';
import { ProductsService } from './products.service';

describe('ProductsController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let clientToken: string;
  let moderatorToken: string;
  let clientId: string;

  const clientEmail = 'client@test.com';
  const moderatorEmail = 'moderator@test.com';
  const password = 'Password123!';

  const createUser = async (role: 'CLIENT' | 'MODERATOR', email?: string) => {
    const userEmail = email || `${role.toLowerCase()}${Date.now()}@test.com`;
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        firstName: role,
        lastName: 'User',
        passwordHash: await bcrypt.hash(password, 10),
        role,
        isVerified: true,
        isActive: true,
        nationalId: `0505050${Math.floor(Math.random() * 9999)}`,
        phone: '0991234567',
        address: 'Avenida 12 de Octubre, Itchimbia, Quito, Pichincha, Ecuador',
        latitude: -0.2171,
        longitude: -78.5123,
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userEmail, password });

    return { user, token: loginRes.body.accessToken };
  };

  const createProduct = async (overrides?: Partial<any>, token?: string) => {
    const defaultData = {
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      type: 'PRODUCT',
      category: 'ELECTRONICS',
      availability: true,
      location: 'Quito, Ecuador',
      serviceHours: '9AM - 5PM',
    };
    const res = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${token || clientToken}`)
      .send({ ...defaultData, ...overrides })
      .expect(201);
    return res.body;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ImagesService)
      .useValue({
        uploadImage: jest.fn().mockResolvedValue({
          secure_url: 'http://fakeurl.com/test-image.jpg',
        }),
        deleteImage: jest.fn(),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = new PrismaClient();

    const client = await prisma.user.upsert({
      where: { email: clientEmail },
      update: {},
      create: {
        email: clientEmail,
        firstName: 'Client',
        lastName: 'User',
        passwordHash: await bcrypt.hash(password, 10),
        role: 'CLIENT',
        isVerified: true,
        isActive: true,
        nationalId: '0505050505',
      },
    });
    clientId = client.id;

    const moderator = await prisma.user.upsert({
      where: { email: moderatorEmail },
      update: {},
      create: {
        email: moderatorEmail,
        firstName: 'Mod',
        lastName: 'User',
        passwordHash: await bcrypt.hash(password, 10),
        role: 'MODERATOR',
        isVerified: true,
        isActive: true,
        nationalId: '0505050506',
      },
    });

    const clientRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: clientEmail, password });
    clientToken = clientRes.body.accessToken;

    const modRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: moderatorEmail, password });
    moderatorToken = modRes.body.accessToken;
  }, 20000);

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  let activeProduct: any;
  let reportedProduct: any;

  beforeAll(async () => {
    activeProduct = await createProduct({ name: 'Active Product' });
    reportedProduct = await createProduct({ name: 'Reported Product' });
    await prisma.product.update({
      where: { id: reportedProduct.id },
      data: { status: 'REPORTED' },
    });
  });
  beforeEach(() => {
  jest.clearAllMocks(); 
});


  it('should create a product', async () => {
    const product = await createProduct();
    expect(product).toHaveProperty('id');
    expect(product.name).toBe('Test Product');
  });

  it('should create a product with images', async () => {
    const res = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${clientToken}`)
      .field('name', 'Test Product')
      .field('description', 'Test Description')
      .field('price', 200)
      .field('type', 'PRODUCT')
      .field('category', 'ELECTRONICS')
      .field('location', 'Quito, Ecuador')
      .field('serviceHours', '9AM - 5PM')
      .field('availability', 'true')
      .attach('images', Buffer.from('fake image content'), 'test-image.jpg')
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.images.length).toBeGreaterThan(0);
    expect(res.body.price).toBe(200);
  });

  it('should mark product as REPORTED if detected as dangerous', async () => {
    const moduleRef = app.get(ProductsService);
    jest
      .spyOn(moduleRef['moderationService'], 'detectDangerousProductById')
      .mockResolvedValue(true);

    const res = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${clientToken}`)
      .field('name', 'Dangerous Product')
      .field('description', 'Test Description')
      .field('price', 300)
      .field('type', 'PRODUCT')
      .field('category', 'ELECTRONICS')
      .field('location', 'Quito')
      .field('serviceHours', '9AM - 5PM')
      .field('availability', 'true')
      .attach('images', Buffer.from('fake image content'), 'danger.jpg')
      .expect(201);

    expect(res.body.status).toBe('REPORTED');
    expect(res.body.images.length).toBeGreaterThan(0);
  });

  it('should forbid updating a product not owned by user', async () => {
    const { user: anotherUser, token } = await createUser('CLIENT');
    await request(app.getHttpServer())
      .patch(`/products/${activeProduct.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' })
      .expect(403);
  });

  it('should forbid updating a product with invalid status', async () => {
    const newProduct = await createProduct({ name: 'Invalid Status Product' });
    await prisma.product.update({
      where: { id: newProduct.id },
      data: { status: 'REPORTED' },
    });

    await request(app.getHttpServer())
      .patch(`/products/${newProduct.id}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ name: 'Attempted Update Name' })
      .expect(400);
  });

  it('should remove product images', async () => {
    const productRes = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${clientToken}`)
      .field('name', 'Product With Images To Remove')
      .field('description', 'Test Description')
      .field('price', 150)
      .field('type', 'PRODUCT')
      .field('category', 'ELECTRONICS')
      .field('location', 'Quito, Ecuador')
      .field('serviceHours', '9AM - 5PM')
      .field('availability', 'true')
      .attach('images', Buffer.from('fake image content 1'), 'image1.jpg')
      .attach('images', Buffer.from('fake image content 2'), 'image2.jpg')
      .expect(201);

    const productId = productRes.body.id;
    const images = productRes.body.images;

    await prisma.product.update({
      where: { id: productId },
      data: { status: 'ACTIVE' },
    });

    const res = await request(app.getHttpServer())
      .patch(`/products/${productId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        name: productRes.body.name,
        description: productRes.body.description,
        price: productRes.body.price,
        imagesToRemove: images.map(img => img.id),
      })
      .expect(200);

    expect(res.body.images.length).toBe(0);
  },20000);

  it('should get all products', async () => {
    const res = await request(app.getHttpServer())
      .get('/products')
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  },20000);

  it('should get product by id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/products/${activeProduct.id}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('id', activeProduct.id);
  });

  it('should update product', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/products/${activeProduct.id}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ price: 150 })
      .expect(200);

    expect(res.body.price).toBe(150);
  },20000);

  it('should change product status (moderator)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/products/${activeProduct.id}/status`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ status: 'ACTIVE' })
      .expect(200);

    expect(res.body.status).toBe('ACTIVE');
  });

  it('should toggle like', async () => {
    const res1 = await request(app.getHttpServer())
      .post(`/products/${activeProduct.id}/like`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect([200, 201]);

    expect(res1.body).toHaveProperty('liked', true);

    const res2 = await request(app.getHttpServer())
      .post(`/products/${activeProduct.id}/like`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect([200, 201]);

    expect(res2.body).toHaveProperty('liked', false);
  });

  it('should get likes count', async () => {
    const res = await request(app.getHttpServer())
      .get(`/products/${activeProduct.id}/likes-count`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect([200, 201]);

    const likesCount = Number(res.text);
    expect(typeof likesCount).toBe('number');
  });

  it('should delete product', async () => {
    await request(app.getHttpServer())
      .delete(`/products/${activeProduct.id}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);
  });

  it('should throw 404 if product does not exist on update', async () => {
    const nonExistentId = 999999;
    await request(app.getHttpServer())
      .patch(`/products/${nonExistentId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ price: 200 })
      .expect(404);
  });

  it('should get all products by user', async () => {
    const res = await request(app.getHttpServer())
      .get(`/products/user/${clientId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should get products by status', async () => {
    const res = await request(app.getHttpServer())
      .get(`/products/status/ACTIVE`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should throw 400 for invalid status', async () => {
    await request(app.getHttpServer())
      .get(`/products/status/INVALIDSTATUS`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(400);
  });

  it('should throw 404 if product does not exist on get', async () => {
    await request(app.getHttpServer())
      .get('/products/999999')
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(404);
  });

  it('should forbid deleting a product not owned by user', async () => {
    const { user: anotherUser, token } = await createUser('CLIENT');
    await request(app.getHttpServer())
      .delete(`/products/${activeProduct.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('should not allow liking a non-active product', async () => {
    await prisma.product.update({
      where: { id: activeProduct.id },
      data: { status: 'SUSPENDED' },
    });

    await request(app.getHttpServer())
      .post(`/products/${activeProduct.id}/like`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(400);
  });

  it('should forbid deleting a reported or suspended product', async () => {
    await prisma.product.update({
      where: { id: activeProduct.id },
      data: { status: 'REPORTED' },
    });

    await request(app.getHttpServer())
      .delete(`/products/${activeProduct.id}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(400);
  });

  it('should handle toggleLike errors', async () => {
    await prisma.product.update({
      where: { id: activeProduct.id },
      data: { status: 'DELETED' },
    });

    await request(app.getHttpServer())
      .post(`/products/${activeProduct.id}/like`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(400);
  });
  
  //Pruebas agregadas

it('should update existing product using provided coordinates', async () => {

  const created = await request(app.getHttpServer())
    .post('/products')
    .set('Authorization', `Bearer ${clientToken}`)
    .send({
      name: "Test Product",
      description: "Lorem ipsum",
      price: 10,
      type: "PRODUCT",
      category: "OTHER",
      address: "Original Address",
      latitude: -12.1,
      longitude: -77.0,
      availability: true
    })
    .expect(201);

  const productId = created.body.id;
  
  await prisma.product.update({
    where: { id: productId },
    data: { status: 'ACTIVE' },
  });
  const newLatitude = "-12.045";
  const newLongitude = "-77.031";
  const newAddress = "Calle Principal 123, Centro";

  const res = await request(app.getHttpServer())
    .patch(`/products/${productId}`)
    .set('Authorization', `Bearer ${clientToken}`)
    .send({
      latitude: newLatitude,
      longitude: newLongitude,
      address: newAddress
    })
    .expect(200);

  expect(String(res.body.latitude)).toBe(newLatitude);
  expect(String(res.body.longitude)).toBe(newLongitude);
  expect(res.body.address).toBe(newAddress);
});

it('should geocode product address if coordinates not provided', async () => {
  const res = await request(app.getHttpServer())
    .post('/products')
    .set('Authorization', `Bearer ${clientToken}`)
    .send({
      name: 'Product With Address Only',
      description: 'Test address fallback',
      price: 50,
      type: 'PRODUCT',
      category: 'OTHER',
      address: 'Quito, Ecuador',
      availability: true
    })
    .expect(201);

  expect(res.body.latitude).toBeDefined();
  expect(res.body.longitude).toBeDefined();
  expect(res.body.address).toContain('Quito');
});

it('should create product even if geocoding fails', async () => {
  const badAddress = 'This Address Does Not Exist 123456789';

  const res = await request(app.getHttpServer())
    .post('/products')
    .set('Authorization', `Bearer ${clientToken}`)
    .send({
      name: 'Product With Bad Address',
      description: 'Fallback test',
      price: 99,
      type: 'PRODUCT',
      category: 'OTHER',
      address: badAddress,
      availability: true
    })
    .expect(201);

  expect(res.body.latitude).toBeNull();
  expect(res.body.longitude).toBeNull();
  expect(['ACTIVE', 'REPORTED']).toContain(res.body.status);
  expect(res.body.address).toBe(badAddress);
});

it('should return products nearby the user without mocking moderation', async () => {

  await prisma.user.update({
    where: { id: clientId },
    data: { latitude: -0.2171, longitude: -78.5123 }, 
  });

  const nearbyProduct = await createProduct({
    name: 'Safe Nearby Product',
    description: 'Test Nearby Product',
    category: 'OTHER',
    latitude: -0.2171,
    longitude: -78.5123,
    availability: true,
  });

  await prisma.product.update({
    where: { id: nearbyProduct.id },
    data: { status: 'ACTIVE' },
  });

  const farProduct = await createProduct({
    name: 'Safe Far Product',
    description: 'Test Far Product',
    category: 'OTHER',
    latitude: -12.045,
    longitude: -77.031,
    availability: true,
  });

  await prisma.product.update({
    where: { id: farProduct.id },
    data: { status: 'ACTIVE' },
  });

  const res = await request(app.getHttpServer())
    .get('/products/nearby')
    .set('Authorization', `Bearer ${clientToken}`)
    .query({ radius: 5 }) 
    .expect(200);
  const productNames = res.body.map((p: any) => p.name);
  expect(productNames).toContain('Safe Nearby Product');
  expect(productNames).not.toContain('Safe Far Product');
},20000);

it('should upload images and cover Promise.all map lines', async () => {
  const res = await request(app.getHttpServer())
    .post('/products')
    .set('Authorization', `Bearer ${clientToken}`)
    .field('name', 'Product with Images')
    .field('description', 'Testing upload')
    .field('price', 100)
    .field('type', 'PRODUCT')
    .field('category', 'ELECTRONICS')
    .field('availability', 'true')
    .attach('images', Buffer.from('fake image content 1'), 'image1.jpg')
    .attach('images', Buffer.from('fake image content 2'), 'image2.jpg')
    .expect(201);

  expect(res.body).toHaveProperty('id');
  expect(res.body.images.length).toBe(2);
  expect(res.body.images[0]).toHaveProperty('url');
});



it('should re-geocode address during update when no coordinates provided', async () => {
  const created = await request(app.getHttpServer())
    .post('/products')
    .set('Authorization', `Bearer ${clientToken}`)
    .send({
      name: 'Product ReGeocode',
      description: 'Test',
      price: 10,
      type: 'PRODUCT',
      category: 'OTHER',
      address: 'Original Address',
      availability: true
    })
    .expect(201);

  const id = created.body.id;

  await prisma.product.update({
    where: { id },
    data: { status: 'ACTIVE' }
  });

  const res = await request(app.getHttpServer())
    .patch(`/products/${id}`)
    .set('Authorization', `Bearer ${clientToken}`)
    .send({
      address: 'Quito, Ecuador' 
    })
    .expect(200);

  expect(res.body).toHaveProperty('latitude');
  expect(res.body).toHaveProperty('longitude');
  expect(res.body.address).toContain('Quito');
},20000);




it('should throw 404 if product does not exist on remove', async () => {
  const nonExistentId = 999999;
  await request(app.getHttpServer())
    .delete(`/products/${nonExistentId}`)
    .set('Authorization', `Bearer ${clientToken}`)
    .expect(404);
});

it('should return an array for any status', async () => {
  const res = await request(app.getHttpServer())
    .get('/products/status/SUSPENDED')
    .set('Authorization', `Bearer ${moderatorToken}`)
    .expect(200);

  expect(Array.isArray(res.body)).toBe(true);

  res.body.forEach((product: any) => {
    expect(product.status).toBe('SUSPENDED');
  });
},20000);

it('should throw 404 if trying to toggle like on non-existent product', async () => {
  const nonExistentProductId = 999999; 
  await request(app.getHttpServer())
    .post(`/products/${nonExistentProductId}/like`)
    .set('Authorization', `Bearer ${clientToken}`)
    .expect(404);
});

it('should throw 400 when radius is invalid in findProductsNearUser', async () => {
  const radius = -5;

  const res = await request(app.getHttpServer())
    .get('/products/nearby')
    .set('Authorization', `Bearer ${clientToken}`)
    .query({ radius }) 
    .expect(400);
});

it('should throw 400 if user does not have location set', async () => {
  const { user, token } = await createUser('CLIENT', 'nolocation@test.com');
  await prisma.user.update({
    where: { id: user.id },
    data: { latitude: null, longitude: null },
  });

  const res = await request(app.getHttpServer())
    .get('/products/nearby')
    .set('Authorization', `Bearer ${token}`)
    .query({ radius: 5 })
    .expect(400);

  expect(res.body.message).toBe(
    'User does not have a location set. Please update your address in your profile.'
  );

});

//Prueba de integracion parcial
it('should log a warning if PostGIS location fails (integration)', async () => {

const service = app.get(ProductsService);
jest.spyOn(service, '$executeRaw').mockRejectedValue(new Error('PostGIS failure'));

const res = await request(app.getHttpServer())
  .post('/products')
  .set('Authorization', `Bearer ${clientToken}`)
  .send({
    name: 'Product PostGIS Fail',
    description: 'Testing PostGIS warning',
    price: 50,
    type: 'PRODUCT',
    category: 'OTHER',
    latitude: -12.0,
    longitude: -77.0,
    availability: true,
  })
  .expect(201);


  expect(res.body).toHaveProperty('id');
  expect(res.body.name).toBe('Product PostGIS Fail');
});

it('should log a warning if PostGIS update fails during product update', async () => {
  const created = await request(app.getHttpServer())
    .post('/products')
    .set('Authorization', `Bearer ${clientToken}`)
    .send({
      name: 'Product PostGIS Update Fail',
      description: 'Test',
      price: 100,
      type: 'PRODUCT',
      category: 'OTHER',
      latitude: -12.0,
      longitude: -77.0,
      availability: true
    })
    .expect(201);

  const productId = created.body.id;

  await prisma.product.update({
    where: { id: productId },
    data: { status: 'ACTIVE' },
  });

  const service = app.get(ProductsService);
  jest.spyOn(service, '$executeRaw').mockRejectedValue(new Error('PostGIS update error'));

  const res = await request(app.getHttpServer())
    .patch(`/products/${productId}`)
    .set('Authorization', `Bearer ${clientToken}`)
    .send({
      price: 200,
      latitude: -12.001,
      longitude: -77.001
    })
    .expect(200);

  expect(res.body.price).toBe(200); 
},20000);

it('should continue update even if re-geocoding fails (fallback catch)', async () => {
  const product = await request(app.getHttpServer())
    .post('/products')
    .set('Authorization', `Bearer ${clientToken}`)
    .send({
      name: 'Product Geocode Fail',
      description: 'Test',
      price: 20,
      type: 'PRODUCT',
      category: 'OTHER',
      address: 'Good Address',
      availability: true
    })
    .expect(201);

  const id = product.body.id;

  await prisma.product.update({
    where: { id },
    data: { status: 'ACTIVE' }
  });

  const service = app.get(ProductsService);
  jest
    .spyOn(service['nominatim'], 'geocodeAddress')
    .mockRejectedValue(new Error('API down'));

  const res = await request(app.getHttpServer())
    .patch(`/products/${id}`)
    .set('Authorization', `Bearer ${clientToken}`)
    .send({
      address: 'Some Broken Address' 
    })
    .expect(200);

  expect(res.body.address).toBe('Some Broken Address');

  expect(res.body.latitude).toBeNull();
  expect(res.body.longitude).toBeNull();
},20000);

it('should update a product and add multiple new images', async () => {
  const mockUpload = jest.spyOn(app.get(ImagesService), 'uploadImage')
    .mockImplementation((file) => {
      return Promise.resolve({ secure_url: `http://fakeurl.com/${file.originalname}` } as any);
    });

  const product = await prisma.product.create({
    data: {
      name: 'Product Multi-Image',
      description: 'Initial Description',
      price: 100,
      type: 'PRODUCT',
      category: 'ELECTRONICS',
      status: 'ACTIVE',
      userId: clientId,
      code: 'PRD-' + Date.now(),
      address: 'Quito, Ecuador',
      latitude: -0.2171,
      longitude: -78.5123,
      serviceHours: '9AM - 5PM',
      availability: true,
      
    },
  });
  const productId = product.id;


  const res = await request(app.getHttpServer())
    .patch(`/products/${productId}`)
    .set('Authorization', `Bearer ${clientToken}`)
    .field('name', 'Updated Name with Images')
    .field('description', 'Updated Description')
    .field('price', 150)
    .attach('images', Buffer.from('fake image 1'), 'image1.jpg')
    .attach('images', Buffer.from('fake image 2'), 'image2.jpg')
    .attach('images', Buffer.from('fake image 3'), 'image3.jpg');

  expect(res.status).toBe(200);
  expect(res.body.images.length).toBe(3);
  expect(res.body.images.map((i: any) => i.url)).toEqual([
    'http://fakeurl.com/image1.jpg',
    'http://fakeurl.com/image2.jpg',
    'http://fakeurl.com/image3.jpg',
  ]);
  expect(mockUpload).toHaveBeenCalledTimes(3);
});


it('should update a product and add multiple new images', async () => {
  const mockUpload = jest.spyOn(app.get(ImagesService), 'uploadImage')
    .mockImplementation((file) => {
      return Promise.resolve({ secure_url: `http://fakeurl.com/${file.originalname}` } as any);
    });

  const product = await prisma.product.create({
    data: {
      name: 'Product Multi-Image',
      description: 'Initial Description',
      price: 100,
      type: 'PRODUCT',
      category: 'ELECTRONICS',
      status: 'ACTIVE',
      userId: clientId,
      code: 'PRD-' + Date.now(),
      address: 'Quito, Ecuador',
      latitude: -0.2171,
      longitude: -78.5123,
      serviceHours: '9AM - 5PM',
      availability: true,
    },
  });
  const productId = product.id;

  const res = await request(app.getHttpServer())
    .patch(`/products/${productId}`)
    .set('Authorization', `Bearer ${clientToken}`)
    .field('name', 'Updated Name with Images')
    .field('description', 'Updated Description')
    .field('price', 150)
    .attach('images', Buffer.from('fake image 1'), 'image1.jpg')
    .attach('images', Buffer.from('fake image 2'), 'image2.jpg')
    .attach('images', Buffer.from('fake image 3'), 'image3.jpg');

  expect(res.status).toBe(200);
  expect(res.body.images.length).toBe(3);
  expect(res.body.images.map((i: any) => i.url)).toEqual([
    'http://fakeurl.com/image1.jpg',
    'http://fakeurl.com/image2.jpg',
    'http://fakeurl.com/image3.jpg',
  ]);

  expect(mockUpload).toHaveBeenCalledTimes(3);
});
});