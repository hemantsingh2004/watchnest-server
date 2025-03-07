import express, { Request, Response, NextFunction } from "express";

const router = express.Router();

router.all("/", (req: Request, res: Response, next: NextFunction) => {
  next();
});

router.post("/", () => {}); //To create lists

router.put("/updatePrivacy/:listId"); //To update list's privacy

router.post("/updateItems/:listId?type"); //To update list's items (add or remove)

router.put("/updateItem/:listId"); //To update list's item details

export default router;
