const express = require('express');
const router = express.Router();
const MessageRequest = require('../models/MessageRequest');
const Message = require('../models/Message');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// Envoyer une demande de message
router.post('/send/:recipientId', async (req, res) => {
  try {
    const { message } = req.body;
    const senderId = req.user._id;
    const recipientId = req.params.recipientId;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Le message est requis' });
    }

    // Vérifier qu'ils ne sont pas déjà matchés
    const sender = await User.findById(senderId);
    const isMatch = sender.matches.some(m => m.user.toString() === recipientId);

    if (isMatch) {
      return res.status(400).json({ 
        error: 'Vous êtes déjà matchés, envoyez un message directement' 
      });
    }

    // Vérifier qu'il n'y a pas déjà une demande en attente
    const existingRequest = await MessageRequest.findOne({
      sender: senderId,
      recipient: recipientId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ 
        error: 'Vous avez déjà envoyé une demande à ce profil' 
      });
    }

    // Créer la demande
    const messageRequest = new MessageRequest({
      sender: senderId,
      recipient: recipientId,
      message: message.trim(),
      status: 'pending'
    });

    await messageRequest.save();

    // Émettre notification via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(recipientId.toString()).emit('newMessageRequest', {
        id: messageRequest._id,
        sender: senderId,
        message: message.trim(),
        createdAt: messageRequest.createdAt
      });
    }

    res.json({ 
      success: true,
      message: 'Demande envoyée !',
      request: messageRequest
    });

  } catch (error) {
    console.error('Erreur envoi demande:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la demande' });
  }
});

// Obtenir les demandes reçues
router.get('/received', async (req, res) => {
  try {
    const requests = await MessageRequest.find({
      recipient: req.user._id,
      status: 'pending'
    })
    .populate('sender', 'displayName firstName photos')
    .sort({ createdAt: -1 });

    res.json({ 
      success: true,
      requests 
    });

  } catch (error) {
    console.error('Erreur récupération demandes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes' });
  }
});

// Obtenir les demandes envoyées
router.get('/sent', async (req, res) => {
  try {
    const requests = await MessageRequest.find({
      sender: req.user._id
    })
    .populate('recipient', 'displayName firstName photos')
    .sort({ createdAt: -1 });

    res.json({ 
      success: true,
      requests 
    });

  } catch (error) {
    console.error('Erreur récupération demandes envoyées:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes' });
  }
});

// Vérifier si une demande a été envoyée à un profil
router.get('/check/:recipientId', async (req, res) => {
  try {
    const request = await MessageRequest.findOne({
      sender: req.user._id,
      recipient: req.params.recipientId,
      status: 'pending'
    });

    res.json({ 
      success: true,
      hasSent: !!request,
      request: request || null
    });

  } catch (error) {
    console.error('Erreur vérification demande:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

// Accepter une demande
router.post('/accept/:requestId', async (req, res) => {
  try {
    const request = await MessageRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    if (request.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Vous ne pouvez accepter que vos propres demandes' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Cette demande a déjà été traitée' });
    }

    // Marquer comme acceptée
    request.status = 'accepted';
    request.respondedAt = new Date();
    await request.save();

    // Créer un match mutuel
    const sender = await User.findById(request.sender);
    const recipient = await User.findById(request.recipient);

    // Ajouter le match pour les deux utilisateurs
    if (!sender.matches.some(m => m.user.toString() === recipient._id.toString())) {
      sender.matches.push({
        user: recipient._id,
        matchedAt: new Date()
      });
      await sender.save();
    }

    if (!recipient.matches.some(m => m.user.toString() === sender._id.toString())) {
      recipient.matches.push({
        user: sender._id,
        matchedAt: new Date()
      });
      await recipient.save();
    }

    // Créer le premier message dans la conversation
    const firstMessage = new Message({
      sender: sender._id,
      recipient: recipient._id,
      content: request.message,
      type: 'text',
      read: false
    });
    await firstMessage.save();

    // Notifier l'expéditeur via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(sender._id.toString()).emit('messageRequestAccepted', {
        requestId: request._id,
        recipientId: recipient._id
      });
    }

    res.json({ 
      success: true,
      message: 'Demande acceptée ! Vous êtes maintenant matchés.',
      match: true
    });

  } catch (error) {
    console.error('Erreur acceptation demande:', error);
    res.status(500).json({ error: 'Erreur lors de l\'acceptation' });
  }
});

// Rejeter une demande
router.post('/reject/:requestId', async (req, res) => {
  try {
    const request = await MessageRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    if (request.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Vous ne pouvez rejeter que vos propres demandes' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Cette demande a déjà été traitée' });
    }

    // Marquer comme rejetée
    request.status = 'rejected';
    request.respondedAt = new Date();
    await request.save();

    res.json({ 
      success: true,
      message: 'Demande rejetée'
    });

  } catch (error) {
    console.error('Erreur rejet demande:', error);
    res.status(500).json({ error: 'Erreur lors du rejet' });
  }
});

// Supprimer une demande (expéditeur seulement)
router.delete('/:requestId', async (req, res) => {
  try {
    const request = await MessageRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    if (request.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres demandes' });
    }

    await MessageRequest.findByIdAndDelete(req.params.requestId);

    res.json({ 
      success: true,
      message: 'Demande supprimée'
    });

  } catch (error) {
    console.error('Erreur suppression demande:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

module.exports = router;
