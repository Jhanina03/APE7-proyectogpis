import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtToken: string;
  let verificationCode: string;

  const testUser = {
    email: 'jhaninaconteron03@gmail.com',
    password: 'Password123!',
    firstName: 'Jhanina',
    lastName: 'Conterón',
    nationalId: '0550193403',
    phone: '0991234567',      
    gender: 'FEMALE',          
    address: 'Avenida 12 de Octubre, Itchimbia, Quito, Pichincha, Ecuador',
    latitude: -0.2171,        
    longitude: -78.5123,      
    role: 'CLIENT',            
  };

  beforeAll(async () => {
     jest.setTimeout(30000);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    prisma = app.get(PrismaService);
    await app.init();

    await prisma.token.deleteMany({
      where: { user: { email: testUser.email } },
    });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
  },30000);

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('should register a new user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body).toHaveProperty(
      'message',
      'Verification code sent to email',
    );

    const token = await prisma.token.findFirst({
      where: { user: { email: testUser.email }, type: 'VERIFICATION' },
    });

    if (!token) throw new Error('No se encontró token de verificación');

    verificationCode = token.token;
    expect(verificationCode).toBeDefined();
  }, 20000);

  it('should fail to register if email already exists and is verified', async () => {
    await prisma.user.update({
      where: { email: testUser.email },
      data: { isVerified: true },
    });

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(400);

    expect(res.body.message).toBe('Email already in use');
  });

  it('should verify the user email', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/verify')
      .send({ email: testUser.email, code: verificationCode })
      .expect(201);

    expect(res.body.message).toBe('Email verified successfully');
  });

  it('should login the user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    jwtToken = res.body.accessToken;
  });
  it('should resend verification if user exists but not verified', async () => {
    const email = 'unverified2@example.com';
    const password = 'Password123!';
    const nationalId = '0502287551';

    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          passwordHash: await bcrypt.hash(password, 10),
          firstName: 'Unverified',
          lastName: 'User',
          nationalId,
          isVerified: false,
        },
      });
    } else {
      await prisma.user.update({
        where: { email },
        data: { isVerified: false },
      });
    }

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
        firstName: 'Unverified',
        lastName: 'User',
        nationalId,
        phone: '0990000000',
        gender: 'FEMALE',
        address: 'Calle de Prueba 123',
        latitude: -0.2171,
        longitude: -78.5123,
        role: 'CLIENT',
      })
        .expect(201);
    expect(res.body.message).toMatch(/Verification code resent/i);

    const token = await prisma.token.findFirst({
      where: { user: { email }, type: 'VERIFICATION' },
      orderBy: { createdAt: 'desc' },
    });

    expect(token).toBeDefined();
  }, 20000);

  it('should resend verification email if user exists and is not verified', async () => {
    const email = 'unverified@example.com';

    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          passwordHash: testUser.password,
          firstName: 'Unverified',
          lastName: 'User',
          nationalId: '0502287550',
          isVerified: false,
        },
      });
    } else {
      await prisma.user.update({
        where: { email },
        data: { isVerified: false },
      });
    }

    const res = await request(app.getHttpServer())
      .post('/auth/resend-verification')
      .send({ email })
      .expect(201);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(
      /Verification code sent|Verification email resent|Verification code resent to email/i,
    );

    const token = await prisma.token.findFirst({
      where: { user: { email }, type: 'VERIFICATION' },
      orderBy: { createdAt: 'desc' },
    });

    expect(token).toBeDefined();
  }, 15000);

  it('should initiate forgot password flow', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: testUser.email })
      .expect(201);

    expect(res.body.message).toBeDefined();

    const token = await prisma.token.findFirst({
      where: { user: { email: testUser.email }, type: 'RECOVERY' },
    });
    expect(token).toBeDefined();

    if (!token) throw new Error('No se encontró token de recuperación');

    verificationCode = token.token;
  }, 15000);

  it('should reset password', async () => {
    const newPassword = 'NewPassword123!';
    const res = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ email: testUser.email, code: verificationCode, newPassword })
      .expect(201);

    expect(res.body.message).toBeDefined();
  });

  it('should login with new password', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: 'NewPassword123!' })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
  });

  it('should logout the user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(201);

    expect(res.body).toHaveProperty('message', 'Logged out successfully');
  });
  it('should fail to register with invalid Ecuadorian national ID', async () => {
    const invalidUser = {
      email: 'invalidid@example.com',
      password: 'Password123!',
      firstName: 'Invalid',
      lastName: 'User',
      nationalId: '1234567890',
      address: 'Calle Falsa 123',
      latitude: -0.2171,
      longitude: -78.5123,
    };

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(invalidUser)
      .expect(400);

    expect(res.body.message).toBe('Invalid Ecuadorian national ID (cedula)');
  });
  it('should fail to register if national ID is already registered', async () => {
    const newUser = {
      ...testUser,
      email: 'anotheruser@example.com',
    };

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(newUser)
      .expect(400);

    expect(res.body.message).toBe('National ID already registered');
  }, 20000);
  it('should return "User already verified" if user is already verified', async () => {
    await prisma.user.update({
      where: { email: testUser.email },
      data: { isVerified: true },
    });

    const res = await request(app.getHttpServer())
      .post('/auth/resend-verification')
      .send({ email: testUser.email })
      .expect(201);

    expect(res.body.message).toBe('User already verified');
  });
  it('should fail if too many verification attempts', async () => {
    const email = testUser.email;

    await prisma.user.update({
      where: { email },
      data: { isVerified: false },
    });

    const now = new Date();
    for (let i = 0; i < 5; i++) {
      await prisma.token.create({
        data: {
          user: { connect: { email } },
          token: `code${i}`,
          type: 'VERIFICATION',
          createdAt: new Date(now.getTime() - i * 1000),
          expiresAt: new Date(now.getTime() + 1000 * 60 * 60),
        },
      });
    }
    const res = await request(app.getHttpServer())
      .post('/auth/resend-verification')
      .send({ email })
      .expect(400);

    expect(res.body.message).toBe(
      'Too many verification attempts. Try again later.',
    );
  });
  it('should fail login if user is deactivated', async () => {
    const email = 'deactivated@example.com';
    const password = 'Password123!';

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { email },
      update: { isActive: false, passwordHash: hashedPassword },
      create: {
        email,
        passwordHash: hashedPassword,
        firstName: 'Deactivated',
        lastName: 'User',
        nationalId: '0502287555',
        isVerified: true,
        isActive: false,
      },
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(401);

    expect(res.body.message).toBe(
      'This account is deactivated. Please contact support.',
    );
  });

  it('should fail to reset password if token does not exist', async () => {
    const email = 'notokenreset@example.com';
    const password = 'Password123!';

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: hashedPassword,
        firstName: 'No',
        lastName: 'TokenReset',
        nationalId: '0502287560',
        isVerified: true,
        isActive: true,
      },
    });

    const res = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ email, code: 'nonexistenttoken', newPassword: 'NewPassword123!' })
      .expect(400);

    expect(res.body.message).toBe('Invalid or expired code');
  });

  it('should fail to reset password if token is expired', async () => {
    const email = 'expiredreset@example.com';
    const password = 'Password123!';

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: hashedPassword,
        firstName: 'Expired',
        lastName: 'Reset',
        nationalId: '0502287561',
        isVerified: true,
        isActive: true,
      },
    });

    const expiredToken = 'expiredreset123';
    await prisma.token.create({
      data: {
        token: expiredToken,
        type: 'RECOVERY',
        user: { connect: { email } },
        createdAt: new Date(Date.now() - 1000 * 60 * 60),
        expiresAt: new Date(Date.now() - 1000 * 60),
        used: false,
      },
    });

    const res = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ email, code: expiredToken, newPassword: 'NewPassword123!' })
      .expect(400);

    expect(res.body.message).toBe('Invalid or expired code');
  });

