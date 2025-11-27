import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import cloudinary from './cloudinary.config';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class ImagesService {

    async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
        if (!file) throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);

        return new Promise<UploadApiResponse>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: 'products' },
                (error, result) => {
                    if (error) {
                        reject(new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR));
                    } else if (!result) {
                        reject(new HttpException('No result from Cloudinary', HttpStatus.INTERNAL_SERVER_ERROR));
                    } else {
                        resolve(result);
                    }
                },
            ).end(file.buffer);
        });
        ;
    }

    async listImages(): Promise<string[]> {
        try {
            const result = await cloudinary.api.resources();
            return result.resources.map(r => r.secure_url);
        } catch (error) {
            throw new HttpException('Failed to list images', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getImage(publicId: string): Promise<string> {
        try {
            const result = await cloudinary.api.resource(publicId);
            return result.secure_url;
        } catch (error) {
            throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
        }
    }

    async deleteImage(publicId: string): Promise<void> {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            if (result.result !== 'ok' && result.result !== 'not found') {
                throw new HttpException('Failed to delete image', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
