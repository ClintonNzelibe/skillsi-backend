import { Request, Response } from "express";
import Category from "../models/Category.js";
import { StatusCodes } from "http-status-codes";

const createCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, description } = req.body;
    const adminId = req.admin?.adminId;

    const existing = await Category.findOne({
      name: name.toLowerCase().trim(),
    });
    if (existing) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Category already exists" });
    }

    const category = await Category.create({
      name,
      description,
      admin: adminId,
    });
    res.status(StatusCodes.CREATED).json({ success: true, category });
  } catch (error) {
    console.error("Error creating category:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const editCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if another category already has this name
    const existingCategory = await Category.findOne({
      _id: { $ne: id },
      name: name.trim(),
    }).collation({ locale: "en", strength: 2 });

    if (existingCategory) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Another category with this name already exists",
      });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name: name.trim(), description },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error: any) {
    console.error("Error updating category:", error);
    // Handle unique index error from MongoDB
    if (error.code === 11000) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Category name already exists",
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const fetchCategories = async (req: Request, res: Response): Promise<any> => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 }); // newest first
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Categories fetched successfully",
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export { createCategory, editCategory, fetchCategories };
