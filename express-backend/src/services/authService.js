"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upgradeToAdmin = exports.authenticate = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../config/db"));
const jwt_1 = require("../utils/jwt");
const register = async (data) => {
    const existing = await db_1.default.user.findUnique({ where: { email: data.email } });
    if (existing)
        throw new Error("Email already registered");
    const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
    const user = await db_1.default.user.create({
        data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: hashedPassword,
            role: "USER"
        }
    });
    return { message: "User registered successfully", userId: user.id };
};
exports.register = register;
const authenticate = async (data) => {
    const user = await db_1.default.user.findUnique({ where: { email: data.email } });
    if (!user)
        throw new Error("Invalid credentials");
    const isValid = await bcryptjs_1.default.compare(data.password, user.password);
    if (!isValid)
        throw new Error("Invalid credentials");
    const token = (0, jwt_1.generateToken)({ email: user.email, role: user.role });
    return {
        token,
        userId: user.id,
        name: user.name,
        role: user.role
    }; // Maps exact Java AuthResponseDto
};
exports.authenticate = authenticate;
const upgradeToAdmin = async (email) => {
    const user = await db_1.default.user.update({
        where: { email },
        data: { role: "ADMIN" }
    });
    return `User ${email} upgraded to ADMIN`;
};
exports.upgradeToAdmin = upgradeToAdmin;
//# sourceMappingURL=authService.js.map