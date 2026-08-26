export declare const register: (data: any) => Promise<{
    message: string;
    userId: number;
}>;
export declare const authenticate: (data: any) => Promise<{
    token: string;
    userId: number;
    name: string | null;
    role: string;
}>;
export declare const upgradeToAdmin: (email: string) => Promise<string>;
//# sourceMappingURL=authService.d.ts.map