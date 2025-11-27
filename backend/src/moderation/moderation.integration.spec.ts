import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('ModerationController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  let moderatorToken: string;
  let clientToken: string;
  let moderatorId: string;
  let clientId: string;
  let productId: number;
  let incidentId: number;

  const moderatorEmail = 'mod@test.com';
  const clientEmail = 'client@test.com';
  const password = 'Password123!';

  const hashPassword = async (pwd: string) => await bcrypt.hash(pwd, 10);

  const createUser = async (role: 'CLIENT' | 'MODERATOR', email?: string) => {
    const userEmail = email || `${role.toLowerCase()}${Date.now()}@test.com`;
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        firstName: role,
        lastName: 'User',
        passwordHash: await hashPassword(password),
        role,
        isVerified: true,
        isActive: true,
        nationalId: `0505050${Math.floor(Math.random() * 9999)}`,
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userEmail, password });

    return { user, token: loginRes.body.accessToken };
  };

  const createProduct = async (overrides?: Partial<any>, userId?: string) => {
    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'Product for moderation tests',
        price: 100,
        type: 'PRODUCT',
        category: 'ELECTRONICS',
        userId: userId!,
        code: `PRD_${Date.now()}`,
        status: 'ACTIVE',
        ...overrides,
      },
    });
    return product;
  };

  const createIncident = async (overrides?: Partial<any>) => {
    const client = await prisma.user.findUnique({ where: { email: clientEmail } });
    const incident = await prisma.incident.create({
      data: {
        productId,
        reporterId: client!.id,
        status: 'PENDING',
        type: 'DANGEROUS',
        comment: 'Moderation test incident',
        ...overrides,
      },
    });
    return incident;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = new PrismaClient();

    const mod = await prisma.user.upsert({
      where: { email: moderatorEmail },
      update: {},
      create: {
        email: moderatorEmail,
        firstName: 'Mod',
        lastName: 'User',
        passwordHash: await hashPassword(password),
        role: 'MODERATOR',
        isVerified: true,
        isActive: true,
        nationalId: '0550193405',
      },
    });
    moderatorId = mod.id;

    const client = await prisma.user.upsert({
      where: { email: clientEmail },
      update: {},
      create: {
        email: clientEmail,
        firstName: 'Client',
        lastName: 'User',
        passwordHash: await hashPassword(password),
        role: 'CLIENT',
        isVerified: true,
        isActive: true,
        nationalId: '0597458971',
      },
    });
    clientId = client.id;

    const modRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: moderatorEmail, password });
    moderatorToken = modRes.body.accessToken;

    const clientRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: clientEmail, password });
    clientToken = clientRes.body.accessToken;

    const product = await createProduct({}, clientId);
    productId = product.id;
  }, 20000);

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('should create a report (client)', async () => {
    const clientUser = await prisma.user.findUnique({ where: { email: clientEmail } });
    const res = await request(app.getHttpServer())
      .post('/moderation/report')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        productId,
        type: 'DANGEROUS',
        comment: 'This product is dangerous',
        reporterId: clientUser!.id,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    incidentId = res.body.id;
  });

  it('should assign a moderator to incident (while PENDING)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/moderation/incident/${incidentId}/assign/${moderatorId}`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(200);

    expect(res.body.moderatorId).toBe(moderatorId);
  });

  it('should throw if original moderator tries to handle an appealed incident', async () => {
    const appealedIncident = await createIncident({ status: 'APPEALED', moderatorId });
    const res = await request(app.getHttpServer())
      .patch(`/moderation/incident/${appealedIncident.id}/assign/${moderatorId}`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(400);
    expect(res.body.message).toBe('Original moderator cannot handle the appeal');
  });

  it('should assign a new moderator to appealed incident without appealModeratorId', async () => {
    const newMod = (await createUser('MODERATOR')).user;
    const appealedIncident = await createIncident({ status: 'APPEALED', moderatorId, appealModeratorId: null });
    const res = await request(app.getHttpServer())
      .patch(`/moderation/incident/${appealedIncident.id}/assign/${newMod.id}`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(200);
    expect(res.body.appealModeratorId).toBe(newMod.id);
  });

  it('should throw if appealed incident already has an appeal moderator', async () => {
    const anotherMod = (await createUser('MODERATOR')).user;
    const appealedIncident = await createIncident({ status: 'APPEALED', moderatorId, appealModeratorId: anotherMod.id });
    const res = await request(app.getHttpServer())
      .patch(`/moderation/incident/${appealedIncident.id}/assign/${anotherMod.id}`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(400);
    expect(res.body.message).toBe('Appeal already assigned to a moderator');
  });

  it('should throw if PENDING incident already has a moderator', async () => {
    const anotherMod = (await createUser('MODERATOR')).user;
    const pendingIncident = await createIncident({ moderatorId });
    const res = await request(app.getHttpServer())
      .patch(`/moderation/incident/${pendingIncident.id}/assign/${anotherMod.id}`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(400);
    expect(res.body.message).toBe('Incident already assigned to a moderator');
  });

  it('should set product status to ACTIVE when incident is REJECTED', async () => {
    const pendingIncident = await createIncident();
    const res = await request(app.getHttpServer())
      .patch(`/moderation/incident/${pendingIncident.id}/resolve`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ finalStatus: 'REJECTED' })
      .expect(200);
    expect(res.body.status).toBe('REJECTED');

    const product = await prisma.product.findUnique({ where: { id: pendingIncident.productId } });
    expect(product?.status).toBe('ACTIVE');
  });

  it('should detect dangerous products and create incidents', async () => {
    const dangerousProduct = await createProduct({ name: 'drug', description: 'This product contains banned content' }, clientId);
    const res = await request(app.getHttpServer())
      .get('/moderation/detect-dangerous')
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(200);
    const found = res.body.find((p: any) => p.id === dangerousProduct.id);
    expect(found).toBeDefined();

    const incident = await prisma.incident.findFirst({ where: { productId: dangerousProduct.id } });
    expect(incident).toBeDefined();
    expect(incident?.type).toBe('DANGEROUS');
    expect(incident?.status).toBe('PENDING');
  });

  it('should change incident status (moderator) to ACCEPTED', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/moderation/incident/${incidentId}/status`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ status: 'ACCEPTED' })
      .expect(200);
    expect(res.body.status).toBe('ACCEPTED');
  });

  it('should resolve incident (moderator) -> suspend product', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/moderation/incident/${incidentId}/resolve`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ finalStatus: 'ACCEPTED' })
      .expect(200);
    expect(res.body.status).toBe('ACCEPTED');
    expect(res.body.moderatorId || res.body.appealModeratorId).toBeDefined();
  });

  it('should manage appeal (client) after product is SUSPENDED', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/moderation/incident/${incidentId}/appeal`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ reason: 'Appeal reason for testing' })
      .expect(200);
    expect(res.body.appealReason).toBe('Appeal reason for testing');
    expect(res.body.status).toBe('APPEALED');
  });

  it('should resolve incident after appeal (moderator) and possibly ban', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/moderation/incident/${incidentId}/resolve`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ finalStatus: 'ACCEPTED' })
      .expect(200);
    expect(res.body.status).toBe('ACCEPTED');
    expect(res.body.appealModeratorId || res.body.moderatorId).toBeDefined();
  });

  it('should get incidents by status (moderator)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/moderation/incidents/PENDING`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should detect dangerous products', async () => {
    const res = await request(app.getHttpServer())
      .get('/moderation/detect-dangerous')
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should get all incidents (moderator)', async () => {
    const res = await request(app.getHttpServer())
      .get('/moderation/incidents')
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should throw when assigning incident to non-existing moderator', async () => {
    await request(app.getHttpServer())
      .patch(`/moderation/incident/${incidentId}/assign/invalid-mod-id`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(400);
  });

  it('should forbid original moderator to handle appeal', async () => {
    await prisma.incident.update({ where: { id: incidentId }, data: { moderatorId } });
    await request(app.getHttpServer())
      .patch(`/moderation/incident/${incidentId}/appeal`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ reason: 'Appeal reason' })
      .expect(400);
  });

  it('should throw if incident is not PENDING when assigning', async () => {
    await prisma.incident.update({ where: { id: incidentId }, data: { status: 'ACCEPTED' } });
    await request(app.getHttpServer())
      .patch(`/moderation/incident/${incidentId}/assign/${moderatorId}`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(400);
  });

  it('should throw if appeal already submitted', async () => {
    const clientUser = await prisma.user.findUnique({ where: { email: clientEmail } })!;
    await prisma.product.update({ where: { id: productId }, data: { status: 'SUSPENDED' } });
    const appealedIncident = await createIncident({ status: 'ACCEPTED', appealReason: 'Already appealed reason' });

    await request(app.getHttpServer())
      .patch(`/moderation/incident/${appealedIncident.id}/appeal`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ reason: 'Trying to appeal again' })
      .expect(400);
  });

  it('should return 404 if product does not exist when detecting danger by productId', async () => {
    const res = await request(app.getHttpServer())
      .get(`/moderation/detect-dangerous/999999/test`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(404);
    expect(res.body.message).toBe('Product not found');
  });

  it('should detect dangerous and safe product correctly by productId', async () => {
    const safeProduct = await createProduct({ name: 'Normal Product', description: 'Nothing dangerous here' }, clientId);
    const dangerousProduct = await createProduct({ name: 'drug', description: 'Contains banned content' }, clientId);

    const resSafe = await request(app.getHttpServer())
      .get(`/moderation/detect-dangerous/${safeProduct.id}/test`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(200);
    expect(resSafe.body.isDangerous).toBe(false);

    const resDangerous = await request(app.getHttpServer())
      .get(`/moderation/detect-dangerous/${dangerousProduct.id}/test`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(200);
    expect(resDangerous.body.isDangerous).toBe(true);

    const incident = await prisma.incident.findFirst({ where: { productId: dangerousProduct.id } });
    expect(incident).toBeDefined();
    expect(incident?.type).toBe('DANGEROUS');
    expect(incident?.status).toBe('PENDING');
  });
});
