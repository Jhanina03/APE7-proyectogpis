import { Test, TestingModule } from '@nestjs/testing';
import { ImagesService } from './images.service';
import { HttpException } from '@nestjs/common';
import cloudinary from './cloudinary.config';

jest.mock('./cloudinary.config');

describe('ImagesService', () => {
  let service: ImagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImagesService],
    }).compile();

    service = module.get<ImagesService>(ImagesService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      const buffer = Buffer.from('test');
      const file = { buffer } as Express.Multer.File;

      const mockResult = { secure_url: 'http://cloudinary.com/test.jpg' };
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockResult);
          return { end: jest.fn() };
        }
      );

      const result = await service.uploadImage(file);
      expect(result).toEqual(mockResult);
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalled();
    });

    it('should throw error if file not provided', async () => {
      await expect(service.uploadImage(null as unknown as Express.Multer.File)).rejects.toThrow(HttpException);
    });

    it('should throw error if cloudinary fails', async () => {
      const buffer = Buffer.from('test');
      const file = { buffer } as Express.Multer.File;

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(new Error('Upload failed'), null);
          return { end: jest.fn() };
        }
      );

      await expect(service.uploadImage(file)).rejects.toThrow('Upload failed');
    });
  });

  describe('listImages', () => {
    it('should list images successfully', async () => {
      const mockResources = [
        { secure_url: 'url1' },
        { secure_url: 'url2' },
      ];
      (cloudinary.api.resources as jest.Mock).mockResolvedValue({
        resources: mockResources,
      });

      const result = await service.listImages();
      expect(result).toEqual(['url1', 'url2']);
    });

    it('should throw error if list fails', async () => {
      (cloudinary.api.resources as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(service.listImages()).rejects.toThrow('Failed to list images');
    });
  });

  describe('getImage', () => {
    it('should get image successfully', async () => {
      const publicId = 'abc123';
      (cloudinary.api.resource as jest.Mock).mockResolvedValue({
        secure_url: 'http://cloudinary.com/test.jpg',
      });

      const result = await service.getImage(publicId);
      expect(result).toBe('http://cloudinary.com/test.jpg');
    });

    it('should throw error if image not found', async () => {
      (cloudinary.api.resource as jest.Mock).mockRejectedValue(new Error('not found'));
      await expect(service.getImage('abc123')).rejects.toThrow('Image not found');
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });
      await expect(service.deleteImage('abc123')).resolves.toBeUndefined();
    });

    it('should handle not found as success', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'not found' });
      await expect(service.deleteImage('abc123')).resolves.toBeUndefined();
    });

    it('should throw error if deletion fails', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'error' });
      await expect(service.deleteImage('abc123')).rejects.toThrow('Failed to delete image');
    });

    it('should throw error if cloudinary throws', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(service.deleteImage('abc123')).rejects.toThrow('fail');
    });
  });
});
