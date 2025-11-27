import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';

describe('UsersController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let testUserId: string;
  let usersService: UsersService;

  const adminEmail = 'jhanisconteron@gmail.com';
  const testEmail = 'briconteron@gmail.com';  
  const testPassword = 'Password123!';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
      usersService = moduleRef.get<UsersService>(UsersService);

    prisma = new PrismaClient();

    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        firstName: 'Admin',
        lastName: 'User',
        passwordHash: await bcrypt.hash(testPassword, 10),
        role: 'ADMIN',
        isVerified: true,
        isActive: true,
        nationalId: '0550193402',
      },
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: testPassword });
    adminToken = res.body.accessToken;
  },15000);

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await app.close();
  });

  it('should create a new moderator', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/moderators')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: testEmail,
        firstName: 'Test',
        lastName: 'Moderator',
        passwordHash: await bcrypt.hash(testPassword, 10),
        nationalId: '0550197852',
        phone: '0998765432',          
        address: 'Av. Siempre Viva',  
        gender: 'FEMALE'   
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.role).toBe('MODERATOR');
    testUserId = res.body.id;
  },20000);

  it('should get all users', async () => {
    const res = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should get a single user by id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('email', testEmail);
  });

  it('should update user active status', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${testUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false })
      .expect(200);

    expect(res.body.isActive).toBe(false);
  },15000);

  it('should update user role', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${testUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'MODERATOR' })
      .expect(200);

    expect(res.body.role).toBe('MODERATOR');
  });

  it('should update user profile', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'UpdatedName' })
      .expect(200);

    expect(res.body.firstName).toBe('UpdatedName');
  });
    it('should get users filtered by role and isActive', async () => {
    const res = await request(app.getHttpServer())
      .get('/users?role=MODERATOR&isActive=true')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0].role).toBe('MODERATOR');
      expect(res.body[0].isActive).toBe(true);
    }
  });
  it('should reject unauthorized access when no token provided', async () => {
    await request(app.getHttpServer())
      .get(`/users/${testUserId}`)
      .expect(401);
  });
  it('should forbid CLIENT from creating moderator', async () => {
    const client = await prisma.user.create({
      data: {
        email: 'clientforbidden@test.com',
        firstName: 'Client',
        lastName: 'User',
        passwordHash: await bcrypt.hash(testPassword, 10),
        role: 'CLIENT',
        isVerified: true,
        isActive: true,
        nationalId: '1234567895',
      },
    });

    const clientRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: client.email, password: testPassword });
    const clientToken = clientRes.body.accessToken;

    await request(app.getHttpServer())
      .post('/users/moderators')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        email: 'unauthorizedmod@test.com',
        firstName: 'No',
        lastName: 'Access',
        password: testPassword,
        nationalId: '1578945631',
      })
      .expect(403);
  });
  it('should return 404 when getting a nonexistent user', async () => {
  await request(app.getHttpServer())
    .get('/users/invalid-id')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404);
});

it('should return 404 when updating a nonexistent user', async () => {
  await request(app.getHttpServer())
    .patch('/users/invalid-id')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ firstName: 'X' })
    .expect(404);
});

it('should return 404 when changing role of nonexistent user', async () => {
  await request(app.getHttpServer())
    .patch('/users/invalid-id/role')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ role: 'MODERATOR' })
    .expect(404);
});

it('should allow MODERATOR to create a moderator', async () => {
  const mod = await prisma.user.create({
    data: {
      email: 'moduser@test.com',
      firstName: 'Mod',
      lastName: 'User',
      passwordHash: await bcrypt.hash(testPassword, 10),
      role: 'MODERATOR',
      isVerified: true,
      isActive: true,
      nationalId: '0250199999',
    },
  });

  const loginRes = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: mod.email, password: testPassword });

  const modToken = loginRes.body.accessToken;

  const res = await request(app.getHttpServer())
    .post('/users/moderators')
    .set('Authorization', `Bearer ${modToken}`)
    .send({
      email: 'newmod@test.com',
      firstName: 'New',
      lastName: 'Mod',
      password: testPassword,
      nationalId: '0550198288',
    })
    .expect(201);

  expect(res.body.role).toBe('MODERATOR');
},20000);


it('should return null or 404 if user email does not exist', async () => {
  await request(app.getHttpServer())
    .get(`/users/email/nonexistent@test.com`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404);
});

