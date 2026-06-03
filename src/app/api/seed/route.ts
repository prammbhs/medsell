import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Clean delete all users first
    console.log('Deleting existing users...');
    await db.delete(users);

    const passwordHash = await bcrypt.hash('admin123', 10);
    console.log('Seeding admin user...');
    await db.insert(users).values({
      email: 'admin@example.com',
      passwordHash,
      role: 'ADMIN',
    });

    const sellerHash = await bcrypt.hash('seller123', 10);
    console.log('Seeding seller user...');
    await db.insert(users).values({
      email: 'seller@example.com',
      passwordHash: sellerHash,
      role: 'SELLER',
    });

    const buyerHash = await bcrypt.hash('buyer123', 10);
    console.log('Seeding buyer user...');
    await db.insert(users).values({
      email: 'buyer@example.com',
      passwordHash: buyerHash,
      role: 'BUYER',
    });

    return NextResponse.json({ message: 'Seeded admin, seller, and buyer successfully' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Seeding failed' }, { status: 500 });
  }
}