it('should geocode user address if coordinates not provided', async () => {
  const email = 'geocodefallback@example.com';
  const nationalId = '0503961872';

  await prisma.user.deleteMany({ where: { email } });

  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email,
      password: 'Password123!',
      firstName: 'Geo',
      lastName: 'Coder',
      nationalId,
      phone: '0991112233',
      gender: 'MALE',
      address: 'Av. 12 de Octubre, Quito, Pichincha, Ecuador',
    })
    .expect(201);

  expect(res.body.message).toBe('Verification code sent to email');

  const user = await prisma.user.findUnique({ where: { email } });
  expect(user).toBeDefined();
  expect(user?.latitude).toBeDefined();
  expect(user?.longitude).toBeDefined();
},20000);


//NUEVAS
it('should continue registration even if geocoding fails', async () => {
  const email = 'geocodefail1@example.com';
  const nationalId = '0550056824';

  const authService = app.get(AuthService);
  jest.spyOn(authService['nominatim'], 'geocodeAddress').mockImplementation(() => {
    throw new Error('Geocoding service unavailable');
  });

  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email,
      password: 'Password123!',
      firstName: 'Geo',
      lastName: 'Fail',
      nationalId,
      phone: '0992223344',
      gender: 'FEMALE',
      address: 'Av. Siempre Viva 742, Quito',
    })
    .expect(201);

  expect(res.body.message).toBe('Verification code sent to email');

  const user = await prisma.user.findUnique({ where: { email } });
  expect(user).toBeDefined();
  expect(user?.address).toBe('Av. Siempre Viva 742, Quito');
},20000);
});
