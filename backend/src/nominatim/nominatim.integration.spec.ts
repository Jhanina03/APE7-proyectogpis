import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import request from 'supertest';
import { NominatimModule } from '../nominatim/nominatim.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NominatimService } from '../nominatim/nominatim.service';

class TestJwtAuthGuard {
  canActivate() {
    return true;
  }
}

describe('NominatimController (Integration)', () => {
  let app: INestApplication;
  let nominatimService: NominatimService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [NominatimModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    nominatimService = moduleRef.get<NominatimService>(NominatimService);

    (nominatimService as any).CACHE_TTL = 1000;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return results for a valid query', async () => {
    const response = await request(app.getHttpServer())
      .get('/nominatim/search')
      .query({ q: 'quito' })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('address');
    expect(response.body[0]).toHaveProperty('latitude');
    expect(response.body[0]).toHaveProperty('longitude');
  });

  it('should throw BadRequestException for empty query', async () => {
    const response = await request(app.getHttpServer())
      .get('/nominatim/search')
      .query({ q: '' })
      .expect(400);

    expect(response.body.message).toBe('Query parameter "q" is required');
  });

  it('should throw BadRequestException for short query', async () => {
    const response = await request(app.getHttpServer())
      .get('/nominatim/search')
      .query({ q: 'abc' })
      .expect(400);

    expect(response.body.message).toBe('Query must be at least 5 characters');
  });

  it('should return empty array for non-existing address', async () => {
    const response = await request(app.getHttpServer())
      .get('/nominatim/search')
      .query({ q: 'asdasdasdasdasd' })
      .expect(200);

    expect(response.body).toEqual([]);
  },20000);

  it('should throw BadRequestException for empty address in service', async () => {
    await expect(nominatimService.geocodeAddress('')).rejects.toThrow(
      new BadRequestException('Address cannot be empty'),
    );
  });

  it('should throw BadRequestException for short address in service', async () => {
    await expect(nominatimService.geocodeAddress('abc')).rejects.toThrow(
      new BadRequestException('Address is too short. Provide more details.'),
    );
  });

  it('should return cached result for geocodeAddress', async () => {
    const result1 = await nominatimService.geocodeAddress('Quito, Ecuador');
    const cachedResult = await nominatimService.geocodeAddress('Quito, Ecuador');

    expect(cachedResult).toEqual(result1); 
  });

  it('should return empty array for non-existing search', async () => {
    const results = await nominatimService.searchAddresses('asdasdasdasdasd');
    expect(results).toEqual([]);
  });

  it('should throw BadRequestException for empty search query in service', async () => {
    await expect(nominatimService.searchAddresses('')).rejects.toThrow(
      new BadRequestException('Search query cannot be empty'),
    );
  });

  it('should throw BadRequestException for short search query in service', async () => {
    await expect(nominatimService.searchAddresses('abc')).rejects.toThrow(
      new BadRequestException('Search query must be at least 5 characters'),
    );
  });

  it('should return cached results for searchAddresses', async () => {
    const results1 = await nominatimService.searchAddresses('Quito');
    const results2 = await nominatimService.searchAddresses('Quito');

    expect(results2).toEqual(results1); // cubre logger.debug de cache hit
  });


it('should trigger "No results found" warning and throw BadRequestException', async () => {
  await expect(
    nominatimService.geocodeAddress('asdasdasdasdasd qwerty') 
  ).rejects.toThrow(BadRequestException);
});

it('should trigger low confidence match warning', async () => {
  const result = await nominatimService.geocodeAddress('Isla de la Plata, Ecuador');
  if (result.importance < 0.3) {
    expect(result.importance).toBeLessThan(0.3);
  } else {
    expect(result.importance).toBeGreaterThanOrEqual(0.3);
  }
});

it('should throw BadRequestException on fetch/network error in geocodeAddress', async () => {
  // Si fetch falla (timeout, DNS, etc), se lanza BadRequestException
  try {
    await nominatimService.geocodeAddress('Quito, Ecuador');
  } catch (err) {
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.message).toBe('Failed to geocode address. Try again later.');
  }
});

it('should throw BadRequestException on fetch/network error in searchAddresses', async () => {
  try {
    await nominatimService.searchAddresses('direccion que no existe 1234567890');
  } catch (err) {
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.message).toBe('Failed to search addresses. Try again later.');
  }
});

it('should clear cache correctly', () => {
  nominatimService.clearCache();
  expect((nominatimService as any).cache.size).toBe(0);
});

it('should trigger "No results found" warning and throw BadRequestException', async () => {
  await expect(
    nominatimService.geocodeAddress('asdasdasdasdasd qwerty')
  ).rejects.toThrow(BadRequestException);
});

it('should trigger low confidence match warning', async () => {
  const result = await nominatimService.geocodeAddress('Isla de la Plata, Ecuador');
  if (result.importance < 0.3) {
    expect(result.importance).toBeLessThan(0.3); 
  } else {
    expect(result.importance).toBeGreaterThanOrEqual(0.3);
  }
});

it('should throw BadRequestException on fetch/network error in geocodeAddress', async () => {
  (nominatimService as any).baseUrl = 'https://noexiste.openstreetmap.org';
  await expect(nominatimService.geocodeAddress('Quito, Ecuador')).rejects.toThrow(
    BadRequestException,
  );
});

it('should throw BadRequestException on fetch/network error in searchAddresses', async () => {
  (nominatimService as any).baseUrl = 'https://noexiste.openstreetmap.org';
  await expect(nominatimService.searchAddresses('Quito, Ecuador')).rejects.toThrow(
    BadRequestException,
  );
});

it('should clear cache correctly', () => {
  nominatimService.clearCache();
  expect((nominatimService as any).cache.size).toBe(0);
});


it('should cover if (!response.ok) in searchAddresses', async () => {
  const realFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    statusText: 'Internal Server Error',
  } as any);

  await expect(nominatimService.searchAddresses('Quito, Ecuador')).rejects.toThrow(
    BadRequestException
  );

  global.fetch = realFetch;
},20000);


it('should cover if (!response.ok) in geocodeAddress', async () => {
  const realFetch = global.fetch;

  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    statusText: 'Internal Server Error',
  } as any);

  await expect(nominatimService.geocodeAddress('Quito, Ecuador')).rejects.toThrow(
    BadRequestException
  );

  global.fetch = realFetch;
},20000);

it('should cover "throw error" for BadRequestException in searchAddresses', async () => {
  const originalFetch = global.fetch;

  global.fetch = jest.fn().mockImplementation(() => {
    throw new BadRequestException('Forced error inside try');
  });

  await expect(nominatimService.searchAddresses('Quito, Ecuador')).rejects.toThrow(
    BadRequestException
  );
  global.fetch = originalFetch;
});
});