it('should find a user by email (using findOne endpoint)', async () => {
  const user = await request(app.getHttpServer())
    .get(`/users/${testUserId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);

  expect(user.body).toHaveProperty('email', testEmail);
});

it('should activate deactivated products of a user (via setActiveStatus endpoint)', async () => {
  const deactivatedProduct = await prisma.product.create({
    data: {
      code: 'P1001', 
      name: 'Deactivated Product',
      description: 'Test',
      price: 50,
      userId: testUserId,
      status: 'DEACTIVATED',
      type: 'PRODUCT',
      category: 'OTHER',
      availability: true,
    },
  });

  await request(app.getHttpServer())
    .patch(`/users/${testUserId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ isActive: true })
    .expect(200);

  const refreshedProduct = await prisma.product.findUnique({ where: { id: deactivatedProduct.id } });
  expect(refreshedProduct).not.toBeNull();
  expect(refreshedProduct!.status).toBe('ACTIVE');

  await prisma.product.delete({ where: { id: deactivatedProduct.id } });
},20000);

it('should throw error if email already in use when creating moderator', async () => {
  const existingEmail = testEmail; 

  await request(app.getHttpServer())
    .post('/users/moderators')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: existingEmail,
      firstName: 'Duplicate',
      lastName: 'User',
      password: testPassword,
      nationalId: '0550199999',
    })
    .expect(400);
});

it('should return 404 if user does not exist', async () => {
  await request(app.getHttpServer())
    .get('/users/nonexistent-id')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404);
});

it('should throw 404 when setting role of nonexistent user', async () => {
  await request(app.getHttpServer())
    .patch('/users/nonexistent-id/role')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ role: 'MODERATOR' })
    .expect(404);
});

it('should throw 400 when trying to assign ADMIN role', async () => {
  await request(app.getHttpServer())
    .patch(`/users/${testUserId}/role`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ role: 'ADMIN' })
    .expect(400);
});

it('should return 404 when updating nonexistent user', async () => {
  await request(app.getHttpServer())
    .patch('/users/nonexistent-id')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ firstName: 'Name' })
    .expect(404);
});

it('should return 404 when changing status of nonexistent user', async () => {
  await request(app.getHttpServer())
    .patch('/users/nonexistent-id/status')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ isActive: true })
    .expect(404);
});

//NUEVOS
it('should create a moderator using provided coordinates', async () => {
  const res = await request(app.getHttpServer())
    .post('/users/moderators')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: 'coordinatestest@test.com',
      firstName: 'Coordinate',
      lastName: 'User',
      passwordHash: await bcrypt.hash(testPassword, 10),
      nationalId: '1850274414',
      phone: '0990000001',
      gender: 'MALE',
      address: 'Avenida 12 de Octubre, Itchimbia, Quito, Pichincha, Ecuador',
      latitude: -0.2171,        
      longitude: -78.5123, 
    })
    .expect(201);

  expect(res.body.latitude).toBe(-0.2171);
  expect(res.body.longitude).toBe(-78.5123);
},20000);

it('should log warning if PostGIS update fails (integration partial)', async () => {
  const uniqueEmail = `postgisfail${Date.now()}@test.com`;
  const latitude = -0.18065;
  const longitude = -78.46784;

  const originalExecuteRaw = usersService.$executeRaw.bind(usersService);
  usersService.$executeRaw = jest.fn().mockImplementation(() => {
    throw new Error('Simulated PostGIS failure');
  });

  const warnSpy = jest.spyOn(usersService['logger'], 'warn');

  await usersService.createModerator({
    email: uniqueEmail,
    firstName: 'PostGIS',
    lastName: 'Fail',
    passwordHash: await bcrypt.hash(testPassword, 10),
    nationalId: '0999999999',
    phone: '0999999999',
    address: 'Quito, Ecuador',
    gender: 'MALE',
    latitude,
    longitude,
  });

  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to set PostGIS location'));

  usersService.$executeRaw = originalExecuteRaw;
},20000);


