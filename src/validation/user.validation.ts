import { Types } from "mongoose";

import {
    object,
    string,
    array,
    coerce,
    boolean,
    nativeEnum,
} from "zod";

import { Gender } from "../enums/gender.enum";

import { FindQuerySchema } from "./find-query.validation";

export const CreateUserSchema = object({
    username: string({ required_error: "Tên tài khoản là bắt buộc!" }),
    password: string({ required_error: "Mật khẩu là bắt buộc!" }).min(
        6,
        "Mật khẩu phải có ít nhất 6 ký tự!"
    ),
    roles: array(string()).min(1, "Ít nhất một vai trò!"),
    detail_user: object({
        user_code: string({ required_error: "Mã tài khoản là bắt buộc!" }),
        name: string({ required_error: "Tên là bắt buộc!" }),
        dob: coerce.date({ required_error: "Ngày sinh là bắt buộc!" }),
        address: string().optional(),
        gender: nativeEnum(Gender, { required_error: "Giới tính là bắt buộc!" }),
        avatar: string().optional(),
    }),
});

export const UpdateUserSchema = object({
    password: string()
        .min(6, "Mật khẩu phải có ít nhất 6 ký tự!")
        .optional(),
    roles: array(string()).min(1, "Ít nhất một vai trò!").optional(),
    detail_user: object({
        user_code: string().optional(),
        name: string().optional(),
        dob: coerce.date().optional(),
        address: string().optional(),
        gender: nativeEnum(Gender).optional(),
        avatar: string().optional(),
    }).optional(),
});

export const ChangeUserStatusSchema = object({
    status: boolean({ required_error: "Trạng thái là bắt buộc!" }),
});

export const ChangeManyUserStatusSchema = object({
    userIds: array(string()).min(1, "Ít nhất một người dùng!"),
    status: boolean({ required_error: "Trạng thái là bắt buộc!" }),
});

export const FindUserQuerySchema = FindQuerySchema.extend({
    roles: string()
        .optional()
        .transform((val) =>
            val ? val.split(",").map((item) => item.trim()) : undefined
        )
        .refine(
            (val) =>
                val === undefined ||
                val.every((roleId) => Types.ObjectId.isValid(roleId)),
            {
                message: "Mã vai trò không hợp lệ!",
            }
        ),
    status: string()
        .optional()
        .transform((val) => {
            if (val) {
                if (val.toLowerCase() === "true") return true;
                if (val.toLowerCase() === "false") return false;
            }
        }),
});