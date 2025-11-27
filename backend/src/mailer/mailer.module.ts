import { Module, Global } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import * as path from 'path';

import { MailerService } from './mailer.service';

@Global()
@Module({
    imports: [
        NestMailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                transport: {
                    host: 'smtp-relay.sendinblue.com',
                    port: 587,
                    secure: false,
                    tls: {
                        rejectUnauthorized: false,
                    },
                    auth: {
                        user: configService.get<string>('SMTP_USER'),
                        pass: configService.get<string>('SMTP_PASS'),
                    },
                },
                defaults: {
                    from: `"Auth Service" <${configService.get<string>('SENDER_EMAIL')}>`,
                },
                template: {
                    // Plantillas fuera del módulo mailer
                    dir: path.join(__dirname, '..', 'templates'),
                    adapter: new HandlebarsAdapter(),
                    options: { strict: true },
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [MailerService],
    exports: [MailerService],
})
export class MailerModule { }
