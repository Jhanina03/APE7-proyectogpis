import { Injectable, HttpException, HttpStatus, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { PrismaClient, IncidentStatus, Product, ProductStatus } from '@prisma/client';
import { CreateReportDto } from './dto/create-report.dto';
import Filter from 'bad-words-next';
import { ProductsService } from '../products/products.service';



@Injectable()
export class ModerationService extends PrismaClient implements OnModuleInit {
  private filter: any;
  private bannedWords: string[];
  constructor(
    @Inject(forwardRef(() => ProductsService))
    private productService: ProductsService,
  ) {
    super();
  }


  async onModuleInit() {
    await this.$connect();
    // console.log('ModerationService connected to the database');
    this.filter = new Filter();

    this.bannedWords = ['weapon', 'explosive', 'drug', 'illegal', 'fraud', 'poison'];
  }

  async createReport(dto: CreateReportDto) {
    const incident = await this.incident.create({
      data: {
        productId: dto.productId,
        type: dto.type,
        comment: dto.comment,
        reporterId: dto.reporterId,
        status: IncidentStatus.PENDING,
        createdAt: new Date(),
      },
    });

    const productChanged = await this.productService.changeStatus(dto.productId, ProductStatus.REPORTED);
    if (!productChanged) {
      throw new HttpException('Failed to change product status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return incident;
  }

  async changeIncidentStatus(id: number, status: IncidentStatus) {
    const incident = await this.incident.findUnique({ where: { id } });
    if (!incident) throw new HttpException('Incident not found', HttpStatus.NOT_FOUND);

    return this.incident.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
  }

  async assignModerator(incidentId: number, moderatorId: string) {
    const incident = await this.incident.findUnique({
      where: { id: incidentId },
      include: { moderator: true, appealModerator: true }
    });

    if (!incident) throw new HttpException('Incident not found', HttpStatus.NOT_FOUND);

    const moderator = await this.user.findUnique({ where: { id: moderatorId } });
    if (!moderator) {
      throw new HttpException('Moderator not Found', HttpStatus.BAD_REQUEST);
    }

    if (incident.status === IncidentStatus.APPEALED) {
      if (incident.moderatorId === moderatorId) {
        throw new HttpException('Original moderator cannot handle the appeal', HttpStatus.BAD_REQUEST);
      }
      if (incident.appealModeratorId) {
        throw new HttpException('Appeal already assigned to a moderator', HttpStatus.BAD_REQUEST);
      }

      return this.incident.update({
        where: { id: incidentId },
        data: { appealModeratorId: moderatorId, updatedAt: new Date() },
      });
    }

    if (incident.status === IncidentStatus.PENDING) {
      if (incident.moderatorId) {
        throw new HttpException('Incident already assigned to a moderator', HttpStatus.BAD_REQUEST);
      }

      return this.incident.update({
        where: { id: incidentId },
        data: { moderatorId, updatedAt: new Date() },
      });
    }

    throw new HttpException('Incident not in a valid state for assignment', HttpStatus.BAD_REQUEST);
  }


  async findByStatus(status: IncidentStatus) {
    return this.incident.findMany({
      where: { status },
      include: { product: true, moderator: true },
    });
  }

  async findAllIncidents() {
    return this.incident.findMany({
      include: {
        product: {
          include: {
            images: true,
            user: true,
          },
        },
        moderator: true,
        appealModerator: true,
        reporter: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }


  async manageAppeal(id: number, reason: string) {
    const incident = await this.incident.findUnique({ where: { id } });
    if (!incident) throw new HttpException('Incident not found', HttpStatus.NOT_FOUND);
    const product = await this.product.findUnique({ where: { id: incident.productId } });
    if (!product) throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    // if (incident.status !== IncidentStatus.ACCEPTED) {
    //   throw new HttpException(
    //     `Cannot appeal an incident with status ${incident.status}`,
    //     HttpStatus.BAD_REQUEST
    //   );
    // }
    if (product.status !== ProductStatus.SUSPENDED) {
      throw new HttpException('Cannot appeal: Product is not suspended', HttpStatus.BAD_REQUEST);
    }
    if (incident.appealReason) {
      throw new HttpException('Appeal already submitted', HttpStatus.BAD_REQUEST);
    }
    return this.incident.update({
      where: { id },
      data: {
        status: IncidentStatus.APPEALED,
        appealReason: reason,
        updatedAt: new Date(),
      },
    });
  }


  async resolveIncident(id: number, finalStatus: IncidentStatus, appealModeratorId?: string) {
    const incident = await this.incident.findUnique({
      where: { id },
      include: { product: true },
    });
    if (!incident) throw new HttpException('Incident not found', HttpStatus.NOT_FOUND);

    let newProductStatus: ProductStatus | null = null;
    if (finalStatus === IncidentStatus.ACCEPTED) {
      if (!incident.appealModeratorId) {
        newProductStatus = ProductStatus.SUSPENDED;
      } else {
        newProductStatus = ProductStatus.BANNED;
      }

    } else if (finalStatus === IncidentStatus.REJECTED) {
      newProductStatus = ProductStatus.ACTIVE;
    }

    if (newProductStatus && incident.productId) {
      await this.productService.changeStatus(incident.productId, newProductStatus);
    }

    return this.incident.update({
      where: { id },
      data: { status: finalStatus, updatedAt: new Date(), appealModeratorId },
    });
  }

  async detectDangerousProducts(): Promise<Product[]> {
    const products = await this.product.findMany({ where: { status: 'ACTIVE' } });
    const dangerousProducts: Product[] = [];

    for (const product of products) {
      const text = (product.name + ' ' + product.description).toLowerCase();

      const hasBannedWord = this.bannedWords.some(word => text.includes(word));
      const hasProfanity = this.filter.check(text);

      if (hasBannedWord || hasProfanity) {
        dangerousProducts.push(product);

        try {
          await this.incident.create({
            data: {
              productId: product.id,
              type: 'DANGEROUS',
              comment: 'Detected automatically as dangerous/offensive',
              status: IncidentStatus.PENDING,
              reporterId: '0',
              createdAt: new Date(),
            },
          });
        } catch (err) {
          console.error(`Error creating incident for product ${product.id}:`, err);
        }
      }
    }

    return dangerousProducts;
  }

  async detectDangerousProductById(productId: number): Promise<boolean> {
    const product = await this.product.findUnique({ where: { id: productId } });
    if (!product) throw new HttpException('Product not found', HttpStatus.NOT_FOUND);

    const text = (product.name + ' ' + product.description).toLowerCase();

    const hasBannedWord = this.bannedWords.some(word => text.includes(word));
    const hasProfanity = this.filter.check(text);

    if (hasBannedWord || hasProfanity) {
      try {
        await this.incident.create({
          data: {
            productId: product.id,
            type: 'DANGEROUS',
            comment: 'Detected automatically as dangerous/offensive',
            status: IncidentStatus.PENDING,
            reporterId: '0',
            createdAt: new Date(),
          },
        });
      } catch (err) {
        console.error(`Error creating incident for product ${product.id}:`, err);
      }
      return true; // Producto detectado como peligroso
    }

    return false; // Producto seguro
  }
}
