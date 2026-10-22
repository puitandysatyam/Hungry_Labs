import prisma from '../src/config/db';

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error("Usage: npx tsx scripts/make-admin.ts <user-email>");
        process.exit(1);
    }

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' }
        });
        console.log(`Success! User ${user.email} (ID: ${user.id}) is now an ADMIN.`);
    } catch (e: any) {
        console.error(`Failed to update user role for ${email}:`, e.message || e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
