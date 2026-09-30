import express from "express";
import mongoose from "mongoose";
import Thought from "../models/Thought.model.js";
import { Notification } from "../models/notification.model.js";
import { protect } from "../middleware/auth.middleware.js";
import { emitToUser } from "../config/socket.js";

const router = express.Router()

const PAGE_SIZE = 20
const MAX_LEN = 280
const AUTHOR_FIELDS = 'name avatar'
const NOTIFY_SELF = true

// Only an emoji string or an https GIPHY URL is accepted as a sticker.
function cleanSticker(input) {
  if (!input || typeof input !== 'object') return null
  const kind = input.kind
  const value = input.value
  if (typeof value !== 'string') return null

  if (kind === 'emoji') {
    if (value.length < 1 || value.length > 16 || /[<>]/.test(value)) return null
    return { kind: 'emoji', value }
  }

  if (kind === 'url') {
    if (value.length > 500) return null
    try {
      const u = new URL(value)
      const host = u.hostname
      if (u.protocol !== 'https:') return null
      if (host !== 'giphy.com' && !host.endsWith('.giphy.com')) return null
      return { kind: 'url', value: u.toString() }
    } catch (err) {
      return null
    }
  }

  return null
}

function includesId(list, id) {
  for (let i = 0; i < list.length; i++) {
    if (String(list[i]) === String(id)) return true
  }
  return false
}

// Notification failures must never break the main action.
async function notifyThought({ recipient, sender, type, thought, thoughtReply }) {
  try {
    const isSelf = String(recipient) === String(sender)
    if (!NOTIFY_SELF && isSelf) return
    if (type === 'like_thought') {
      // One notification per (sender, thought) — re-liking refreshes it instead of duplicating
      await Notification.findOneAndUpdate(
        { recipient, sender, type, thought },
        { $set: { read: isSelf }, $setOnInsert: { recipient, sender, type, thought } },
        { upsert: true, new: true }
      )
    } else {
      await Notification.create({ recipient, sender, type, thought, thoughtReply, read: isSelf })
    }
    emitToUser(recipient, 'notification:refresh')
  } catch (err) {
    console.error('notifyThought failed:', err)
  }
}

/* GET /api/thoughts — public. Cursor pagination, newest first. */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || PAGE_SIZE, 50)
    const filter = { parent: null }
    if (req.query.before) {
      const d = new Date(req.query.before)
      if (!isNaN(d.getTime())) filter.createdAt = { $lt: d }
    }

    const rows = await Thought.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('author', AUTHOR_FIELDS)
      .lean()

    const hasMore = rows.length > limit
    const thoughts = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? thoughts[thoughts.length - 1].createdAt : null

    res.json({ success: true, data: { thoughts }, nextCursor, hasMore })
  } catch (err) {
    console.error('GET /thoughts failed:', err)
    res.status(500).json({ success: false, message: 'Could not load thoughts' })
  }
})

/* GET /api/thoughts/:id/replies — public, oldest first. */
router.get('/:id/replies', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' })
    }
    const replies = await Thought.find({ parent: req.params.id })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate('author', AUTHOR_FIELDS)
      .lean()
    res.json({ success: true, data: { thoughts: replies } })
  } catch (err) {
    console.error('GET /thoughts/:id/replies failed:', err)
    res.status(500).json({ success: false, message: 'Could not load replies' })
  }
})

/* POST /api/thoughts — needs login. Body: { text?, sticker?, parentId? } */
router.post('/', protect, async (req, res) => {
  try {
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : ''
    const sticker = cleanSticker(req.body.sticker)

    if (text.length > MAX_LEN) {
      return res.status(400).json({ success: false, message: `Keep it under ${MAX_LEN} characters` })
    }
    if (!text && !sticker) {
      return res.status(400).json({ success: false, message: 'Say something or add a sticker' })
    }

    let parent = null
    if (req.body.parentId) {
      if (!mongoose.isValidObjectId(req.body.parentId)) {
        return res.status(400).json({ success: false, message: 'Invalid parent' })
      }
      parent = await Thought.findById(req.body.parentId).select('parent author')
      if (!parent) return res.status(404).json({ success: false, message: 'Thought not found' })
      // One level of replies only
      if (parent.parent) {
        return res.status(400).json({ success: false, message: 'You can only reply to a top-level thought' })
      }
    }

    const created = await Thought.create({
      author: req.user._id,
      text,
      sticker,
      parent: parent ? parent._id : null,
    })

    if (parent) {
      await Thought.updateOne({ _id: parent._id }, { $inc: { replyCount: 1 } })
      await notifyThought({
        recipient: parent.author,
        sender: req.user._id,
        type: 'reply_thought',
        thought: parent._id,
        thoughtReply: created._id,
      })
    }

    const populated = await Thought.findById(created._id).populate('author', AUTHOR_FIELDS).lean()
    res.status(201).json({ success: true, data: { thought: populated } })
  } catch (err) {
    console.error('POST /thoughts failed:', err)
    res.status(500).json({ success: false, message: 'Could not post' })
  }
})

/* POST /api/thoughts/:id/like — needs login. Toggles. */
router.post('/:id/like', protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' })
    }
    const thought = await Thought.findById(req.params.id).select('likes author')
    if (!thought) return res.status(404).json({ success: false, message: 'Thought not found' })

    const liked = includesId(thought.likes, req.user._id)
    await Thought.updateOne(
      { _id: thought._id },
      liked ? { $pull: { likes: req.user._id } } : { $addToSet: { likes: req.user._id } }
    )

    if (liked) {
      // Unliked — remove the notification
      try {
        await Notification.deleteMany({
          recipient: thought.author,
          sender: req.user._id,
          type: 'like_thought',
          thought: thought._id,
        })
        emitToUser(thought.author, 'notification:refresh')
      } catch (err) {
        console.error('remove like notification failed:', err)
      }
    } else {
      await notifyThought({
        recipient: thought.author,
        sender: req.user._id,
        type: 'like_thought',
        thought: thought._id,
      })
    }

    res.json({ success: true, liked: !liked })
  } catch (err) {
    console.error('POST /thoughts/:id/like failed:', err)
    res.status(500).json({ success: false, message: 'Could not update like' })
  }
})

/* DELETE /api/thoughts/:id — author only. Removes its replies too. */
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' })
    }
    const thought = await Thought.findById(req.params.id)
    if (!thought) return res.status(404).json({ success: false, message: 'Thought not found' })
    if (String(thought.author) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not allowed' })
    }

    const replyIds = (await Thought.find({ parent: thought._id }).select('_id').lean()).map((r) => r._id)
    const allIds = [thought._id, ...replyIds]

    await Thought.deleteMany({ parent: thought._id })
    if (thought.parent) await Thought.updateOne({ _id: thought.parent }, { $inc: { replyCount: -1 } })
    await thought.deleteOne()

    try {
      await Notification.deleteMany({
        $or: [{ thought: { $in: allIds } }, { thoughtReply: { $in: allIds } }],
      })
    } catch (err) {
      console.error('cleanup thought notifications failed:', err)
    }

    res.json({ success: true })
  } catch (err) {
    console.error('DELETE /thoughts/:id failed:', err)
    res.status(500).json({ success: false, message: 'Could not delete' })
  }
})

export default router