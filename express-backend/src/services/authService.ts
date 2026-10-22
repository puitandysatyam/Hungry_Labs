import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { generateToken } from '../utils/jwt';

export const register = async (data: any) => {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error("Email already registered");

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: hashedPassword,
            role: "USER"
        }
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return {
        message: "User registered successfully",
        token,
        userId: user.id,
        name: user.name,
        role: user.role
    };
};

export const authenticate = async (data: any) => {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new Error("Invalid credentials");

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) throw new Error("Invalid credentials");

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return {
        token,
        userId: user.id,
        name: user.name,
        role: user.role
    }; // Maps exact Java AuthResponseDto
};
