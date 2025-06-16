const { default: mongoose } = require("mongoose");
const Page = require("../models/Pages");

// @desc    Create a new page
// @route   POST /api/pages
// @access  Private/Admin
const createPage = async (req, res, next) => {
  try {
    const { title, description, type, seoDescription } = req.body;

    // Check if page with title already exists
    const existingPage = await Page.findOne({ type });
    if (existingPage) {
      return res.status(400).json({
        success: false,
        message: "Page with this title already exists",
        error: {
          code: "DUPLICATE_TITLE",
          details: `A page with title '${title}' already exists`,
        },
      });
    }

    const page = await Page.create({
      title,
      description,
      type,
      seoDescription: seoDescription || description?.substring(0, 160),
    });

    res.status(201).json({
      success: true,
      data: page,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pages
// @route   GET /api/pages
// @access  Public
const getPages = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const filter = {};

    if (isActive === "true" || isActive === "false") {
      filter.isActive = isActive === "true";
    }

    const pages = await Page.find(filter).sort({ title: 1 });

    res.status(200).json({
      success: true,
      count: pages.length,
      data: pages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single page by ID or slug
// @route   GET /api/pages/:identifier
// @access  Public
const getPage = async (req, res, next) => {
  try {
    const { type } = req.params;

    const page = await Page.findOne({ type: type });

    if (!page) {
       return res.status(400).json({
        success: false,
        message: "Page is not found",
        error: {
          code: "PAGE_NOT_FOUND",
          details: `No page found with type '${type}'`,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: page,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update page
// @route   PUT /api/pages/:id
// @access  Private/Admin
const updatePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, type, seoDescription, isActive } = req.body;

    const page = await Page.findById(id);
    if (!page) {
      throw new NotFoundError("Page not found");
    }

    // Prevent title change if it would create a duplicate
    if (title && title !== page.title) {
      const existingPage = await Page.findOne({ title });
      if (existingPage) {
        throw new BadRequestError(
          "Another page with this title already exists"
        );
      }
    }

    // Update fields
    page.title = title || page.title;
    page.description = description || page.description;
    page.type = type || page.type;
    page.seoDescription = seoDescription || page.seoDescription;
    if (typeof isActive !== "undefined") {
      page.isActive = isActive;
    }

    await page.save();

    res.status(200).json({
      success: true,
      data: page,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete page
// @route   DELETE /api/pages/:id
// @access  Private/Admin
const deletePage = async (req, res, next) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.id);

    if (!page) {
      throw new NotFoundError("Page not found");
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPage,
  getPages,
  getPage,
  updatePage,
  deletePage,
};
