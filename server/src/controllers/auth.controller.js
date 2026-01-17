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
    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
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
 * Step 1: Generate options for browser to start passkey registration
 */
exports.registerPasskeyOptions = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) return res.status(400).json({ error: 'Username required' });

    let user = await User.findOne({ username: username.trim() });
    if (!user) {
      user = await User.create({ username: username.trim() });
    }

    const options = await generateRegistrationOptions({
      rpName: 'Hackathon App',
      rpID: 'localhost', // or your domain
      userID: user._id.toString(),
      userName: user.username,
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
    });

    // Save challenge to user document
    user.challenge = options.challenge;
    await user.save();

    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Step 2: Verify the passkey registration response from browser
 */
exports.registerPasskeyVerify = async (req, res) => {
  try {
    const { username, attestationResponse } = req.body;
    const user = await User.findOne({ username: username.trim() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.challenge) return res.status(400).json({ error: 'No challenge found for user' });

    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: user.challenge,
      expectedOrigin: process.env.RP_ORIGIN || 'http://localhost:3000',
      expectedRPID: 'localhost',
    });

    if (!verification.verified) return res.status(400).json({ error: 'Verification failed' });

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

    user.webauthnCredentials.push({
      credentialID: Buffer.from(credentialID), // Convert to Buffer
      publicKey: Buffer.from(credentialPublicKey), // Convert to Buffer
      counter,
      transports: attestationResponse.response.transports || [],
    });

    // Clear challenge
    user.challenge = undefined;
    await user.save();

    // Optional: issue JWT after successful registration
    const token = generateToken({ userId: user._id.toString(), username: user.username });

    res.json({ success: true, token });
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
      expectedRPID: 'localhost',
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
