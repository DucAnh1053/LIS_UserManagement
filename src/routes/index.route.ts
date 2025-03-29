import { Router, Request, Response } from "express";

import accessHistoryMiddleware from "../middleware/access_log.middleware";

import authRouter from "./auth.route";
import accessHistoryRouter from "./access-history.route";
import permissionRouter from "./permission.route";
import roleRouter from "./role.route";
import userRouter from "./user.route";

const rootRouter: Router = Router();

// Root route
rootRouter.get(
    "/",
    [accessHistoryMiddleware],
    (req: Request, res: Response) => {
        res.json({
            message: "Hello World! This is the root route of the application.",
        });
    }
);

// Protected routes (require authentication)

rootRouter.use("/access-history", accessHistoryRouter);
rootRouter.use("/auth", authRouter);
rootRouter.use("/permissions", permissionRouter);
rootRouter.use("/roles", roleRouter);
rootRouter.use("/users", userRouter);

export default rootRouter;
