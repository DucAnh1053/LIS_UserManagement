import readline from "readline";
import * as fs from "fs";
import csv from "csv-parser";
import bcrypt from "bcryptjs";

import { connectToDB } from "../config/mongoose";

import { Permissions } from "../enums/permissions.enum";

import { PermissionRepository } from "../repositories/permission.repository";
import { RoleRepository } from "../repositories/role.repository";
import { UserRepository } from "../repositories/user.repository";
// Các icon hiển thị trên console
const ICONS = {
    success: "✅",
    info: "ℹ️",
    error: "❌",
    question: "❓",
};

// Các repository
const permissionRepository = new PermissionRepository();
const roleRepository = new RoleRepository();
const userRepository = new UserRepository();

// Hàm hỏi Yes/No
const askQuestion = (question: string): Promise<boolean> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(`${ICONS.question} ${question} (y/n): `, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === "y");
        });
    });
};

// Thêm các Permission
const addPermissions = async () => {
    const add = await askQuestion("Do you want to add Permissions?");
    if (!add) {
        console.log(`${ICONS.info} Skipped adding Permissions.`);
        return;
    }

    const permissions = Object.values(Permissions).map((permission) => ({
        name: permission,
        description: `Description for ${permission}`,
    }));

    for (const permission of permissions) {
        try {
            await permissionRepository.create(permission);
        } catch (err) {
            console.log(
                `${ICONS.info} Permission '${permission.name}' already exists.`
            );
        }
    }
    console.log(`${ICONS.success} Permissions added or verified successfully.`);
};

// Tạo các Role
const addRoles = async () => {
    const add = await askQuestion("Do you want to add Roles?");
    if (!add) {
        console.log(`${ICONS.info} Skipped adding Roles.`);
        return;
    }

    const allPermissions = await permissionRepository.findAll();
    const permissionsMap = Object.fromEntries(
        allPermissions.map((perm) => [perm.name, perm])
    );

    const roles = [
        {
            name: "Admin",
            permissions: [],
            description: "Admin có tất cả các quyền trong hệ thống.",
            grant_all: true,
        },
        {
            name: "User",
            permissions: [
                // Một vài quyền mẫu cho User
                permissionsMap[Permissions.LIST_ALL_PERMISSIONS]._id,
                permissionsMap[Permissions.LIST_ALL_ROLES]._id,
                permissionsMap[Permissions.LIST_ALL_USERS]._id,
            ],
            description: "Quyền người dùng",
            grant_all: false,
        },
    ];

    for (const role of roles) {
        try {
            await roleRepository.create(role);
        } catch (err) {
            console.log(`${ICONS.info} Role '${role.name}' already exists.`);
        }
    }
    console.log(`${ICONS.success} Roles added successfully.`);
};

// Tạo các User
const addUsers = async () => {
    const add = await askQuestion("Do you want to add Users?");
    if (!add) {
        console.log(`${ICONS.info} Skipped adding Users.`);
        return;
    }

    const roles = await roleRepository.findAll();
    const roleMap = Object.fromEntries(roles.map((role) => [role.name, role]));

    const users = [
        {
            username: "admin",
            password: "123456",
            roles: [roleMap["Admin"]._id],
            detail_user: {
                user_code: "ADMIN001",
                name: "Admin User",
                dob: new Date("1980-01-01"),
                address: "Admin Address",
                gender: 1,
            },
        },
        {
            username: "user",
            password: "123456",
            roles: [roleMap["User"]._id],
            detail_user: {
                user_code: "USER001",
                name: "User",
                dob: new Date("1985-02-02"),
                address: "User Address",
                gender: 2,
            },
        },
    ];

    for (const user of users) {
        try {
            const existingUser = await userRepository.findUserByUsername(
                user.username
            );
            if (existingUser) {
                console.log(
                    `${ICONS.info} User '${user.username}' already exists.`
                );
                continue;
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(user.password, salt);
            user.password = hashedPassword;

            await userRepository.create(user);
            console.log(
                `${ICONS.success} User '${user.username}' added successfully.`
            );
        } catch (err: any) {
            console.error(
                `${ICONS.error} Error adding user '${user.username}':`,
                err.message
            );
        }
    }
};

// Update the main function to include the new functions
const main = async () => {
    await connectToDB();
    await addPermissions();
    await addRoles();
    await addUsers();

    console.log(`${ICONS.success} Setup completed.`);
    process.exit(0);
};

main().catch((err) => {
    console.error(`${ICONS.error} Error in setup:`, err.message);
    process.exit(1);
});
