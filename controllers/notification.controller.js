import { Notification } from "../models/notification.model.js";
import { emitToUser } from "../config/socket.js";

// Set to false to go back to skipping notifications for your own actions.
const NOTIFY_SELF = true;

// Internal helper — call this from other controllers (likePost, addComment, etc.)
export const createNotification = async ({ recipient, sender, type, post, comment, thought, thoughtReply }) => {
  try {
    const isSelf = recipient.toString() === sender.toString();
    if (isSelf && !NOTIFY_SELF) return;
    await Notification.create({
      recipient,
      sender,
      type,
      post,
      comment,
      thought,
      thoughtReply,
      read: false,
    });
    emitToUser(recipient, "notification:refresh");
  } catch (error) {
    console.error("Failed to create notification:", error.message);
  }
};

export const getMyNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .populate("sender", "name avatar")
        // ✅ NOW POPULATES FULL POST DATA – includes images & videos
        .populate("post", "title images videos content")
        .populate("comment", "content")
        .populate("thought", "text sticker")
        .populate("thoughtReply", "text sticker")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipient: req.user._id }),
      Notification.countDocuments({ recipient: req.user._id, read: false }),
    ]);

    const data = notifications.map((n) => ({
      ...n.toObject(),
      isSelf: String(n.sender?._id) === String(req.user._id),
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await notification.deleteOne();
    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};