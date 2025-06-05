require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const mime = require('mime-types');
const fs = require('fs');
const sharp = require('sharp');

const admin = require("firebase-admin");

const bucket = admin.storage().bucket();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "/files"); // Adjust the path as needed
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = mime.extension(file.mimetype);
    const filename = `${timestamp}.${extension}`;
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });

router.post('/upload-multiple', upload.array('images', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files uploaded.');
  }

  try {
    const uploadedImages = await Promise.all(req.files.map(async (file) => {
      const destination = `uploads/${file.filename}`;
      const compressedFilePath = path.join(__dirname, 'files', `compressed-${file.filename}`);

      // Compress and resize image
      await sharp(file.path)
        .resize({ width: 800 }) 
        .jpeg({ quality: 80 })
        .toFile(compressedFilePath);

      // Upload to Firebase Storage
      await bucket.upload(compressedFilePath, {
        destination,
        metadata: {
          contentType: 'image/jpeg',
        },
      });

      // Make the file public
      const fileInBucket = bucket.file(destination);
      await fileInBucket.makePublic();
      
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

      // Delete temporary files
      fs.unlink(file.path, (err) => {
        if (err) console.error('Failed to delete original file:', err);
      });
      fs.unlink(compressedFilePath, (err) => {
        if (err) console.error('Failed to delete compressed file:', err);
      });

      return publicUrl;
    }));

    res.json({ images: uploadedImages });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error in uploading images. Try again later.', error });
  }
});

router.post('/file', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  try {
    // Read the uploaded video file
    const file = req.file;
    const destination = `uploads/${file.filename}`;

    // Upload the compressed video to Firebase Storage
    await bucket.upload(file.path, {
      destination,
      metadata: {
        contentType: file.mimetype  // Adjust content type based on your video format
      },
    });
    
    // Make the file public
    const fileInBucket = bucket.file(destination);
    await fileInBucket.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
    
    // Delete the original and compressed video files after sending the response
    fs.unlink(file.path, (err) => {
      if (err) console.error('Failed to delete original video:', err);
    });
    res.json({ file: publicUrl });
    
    // fs.unlink(compressedFilePath, (err) => {
    //   if (err) console.error('Failed to delete compressed video:', err);
    // });
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: 'Error in uploading. Try again later.', error });
  }
});

router.post('/upload', upload.single('image'), async(req, res) => {
  console.log('Image upload route hit');
  console.log(req.file);
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  try {    
    // Read the uploaded Excel file
    const file = req.file;
    const destination = `uploads/${file.filename}`;
    
    const compressedFilePath = path.join(__dirname, 'files', `compressed-${file.filename}`);

    await sharp(file.path)
    .resize({ width: 800 }) 
    .jpeg({ quality: 80 })  // Compress to JPEG with 80% quality
    .toFile(compressedFilePath);
    // Upload the file to Firebase Storage
    await bucket.upload(compressedFilePath, {
      destination,
      metadata: {
        contentType: 'image/jpg',
      }
    });
    
    // Make the file public
    const fileInBucket = bucket.file(destination);
    await fileInBucket.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
    
    // Delete the file after sending the response
    fs.unlink(file.path, (err) => {
    });
    fs.unlink(compressedFilePath, (err) => {
    });
    res.json({ image: publicUrl });
  } catch (error) {
    console.log(error)
    res.status(400).json({message:'Error in uploading. Try again later.',error});
  }
});


module.exports = router; 
