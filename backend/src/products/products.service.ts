import {
  Injectable,
  HttpException,
  HttpStatus,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaClient, ProductStatus } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ImagesService } from '../images/images.service';
import { ModerationService } from '../moderation/moderation.service';
import { NominatimService } from '../nominatim/nominatim.service';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private imagesService: ImagesService,
    private moderationService: ModerationService,
    private nominatim: NominatimService,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async create(
    createProductDto: CreateProductDto,
    files?: Express.Multer.File[],
    userId?: string,
  ) {
    let imagesData: any[] = [];

    if (files && files.length) {
      const uploadedImages = await Promise.all(
        files.map((file) => this.imagesService.uploadImage(file)),
      );
      imagesData = uploadedImages.map((img) => ({ url: img.secure_url }));
    }

    // Use provided coordinates or fallback to geocoding
    let latitude: number | null = createProductDto.latitude || null;
    let longitude: number | null = createProductDto.longitude || null;
    let geocodedAddress: string | null = null;
    let addressType: string | null = createProductDto.addressType || null;

    if (latitude && longitude) {
      // Coordinates provided from frontend - use directly!
      geocodedAddress = createProductDto.address || null;
      this.logger.debug(`Using provided coordinates for product (lat: ${latitude}, lng: ${longitude})`);
    } else if (createProductDto.address) {
      // Fallback: geocode if coordinates not provided
      try {
        const geocoded = await this.nominatim.geocodeAddress(createProductDto.address);
        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
        geocodedAddress = geocoded.address;
        addressType = geocoded.type;
        this.logger.debug(`Product location geocoded (fallback): ${geocodedAddress}`);
      } catch (error) {
        this.logger.warn(`Failed to geocode product address: ${error.message}`);
        // Continue without location - it's optional for products
        geocodedAddress = createProductDto.address;
      }
    }

    // Crear producto primero
    let product = await this.product.create({
      data: {
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        type: createProductDto.type || 'PRODUCT',
        category: createProductDto.category || 'OTHER',
        address: geocodedAddress || createProductDto.address,
        latitude,
        longitude,
        addressType,
        serviceHours: createProductDto.serviceHours,
        availability: createProductDto.availability,
        userId: userId,
        images: { create: imagesData },
        code: `PRD_${Date.now()}`,
      },
      include: { images: true },
    });

    // Update PostGIS location if coordinates available
    if (latitude && longitude) {
      try {
        await this.$executeRaw`
          UPDATE "Product"
          SET location = ST_SetSRID(
            ST_MakePoint(${longitude}, ${latitude}),
            4326
          )
          WHERE id = ${product.id}
        `;
        this.logger.debug(`PostGIS location set for product ${product.id}`);
      } catch (error) {
        this.logger.warn(`Failed to set PostGIS location for product: ${error.message}`);
      }
    }

    // Verificar si es peligroso
    const isDangerous = await this.moderationService.detectDangerousProductById(
      product.id,
    );
    if (isDangerous) {
      // Cambiar estado y recargar el producto actualizado
      product = await this.changeStatus(product.id, ProductStatus.REPORTED);
    }

    return product; // Ahora devuelve el producto con estado correcto
  }

  async findAll(userId?: string) {
    const products = await this.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      include: {
        images: true,
      },
    });

    // Si hay userId, obtener los likes del usuario
    const productsWithLikes = await Promise.all(
      products.map(async (product) => {
        const likesCount = await this.likes.count({
          where: { productId: product.id },
        });

        let hasLiked = false;
        if (userId) {
          const userLike = await this.likes.findUnique({
            where: {
              userId_productId: {
                userId,
                productId: product.id,
              },
            },
          });
          hasLiked = !!userLike;
        }

        return {
          ...product,
          hasLiked,
          likesCount,
        };
      }),
    );

    return productsWithLikes;
  }

  async findOne(id: number, userId?: string) {
    const product = await this.product.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!product)
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);

    // Obtener conteo total de likes
    const likesCount = await this.likes.count({ where: { productId: id } });

    // Verificar si el usuario actual ya dio like
    let hasLiked = false;
    if (userId) {
      const userLike = await this.likes.findUnique({
        where: {
          userId_productId: {
            userId,
            productId: product.id,
          },
        },
      });
      hasLiked = !!userLike;
    }

    return {
      ...product,
      hasLiked,
      likesCount,
    };
  }

  async findAllByUser(userId: string) {
    return this.product.findMany({
      where: {
        userId: userId,
        status: { not: ProductStatus.DELETED },
      },
      include: {
        images: true,
        incidents: {
          select: {
            id: true,
            comment: true,
            status: true,
          },
          where: {
            status: {
              in: ['PENDING', 'APPEALED', 'ACCEPTED', 'REJECTED'],
            },
          },
        },
      },
      orderBy: { publishDate: 'desc' },
    });
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    files?: Express.Multer.File[],
    currentUserId?: string, // id del usuario logueado, pasado desde el controlador
  ) {
    // Traer el producto
    const product = await this.product.findUnique({ where: { id } });
    if (!product)
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);

    // Verificar que el usuario logueado sea dueño
    if (product.userId !== currentUserId) {
      throw new HttpException(
        'You cannot modify a product you do not own',
        HttpStatus.FORBIDDEN,
      );
    }

    // Verificar estado
    if (
      product.status === ProductStatus.REPORTED ||
      product.status === ProductStatus.DELETED
    ) {
      throw new HttpException(
        `Cannot update a product with status ${product.status}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const { imagesToRemove, ...productData } = updateProductDto;

    // eliminar imágenes
    if (imagesToRemove && imagesToRemove.length > 0) {
      const images = await this.productImage.findMany({
        where: { id: { in: imagesToRemove }, productId: id },
      });

      await Promise.all(
        images.map((img) => this.imagesService.deleteImage(img.url)),
      );

      await this.productImage.deleteMany({
        where: { id: { in: imagesToRemove }, productId: id },
      });
    }

    // subir nuevas imágenes
    let imagesData: any[] = [];
    if (files && files.length > 0) {
      const uploadedImages = await Promise.all(
        files.map((file) => this.imagesService.uploadImage(file)),
      );
      imagesData = uploadedImages.map((img) => ({ url: img.secure_url }));
    }

    const data: any = { ...productData };
    if (imagesData.length > 0) {
      data.images = { create: imagesData };
    }

    // Use provided coordinates or fallback to geocoding
    if (updateProductDto.latitude && updateProductDto.longitude) {
      // Coordinates provided from frontend - use directly!
      data.latitude = updateProductDto.latitude;
      data.longitude = updateProductDto.longitude;
      data.address = updateProductDto.address;
      if (updateProductDto.addressType) data.addressType = updateProductDto.addressType;
      this.logger.debug(`Using provided coordinates for product update (lat: ${updateProductDto.latitude}, lng: ${updateProductDto.longitude})`);
    } else if (updateProductDto.address && updateProductDto.address !== product.address) {
      // Fallback: geocode if address changed but no coordinates
      try {
        const geocoded = await this.nominatim.geocodeAddress(updateProductDto.address);
        data.address = geocoded.address;
        data.latitude = geocoded.latitude;
        data.longitude = geocoded.longitude;
        data.addressType = geocoded.type;
        this.logger.debug(`Product address re-geocoded (fallback): ${geocoded.address}`);
      } catch (error) {
        this.logger.warn(`Failed to re-geocode product address: ${error.message}`);
        // Continue with update without re-geocoding
      }
    }

    // actualizar producto
    let updatedProduct = await this.product.update({
      where: { id },
      data,
      include: { images: true },
    });

    // Update PostGIS location if coordinates were updated
    if (data.latitude && data.longitude) {
      try {
        await this.$executeRaw`
          UPDATE "Product"
          SET location = ST_SetSRID(
            ST_MakePoint(${data.longitude}, ${data.latitude}),
            4326
          )
          WHERE id = ${id}
        `;
        this.logger.debug(`PostGIS location updated for product ${id}`);
      } catch (error) {
        this.logger.warn(`Failed to update PostGIS location for product: ${error.message}`);
      }
    }

    // verificar contenido peligroso
    const isDangerous =
      await this.moderationService.detectDangerousProductById(id);
    if (isDangerous) {
      updatedProduct = await this.changeStatus(id, ProductStatus.REPORTED);
    }

    return updatedProduct;
  }

  // Soft delete
  async remove(id: number, currentUserId?: string) {
    // Traer el producto
    const product = await this.product.findUnique({ where: { id } });
    if (!product)
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);

    // Verificar que el usuario logueado sea dueño
    if (product.userId !== currentUserId) {
      throw new HttpException(
        'You cannot modify a product you do not own',
        HttpStatus.FORBIDDEN,
      );
    }

    if (product.status === ProductStatus.REPORTED || product.status === ProductStatus.SUSPENDED) {
      throw new HttpException(
        `Cannot delete a product with status ${product.status}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.product.update({
      where: { id },
      data: { status: ProductStatus.DELETED, deletedAt: new Date() },
    });
  }

  async changeStatus(id: number, status: ProductStatus) {
    return this.product.update({
      where: { id },
      data: { status },
      include: {
        images: true,
        incidents: {
          select: {
            id: true,
            comment: true,
            status: true,
          },
        },
      },
    });
  }

  async findByStatus(status: ProductStatus) {
    return this.product.findMany({
      where: { status },
      include: { images: true },
    });
  }

  // Toggle like: si existe lo elimina, si no existe lo crea
  async toggleLike(productId: number, userId: string) {
    // Verificar que el producto existe y está activo
    const product = await this.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    if (product.status !== ProductStatus.ACTIVE) {
      throw new HttpException(
        'Cannot like a non-active product',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Buscar si ya existe el like
    const existingLike = await this.likes.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingLike) {
      // Si existe, eliminarlo (unlike)
      await this.likes.delete({
        where: { id: existingLike.id },
      });
      return { message: 'Like removed', liked: false };
    } else {
      // Si no existe, crearlo (like)
      await this.likes.create({
        data: {
          userId,
          productId,
        },
      });
      return { message: 'Like added', liked: true };
    }
  }

  // Obtener conteo de likes de un producto
  async getLikesCount(productId: number) {
    return this.likes.count({
      where: { productId },
    });
  }

  async findProductsNearUser(userId: string, radiusKm: number = 10) {
    // Validate radius
    if (radiusKm <= 0 || radiusKm > 100) {
      throw new HttpException(
        'Radius must be between 0 and 100 kilometers',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Get user's location
    const user = await this.user.findUnique({
      where: { id: userId },
      select: { latitude: true, longitude: true },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.latitude || !user.longitude) {
      throw new HttpException(
        'User does not have a location set. Please update your address in your profile.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Convert radius to meters for PostGIS
    const radiusMeters = radiusKm * 1000;

    // Query products within radius using PostGIS ST_DWithin
    // Using raw query to calculate distance and filter by radius
    const products = await this.$queryRaw<any[]>`
      SELECT
        p.id,
        p.code,
        p.name,
        p.description,
        p.price,
        p.availability,
        p.type,
        p.status,
        p.category,
        p.address,
        p.latitude,
        p.longitude,
        p."serviceHours", 
        p."userId",
        ST_Distance(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${user.longitude}, ${user.latitude}), 4326)::geography
        ) / 1000 AS distance_km
      FROM "Product" p
      WHERE
        p.status = 'ACTIVE'
        AND p.location IS NOT NULL
        AND ST_DWithin(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${user.longitude}, ${user.latitude}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY distance_km ASC
    `;

    // Fetch images and likes for each product
    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        const images = await this.productImage.findMany({
          where: { productId: product.id },
        });

        const likesCount = await this.likes.count({
          where: { productId: product.id },
        });

        const userLike = await this.likes.findUnique({
          where: {
            userId_productId: {
              userId,
              productId: product.id,
            },
          },
        });

        return {
          ...product,
          images,
          likesCount,
          hasLiked: !!userLike,
          distance_km: parseFloat(product.distance_km.toFixed(2)), // Round to 2 decimals
        };
      }),
    );

    return productsWithDetails;
  }
}
