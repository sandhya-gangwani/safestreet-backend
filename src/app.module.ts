// src/app.module.ts
/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/user.entity';
import { Department } from './departments/department.entity';
import { Incident } from './incidents/incident.entity';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/user.module';
import { DepartmentsModule } from './departments/department.module';
import { IncidentsModule } from './incidents/incident.module';
import { NotificationsModule } from './notifications/notifications.module';
import { IncidentGateway } from './websocket/websocket.gateway';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get('DB_HOST'),
                port: configService.get('DB_PORT'),
                username: configService.get('DB_USER'),
                password: configService.get('DB_PASSWORD'),
                database: configService.get('DB_NAME'),
                entities: [User, Department, Incident],
                synchronize: true,
                logging: true,
            }),
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([User, Department, Incident]),
        
        AuthModule,
        UsersModule,
        DepartmentsModule,
        IncidentsModule,
        NotificationsModule,
        AiModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        IncidentGateway,  //  Gateway registered once here
    ],
    exports: [IncidentGateway],  // Export so other modules can use it
})
export class AppModule {}