import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { connectDb, closeDb } from './lib/db.js';
import { parseArgs, formatJson, boolFromArg } from './lib/cli.js';

const printHelp = () => {
  console.log(`
Usage:
  node scripts/update-admin-password.js --username admin --password NewPass123

Options:
  --username <name>     Admin username to update
  --email <email>       Admin email to update
  --id <mongoId>        Admin document _id to update
  --password <value>    New password (or set NEW_ADMIN_PASSWORD env var)
  --hash                Force bcrypt hashing even if existing password is plain
  --dry-run             Show what would change without updating
  --env-dir <path>      Directory containing .env files
  --compact             Output compact JSON
  --help                Show this help
`);
};

const looksHashed = (value) => typeof value === 'string' && value.startsWith('$2');

const resolvePasswordField = (doc) => {
  if (!doc || typeof doc !== 'object') return 'password';
  if (Object.prototype.hasOwnProperty.call(doc, 'passwordHash')) return 'passwordHash';
  if (Object.prototype.hasOwnProperty.call(doc, 'password_hash')) return 'password_hash';
  if (Object.prototype.hasOwnProperty.call(doc, 'hash')) return 'hash';
  if (Object.prototype.hasOwnProperty.call(doc, 'password')) return 'password';
  return 'password';
};

const resolveAdminCollection = async (db) => {
  const adminCollections = await db.listCollections({ name: 'Admin' }).toArray();
  if (adminCollections.length) {
    return 'Admin';
  }
  const userCollections = await db.listCollections({ name: 'users' }).toArray();
  if (userCollections.length) {
    return 'users';
  }
  throw new Error('Neither "Admin" nor "users" collections were found.');
};

const buildQuery = ({ username, email, id }) => {
  if (id) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Provided id is not a valid Mongo ObjectId.');
    }
    return { _id: new ObjectId(id) };
  }

  const or = [];
  if (username) or.push({ username });
  if (email) or.push({ email });
  if (!or.length) {
    throw new Error('Provide --username, --email, or --id to identify the admin record.');
  }
  return { $or: or };
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const pretty = !boolFromArg(args.compact);
  const password = args.password || process.env.NEW_ADMIN_PASSWORD;
  if (!password) {
    console.error('Missing password. Use --password or set NEW_ADMIN_PASSWORD.');
    printHelp();
    process.exit(1);
  }

  const identifier = {
    username: args.username,
    email: args.email,
    id: args.id || (args._?.length ? args._[0] : null)
  };

  let client;
  try {
    const { client: connectedClient, db, dbName, envInfo } = await connectDb({ envDir: args['env-dir'] });
    client = connectedClient;

    const collectionName = await resolveAdminCollection(db);
    const collection = db.collection(collectionName);
    const query = buildQuery(identifier);

    const record = await collection.findOne(query);
    if (!record) {
      const output = {
        success: false,
        message: 'No matching admin record found.',
        collection: collectionName,
        dbName,
        query: identifier
      };
      console.log(formatJson(output, pretty));
      process.exit(1);
    }

    const passwordField = resolvePasswordField(record);
    const existingPassword = record.password || record.passwordHash || record.password_hash || record.hash;
    const forceHash = boolFromArg(args.hash);
    const shouldHash = forceHash || looksHashed(existingPassword) || passwordField !== 'password';
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const nextValue = shouldHash ? await bcrypt.hash(password, saltRounds) : password;

    const updateDoc = {
      $set: {
        [passwordField]: nextValue,
        passwordUpdatedAt: new Date(),
        updatedAt: new Date()
      }
    };

    if (boolFromArg(args['dry-run'])) {
      const output = {
        success: true,
        dryRun: true,
        collection: collectionName,
        dbName,
        matchedId: record._id?.toString?.() || record._id,
        updatedField: passwordField,
        hashed: shouldHash,
        envFile: envInfo.loaded || null
      };
      console.log(formatJson(output, pretty));
      return;
    }

    const result = await collection.updateOne({ _id: record._id }, updateDoc);
    const output = {
      success: result.modifiedCount === 1,
      collection: collectionName,
      dbName,
      matchedId: record._id?.toString?.() || record._id,
      updatedField: passwordField,
      hashed: shouldHash,
      modifiedCount: result.modifiedCount,
      envFile: envInfo.loaded || null
    };
    console.log(formatJson(output, pretty));
  } catch (error) {
    console.error(formatJson({ success: false, error: error.message }, pretty));
    process.exitCode = 1;
  } finally {
    await closeDb(client);
  }
};

run();
