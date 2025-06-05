const Reminder = require('../models/Reminder');


exports.createPost = async (req, res) => {
  try {
    const { title, reminderAt, remind, priority,quantity,description,type } = req.body;
    const userId = req.user._id;

  
    const blog = new Reminder({ 
      user: userId,
      title, 
      reminderAt, 
      remind, 
      priority,
      quantity:quantity||"",
      description:description||"" ,
      type
    });
    
    await blog.save();

    res.status(201).json({ success: true, message: 'Reminder created successfully', reminder:blog });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.editpost = async (req, res) => {
  try {
    const courseId = req.params.id;

    const { title, reminderAt, repeat, remind, priority,description  } = req.body;

      // Create an object to store the fields to be updated
      const updateFields = Object.fromEntries(
        Object.entries({
          title, reminderAt, repeat, remind, priority,description
        }).filter(([key, value]) => value !== undefined)
      );
    
      // Check if there are any fields to update
      if (Object.keys(updateFields).length === 0) {
        return res
          .status(400)
          .send({
            success: false,
            message: "No valid fields provided for update.",
          });
      }

    const medicine = await Reminder.findByIdAndUpdate(courseId,updateFields,{ new: true });

    if (!medicine) return res.status(200).json({ success: false, message: "Invalid Reminder ID"});

    res.status(201).json({ success: true, message: "Reminder updated successfully", reminder:medicine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getAllPosts = async (req, res) => {  
  try {
    const {repeat, remind, priority,type}=req.query;
  // Create an object to store the fields to be updated
  const updateFields = Object.fromEntries(
    Object.entries({
      repeat, remind, priority,type
    }).filter(([key, value]) => value !== undefined)
  );

  console.log(updateFields)

    const blog = await Reminder.find({ user:req.user._id,...updateFields }).sort({ _id: -1 }).lean();

    if (blog.length > 0) {
      res.status(200).json({ success: true, reminder: blog });
    } else {
      res.status(200).json({ success: false,reminder:[], message: 'No more Reminders found' });
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.deletePost = async (req, res) => {
  const postId = req.params.id;
  try {
    const blog = await Reminder.findByIdAndDelete(postId).lean();

    res.status(200).json({ success: true, reminder: blog,message:"Reminder deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};