it('should create moderator and continue if geocoding fails (real request, no mocks)', async () => {
  const uniqueEmail = `failgeocode${Date.now()}@test.com`;

  const res = await request(app.getHttpServer())
    .post('/users/moderators')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: uniqueEmail,
      firstName: 'FailGeo',
      lastName: 'Test',
      passwordHash: await bcrypt.hash(testPassword, 10),
      nationalId: '1850994623',
      phone: '0990001112',
      address: 'This address does not exist anywhere 12345',
      gender: 'FEMALE'
      
    })
    .expect(201); 

  expect(res.body.address).toBe('This address does not exist anywhere 12345');

  await prisma.user.delete({ where: { id: res.body.id } });
}, 20000);


it('should use provided coordinates and update user', async () => {
  const user = await prisma.user.create({
    data: {
      email: `coorduser${Date.now()}@test.com`,
      firstName: 'Coord',
      lastName: 'User',
      passwordHash: await bcrypt.hash(testPassword, 10),
      role: 'MODERATOR',
      isVerified: true,
      isActive: true,
      nationalId: '1850123457',
      phone: '0991234568',
      address: 'Old Address, Quito',
    },
  });

  const debugSpy = jest.spyOn(usersService['logger'], 'debug');

  const res = await request(app.getHttpServer())
    .patch(`/users/${user.id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      latitude: -0.2165,
      longitude: -78.5125,
      address: 'New Address, Quito',
      firstName: 'UpdatedCoord'
    })
    .expect(200);

  expect(res.body.latitude).toBe(-0.2165);
  expect(res.body.longitude).toBe(-78.5125);
  expect(res.body.address).toBe('New Address, Quito');
  expect(res.body.firstName).toBe('UpdatedCoord');

  expect(debugSpy).toHaveBeenCalledWith(
    expect.stringContaining('Using provided coordinates for user update')
  );

  await prisma.user.delete({ where: { id: user.id } });
});

it('should update user using provided coordinates', async () => {
  const newAddress = 'Av. 12 de Octubre, Quito, Ecuador';
  const latitude = -0.2171;
  const longitude = -78.5123;

  const res = await request(app.getHttpServer())
    .patch(`/users/${testUserId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      firstName: 'CoordsProvided',
      address: newAddress,
      latitude,
      longitude
    })
    .expect(200);

  expect(res.body.firstName).toBe('CoordsProvided');
  expect(res.body.latitude).toBe(latitude);
  expect(res.body.longitude).toBe(longitude);
  expect(res.body.address).toBe(newAddress);
});

it('should update user using geocoding fallback (success)', async () => {
  const newAddress = 'Parque La Carolina, Quito, Ecuador';

  const res = await request(app.getHttpServer())
    .patch(`/users/${testUserId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      firstName: 'GeocodeSuccess',
      address: newAddress
    })
    .expect(200);

  expect(res.body.firstName).toBe('GeocodeSuccess');
  expect(res.body.address).toContain('Quito'); 
  expect(res.body.latitude).toBeDefined();
  expect(res.body.longitude).toBeDefined();
});

it('should log warning if geocoding fails during user update', async () => {
  const impossibleAddress = 'This address does not exist anywhere 12345';

  const originalGeocode = usersService['nominatim'].geocodeAddress;

  usersService['nominatim'].geocodeAddress = jest.fn().mockImplementation(() => {
    throw new Error('Simulated geocoding failure');
  });

  const warnSpy = jest.spyOn(usersService['logger'], 'warn');

  const res = await request(app.getHttpServer())
    .patch(`/users/${testUserId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      firstName: 'GeocodeFail',
      address: impossibleAddress
    })
    .expect(200);

  expect(res.body.firstName).toBe('GeocodeFail');
  expect(res.body.address).toBe(impossibleAddress);

  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to geocode user address'));

  usersService['nominatim'].geocodeAddress = originalGeocode;
});


it('should log warning if PostGIS update fails during user update', async () => {
  const latitude = -0.18065;
  const longitude = -78.46784;

  const originalExecuteRaw = usersService.$executeRaw.bind(usersService);
  usersService.$executeRaw = jest.fn().mockImplementation(() => {
    throw new Error('Simulated PostGIS failure');
  });

  const warnSpy = jest.spyOn(usersService['logger'], 'warn');

  const res = await request(app.getHttpServer())
    .patch(`/users/${testUserId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      firstName: 'PostGISFail',
      latitude,
      longitude,
      address: 'Quito, Ecuador'
    })
    .expect(200);

  expect(res.body.firstName).toBe('PostGISFail');
  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to update PostGIS location'));

  usersService.$executeRaw = originalExecuteRaw;
});

});
