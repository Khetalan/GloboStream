const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Récupérer les conversations
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user._id;

    // Récupérer tous les matchs
    const user = await User.findById(userId).populate('matches.user');

    // Pour chaque match, récupérer le dernier message
    const conversations = await Promise.all(
      user.matches.map(async (match) => {
        const matchedUserId = match.user._id;

        // Dernier message de la conversation
        const lastMessage = await Message.findOne({
          $or: [
            { sender: userId, recipient: matchedUserId },
            { sender: matchedUserId, recipient: userId }
          ]
        })
        .sort({ createdAt: -1 })
        .limit(1);

        // Compter les messages non lus
        const unreadCount = await Message.countDocuments({
          sender: matchedUserId,
          recipient: userId,
          read: false
        });

        return {
          user: match.user.getPublicProfile(),
          lastMessage: lastMessage || null,
          unreadCount,
          matchedAt: match.matchedAt
        };
      })
    );

    // Trier par date du dernier message
    conversations.sort((a, b) => {
      const dateA = a.lastMessage ? a.lastMessage.createdAt : a.matchedAt;
      const dateB = b.lastMessage ? b.lastMessage.createdAt : b.matchedAt;
      return dateB - dateA;
    });

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des conversations' });
  }
});

// Récupérer les messages d'une conversation
router.get('/:userId', async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    // Vérifier qu'il y a un match
    const user = await User.findById(currentUserId);
    const hasMatch = user.matches.some(m => m.user.toString() === otherUserId);

    if (!hasMatch) {
      return res.status(403).json({ error: 'Vous devez matcher avant de discuter' });
    }

    // Récupérer les messages
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

    // Marquer les messages comme lus
    await Message.updateMany(
      {
        sender: otherUserId,
        recipient: currentUserId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      messages: messages.reverse(),
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
  }
});

// Envoyer un message
router.post('/:userId', async (req, res) => {
  try {
    const senderId = req.user._id;
    const recipientId = req.params.userId;
    const { content, type = 'text' } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Le message ne peut pas être vide' });
    }

    // Vérifier qu'il y a un match
    const user = await User.findById(senderId);
    const hasMatch = user.matches.some(m => m.user.toString() === recipientId);

    if (!hasMatch) {
      return res.status(403).json({ error: 'Vous devez matcher avant de discuter' });
    }

    // Créer le message
    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      content: content.trim(),
      type
    });

    await message.save();

    // Envoyer via WebSocket
    const io = req.app.get('io');
    io.emit('newMessage', {
      recipientId,
      message: {
        ...message.toObject(),
        sender: user.getPublicProfile()
      }
    });

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
});

// Marquer une conversation comme lue
router.patch('/:userId/read', async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    await Message.updateMany(
      {
        sender: otherUserId,
        recipient: currentUserId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: 'Messages marqués comme lus'
    });
  } catch (error) {
    console.error('Erreur marquage lecture:', error);
    res.status(500).json({ error: 'Erreur lors du marquage' });
  }
});

// Supprimer un message
router.delete('/message/:messageId', async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    // Vérifier que l'utilisateur est l'expéditeur
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    await message.deleteOne();

    res.json({
      success: true,
      message: 'Message supprimé'
    });
  } catch (error) {
    console.error('Erreur suppression message:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

module.exports = router;
