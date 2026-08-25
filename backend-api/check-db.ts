import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AuthService } from './src/modules/auth/auth.service';
import * as admin from 'firebase-admin';

async function main() {
  console.log('Firebase App status:');
  console.log('admin.apps.length:', admin.apps.length);
  if (admin.apps.length > 0) {
    admin.apps.forEach(app => {
      console.log('App name:', app?.name);
      console.log('Options:', app?.options);
    });
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);

  console.log('AuthService instance loaded');
  
  // Test verifyToken with a simple invalid token to see if it throws Firebase error or another error
  try {
    console.log('Testing verifyToken with dummy token...');
    await authService.verifyToken('dummy-invalid-token');
  } catch (err: any) {
    console.log('Caught expected error:');
    console.log('Error Name:', err.name);
    console.log('Error Message:', err.message);
    console.log('Error Code:', err.code);
    console.log('Error Stack:', err.stack);
  }

  await app.close();
}

main().catch(console.error);
