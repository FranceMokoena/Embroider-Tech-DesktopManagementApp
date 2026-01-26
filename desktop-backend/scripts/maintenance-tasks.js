import fs from 'fs';
import path from 'path';
import { connectDb, closeDb } from './lib/db.js';
import { parseArgs, formatJson, boolFromArg } from './lib/cli.js';

const printHelp = () => {
  console.log(`
Usage:
  node scripts/maintenance-tasks.js --task db-health

Options:
  --task <name>       Task name to run (or pass as first arg)
  --list              List available tasks
  --watch <minutes>   Run task every N minutes
  --out <path>        Write JSON output to file
  --append            Append JSON line output when --out is provided
  --env-dir <path>    Directory containing .env files
  --compact           Output compact JSON
  --help              Show this help
`);
};

const TASKS = {
  'db-health': async (db) => {
    await db.admin().ping();
    const [users, sessions, screens] = await Promise.all([
      db.collection('users').countDocuments().catch(() => 0),
      db.collection('tasksessions').countDocuments().catch(() => 0),
      db.collection('screens').countDocuments().catch(() => 0)
    ]);
    return { users, sessions, screens };
  },
  'data-quality': async (db) => {
    const screens = db.collection('screens');
    const sessions = db.collection('tasksessions');
    const users = db.collection('users');

    const [missingScreenStatus, missingScreenTimestamp, missingScreenSession, missingSessionTechnician, missingUserDepartment] =
      await Promise.all([
        screens.countDocuments({ $or: [{ status: { $exists: false } }, { status: null }, { status: '' }] }).catch(() => 0),
        screens.countDocuments({ $or: [{ timestamp: { $exists: false } }, { timestamp: null }] }).catch(() => 0),
        screens.countDocuments({ $or: [{ session: { $exists: false } }, { session: null }] }).catch(() => 0),
        sessions.countDocuments({ $or: [{ technician: { $exists: false } }, { technician: null }] }).catch(() => 0),
        users.countDocuments({ $or: [{ department: { $exists: false } }, { department: null }, { department: '' }] }).catch(() => 0)
      ]);

    return {
      screens: {
        missingStatus: missingScreenStatus,
        missingTimestamp: missingScreenTimestamp,
        missingSession: missingScreenSession
      },
      sessions: {
        missingTechnician: missingSessionTechnician
      },
      users: {
        missingDepartment: missingUserDepartment
      }
    };
  }
};

const listTasks = () => Object.keys(TASKS);

const runTaskOnce = async ({ taskName, envDir }) => {
  const { client, db, dbName, envInfo } = await connectDb({ envDir, quiet: true });
  try {
    const result = await TASKS[taskName](db);
    return {
      success: true,
      task: taskName,
      dbName,
      envFile: envInfo.loaded || null,
      timestamp: new Date().toISOString(),
      result
    };
  } catch (error) {
    return {
      success: false,
      task: taskName,
      dbName,
      envFile: envInfo.loaded || null,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  } finally {
    await closeDb(client);
  }
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (args.list) {
    console.log(formatJson({ tasks: listTasks() }, true));
    process.exit(0);
  }

  const taskName = args.task || (args._?.length ? args._[0] : null) || 'db-health';
  if (!TASKS[taskName]) {
    console.error(formatJson({ success: false, error: `Unknown task: ${taskName}`, tasks: listTasks() }, true));
    process.exit(1);
  }

  const outPath = args.out ? path.resolve(args.out) : null;
  const append = boolFromArg(args.append);
  const pretty = !append && !boolFromArg(args.compact);
  const watchMinutes = args.watch ? Number(args.watch) : null;
  const watchIntervalMs = Number.isFinite(watchMinutes) && watchMinutes > 0 ? watchMinutes * 60 * 1000 : null;

  const writeOutput = (payload) => {
    const output = formatJson(payload, pretty);
    if (outPath) {
      if (append) {
        fs.appendFileSync(outPath, `${formatJson(payload, false)}\n`, 'utf8');
      } else {
        fs.writeFileSync(outPath, output, 'utf8');
      }
    } else {
      console.log(output);
    }
  };

  if (!watchIntervalMs) {
    const result = await runTaskOnce({ taskName, envDir: args['env-dir'] });
    writeOutput(result);
    return;
  }

  console.log(`Running task "${taskName}" every ${watchMinutes} minute(s). Press Ctrl+C to stop.`);
  const runLoop = async () => {
    const result = await runTaskOnce({ taskName, envDir: args['env-dir'] });
    writeOutput(result);
  };

  await runLoop();
  setInterval(runLoop, watchIntervalMs);
};

run();
