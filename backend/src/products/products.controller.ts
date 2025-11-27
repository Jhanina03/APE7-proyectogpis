import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFiles, UseInterceptors, ParseEnumPipe, BadRequestException, UseGuards, Request, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductStatus, Role, User } from '@prisma/client';
import { ChangeStatusDto } from './dto/change-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT', 'ADMIN', 'MODERATOR')
  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  create(@Body() createProductDto: CreateProductDto, @UploadedFiles() files: Express.Multer.File[], @Request() req) {
    return this.productsService.create(createProductDto, files, req.user.id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT', 'MODERATOR', 'ADMIN')
  @Get()
  findAll(@Request() req) {
    // Pasar el userId si existe para incluir info de likes
    return this.productsService.findAll(req.user?.id);
  }

  // Get products near the authenticated user's location
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT', 'MODERATOR', 'ADMIN')
  @Get('nearby')
  findNearby(@Request() req, @Query('radius') radius?: string) {
    const radiusKm = radius ? parseFloat(radius) : 10; // Default 10km
    return this.productsService.findProductsNearUser(req.user.id, radiusKm);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT', 'MODERATOR', 'ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.productsService.findOne(+id, req.user?.id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT', 'ADMIN', 'MODERATOR')
  @Get('user/:userId')
  findByClient(@Param('userId') userId: string) {
    return this.productsService.findAllByUser(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT', 'ADMIN', 'MODERATOR')
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images'))
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    return this.productsService.update(+id, updateProductDto, files, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT', 'ADMIN', 'MODERATOR')
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.productsService.remove(+id, req.user.id);
  }

  ///// Los siguientes endpoints son para los moderadores debe estar protegido por guard

  // Actualizar producto basados en su status
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MODERATOR', 'ADMIN')
  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.productsService.changeStatus(+id, dto.status);
  }

  // Ver producos por su status
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MODERATOR', 'ADMIN')
  @Get('status/:status')
  findByStatus(
    @Param('status', new ParseEnumPipe(ProductStatus, {
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException(`El status solo puede ser: ${Object.values(ProductStatus).join(', ')}`),
    })) status: ProductStatus
  ) {
    return this.productsService.findByStatus(status);
  }

  // Toggle like en un producto (dar/quitar like)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT', 'MODERATOR', 'ADMIN')
  @Post(':id/like')
  toggleLike(@Param('id') id: string, @Request() req) {
    return this.productsService.toggleLike(+id, req.user.id);
  }

  // Obtener conteo de likes de un producto
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT', 'MODERATOR', 'ADMIN')
  @Get(':id/likes-count')
  getLikesCount(@Param('id') id: string) {
    return this.productsService.getLikesCount(+id);
  }
}
