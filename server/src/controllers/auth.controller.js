const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const AppError = require('../utils/errors');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');

/**
 * In-memory store for pending passkey registration challenges.
 * Avoids creating ghost User documents before verification succeeds.
 * Key: username, Value: { challenge, expiresAt }
 */
const pendingRegistrationChallenges = new Map();


/**
 * Register a new user with password
 */
exports.register = async (req, res, next) => {
  try {
    const { username, password, confirmPassword } = req.body;

    // Validation
    if (!username || !username.trim()) {
      return res.status(400).json({
        error: { message: 'Username is required' },
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        error: { message: 'Password must be at least 6 characters long' },
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: { message: 'Passwords do not match' },
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username: username.trim() }).select('+password');
    if (existingUser) {
      // Allow claiming a ghost account (created by passkey flow, no password set yet)
      if (!existingUser.password) {
        const saltRounds = 10;
        existingUser.password = await bcrypt.hash(password, saltRounds);
        await existingUser.save();
        const token = generateToken({
          userId: existingUser._id.toString(),
          username: existingUser.username,
        });
        return res.status(201).json({
          success: true,
          userId: existingUser._id.toString(),
          token,
          username: existingUser.username,
        });
      }
      return res.status(409).json({
        error: { message: 'Username already exists' },
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      username: username.trim(),
      password: hashedPassword,
    });

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
    });

    res.status(201).json({
      success: true,
      userId: user._id.toString(),
      token,
      username: user.username,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: { message: 'Username already exists' },
      });
    }
    next(error);
  }
};

/**
 * Login with username and password
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({
        error: { message: 'Username is required' },
      });
    }

    if (!password) {
      return res.status(400).json({
        error: { message: 'Password is required' },
      });
    }

    // Find user and include password field (password has select: false in schema)
    const user = await User.findOne({ username: username.trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        error: { message: 'Invalid username or password' },
      });
    }

    // Check if user has a password
    if (!user.password) {
      return res.status(401).json({
        error: { message: 'Invalid username or password' },
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: { message: 'Invalid username or password' },
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
    });

    res.json({
      success: true,
      userId: user._id.toString(),
      token,
      username: user.username,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Step 1: Generate options for browser to start passkey registration.
 * Does NOT create a User document — challenge is stored in memory only.
 * The User is created in Step 2 after successful verification.
 */
exports.registerPasskeyOptions = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) return res.status(400).json({ error: 'Username required' });

    // Reject if a real account already exists (has a password or registered passkey)
    const existingUser = await User.findOne({ username: username.trim() }).select('+password');
    if (existingUser && (existingUser.password || existingUser.webauthnCredentials.length > 0)) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const options = await generateRegistrationOptions({
      rpName: process.env.RP_NAME || 'Palate',
      rpID: process.env.RP_ID || 'localhost',
      userID: username.trim(), // temporary stand-in; real _id assigned on verify
      userName: username.trim(),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
    });

    // Store challenge in memory — no DB write, no ghost user
    pendingRegistrationChallenges.set(username.trim(), {
      challenge: options.challenge,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5-minute TTL
    });

    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Step 2: Verify the passkey registration response from browser.
 * Creates the User document only after verification succeeds.
 */
exports.registerPasskeyVerify = async (req, res) => {
  try {
    const { username, attestationResponse } = req.body;

    // Retrieve challenge from memory (set in Step 1)
    const pending = pendingRegistrationChallenges.get(username.trim());
    if (!pending || pending.expiresAt < Date.now()) {
      pendingRegistrationChallenges.delete(username.trim());
      return res.status(400).json({ error: 'Challenge expired or not found. Please restart registration.' });
    }

    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: pending.challenge,
      expectedOrigin: process.env.RP_ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.RP_ID || 'localhost',
    });

    // Always clear the pending challenge after one use
    pendingRegistrationChallenges.delete(username.trim());

    if (!verification.verified) return res.status(400).json({ error: 'Verification failed' });

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

    // Race-condition guard: check username is still unclaimed
    const existingUser = await User.findOne({ username: username.trim() }).select('+password');
    if (existingUser && (existingUser.password || existingUser.webauthnCredentials.length > 0)) {
      return res.status(409).json({ error: 'Username was claimed by another account during registration.' });
    }

    // Reuse ghost user if somehow one still exists, otherwise create fresh
    const user = existingUser || new User({ username: username.trim() });
    user.webauthnCredentials.push({
      credentialID: Buffer.from(credentialID),
      publicKey: Buffer.from(credentialPublicKey),
      counter,
      transports: attestationResponse.response.transports || [],
    });
    user.challenge = undefined;
    await user.save();

    const token = generateToken({ userId: user._id.toString(), username: user.username });

    res.json({
      success: true,
      token,
      userId: user._id.toString(),
      username: user.username,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Step 3: Generate options for browser to start passkey login
 */
exports.loginPasskeyOptions = async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username: username.trim() });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const opts = await generateAuthenticationOptions({
      allowCredentials: user.webauthnCredentials.map(cred => ({
        id: cred.credentialID,
        type: 'public-key',
        transports: cred.transports,
      })),
      userVerification: 'preferred',
    });

    // Save challenge to user document
    user.challenge = opts.challenge;
    await user.save();

    res.json(opts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Step 4: Verify the passkey login response
 */
exports.loginPasskeyVerify = async (req, res) => {
  try {
    const { username, attestationResponse } = req.body;
    const user = await User.findOne({ username: username.trim() });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.challenge) {
      return res.status(400).json({ error: 'No challenge found for user' });
    }

    const credential = user.webauthnCredentials.find(cred =>
      cred.credentialID.equals(Buffer.from(attestationResponse.id, 'base64url'))
    );

    if (!credential) {
      return res.status(400).json({ error: 'Credential not found' });
    }

    const verification = await verifyAuthenticationResponse({
      response: attestationResponse,
      expectedChallenge: user.challenge,
      expectedOrigin: process.env.RP_ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.RP_ID || 'localhost',
      authenticator: {
        credentialID: credential.credentialID,
        credentialPublicKey: credential.publicKey,
        counter: credential.counter,
      },
    });

    if (!verification.verified) {
      return res.status(400).json({ error: 'Verification failed' });
    }

    // Update counter
    credential.counter = verification.authenticationInfo.newCounter;
    user.challenge = undefined;
    await user.save();

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
    });

    res.json({ success: true, token, userId: user._id.toString(), username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
