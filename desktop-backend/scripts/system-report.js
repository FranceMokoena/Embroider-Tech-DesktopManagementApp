import fs from 'fs';
import path from 'path';
import { connectDb, closeDb } from './lib/db.js';
import { parseArgs, formatJson, boolFromArg } from './lib/cli.js';

const printHelp = () => {
  console.log(`
Usage:
  node scripts/system-report.js --out report.json

Options:
  --out <path>        Write JSON report to file (default: stdout)
  --limit <number>    Limit recent item arrays (default: 20)
  --env-dir <path>    Directory containing .env files
  --compact           Output compact JSON
  --help              Show this help
`);
};

const mapBreakdown = (rows = []) =>
  rows.reduce((acc, row) => {
    const key = row?._id ?? 'Unknown';
    acc[key] = row?.count ?? 0;
    return acc;
  }, {});

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const limit = Number(args.limit) || 20;
  const pretty = !boolFromArg(args.compact);
  const outPath = args.out ? path.resolve(args.out) : null;

  let client;
  try {
    const { client: connectedClient, db, dbName, envInfo } = await connectDb({ envDir: args['env-dir'] });
    client = connectedClient;

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((entry) => entry.name);

    const usersCollection = collectionNames.includes('users') ? db.collection('users') : null;
    const sessionsCollection = collectionNames.includes('tasksessions') ? db.collection('tasksessions') : null;
    const screensCollection = collectionNames.includes('screens') ? db.collection('screens') : null;

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalSessions,
      totalScreens,
      screensLast24,
      screensLast7,
      statusBreakdownRows,
      departmentBreakdownRows,
      recentScreens,
      recentSessions,
      recentUsers,
      missingScreenStatus,
      missingScreenTimestamp,
      missingScreenSession,
      missingSessionTechnician,
      missingUserDepartment
    ] = await Promise.all([
      usersCollection ? usersCollection.countDocuments() : 0,
      sessionsCollection ? sessionsCollection.countDocuments() : 0,
      screensCollection ? screensCollection.countDocuments() : 0,
      screensCollection ? screensCollection.countDocuments({ timestamp: { $gte: last24Hours } }) : 0,
      screensCollection ? screensCollection.countDocuments({ timestamp: { $gte: last7Days } }) : 0,
      screensCollection
        ? screensCollection.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray()
        : [],
      usersCollection
        ? usersCollection.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }]).toArray()
        : [],
      screensCollection
        ? screensCollection
            .find({}, { projection: { _id: 1, barcode: 1, status: 1, timestamp: 1, session: 1 } })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray()
        : [],
      sessionsCollection
        ? sessionsCollection
            .find({}, { projection: { _id: 1, technician: 1, start: 1, startTime: 1, scanCount: 1 } })
            .sort({ start: -1, startTime: -1, _id: -1 })
            .limit(limit)
            .toArray()
        : [],
      usersCollection
        ? usersCollection
            .find({}, { projection: { _id: 1, username: 1, email: 1, department: 1, role: 1 } })
            .sort({ _id: -1 })
            .limit(limit)
            .toArray()
        : [],
      screensCollection
        ? screensCollection.countDocuments({
            $or: [{ status: { $exists: false } }, { status: null }, { status: '' }]
          })
        : 0,
      screensCollection
        ? screensCollection.countDocuments({
            $or: [{ timestamp: { $exists: false } }, { timestamp: null }]
          })
        : 0,
      screensCollection
        ? screensCollection.countDocuments({
            $or: [{ session: { $exists: false } }, { session: null }]
          })
        : 0,
      sessionsCollection
        ? sessionsCollection.countDocuments({
            $or: [{ technician: { $exists: false } }, { technician: null }]
          })
        : 0,
      usersCollection
        ? usersCollection.countDocuments({
            $or: [{ department: { $exists: false } }, { department: null }, { department: '' }]
          })
        : 0
    ]);

    const report = {
      generatedAt: now.toISOString(),
      database: {
        name: dbName,
        envFile: envInfo.loaded || null,
        collections: collectionNames
      },
      totals: {
        users: totalUsers,
        sessions: totalSessions,
        screens: totalScreens
      },
      screens: {
        last24Hours: screensLast24,
        last7Days: screensLast7,
        statusBreakdown: mapBreakdown(statusBreakdownRows),
        recent: recentScreens,
        dataQuality: {
          missingStatus: missingScreenStatus,
          missingTimestamp: missingScreenTimestamp,
          missingSession: missingScreenSession
        }
      },
      sessions: {
        recent: recentSessions,
        dataQuality: {
          missingTechnician: missingSessionTechnician
        }
      },
      users: {
        departmentBreakdown: mapBreakdown(departmentBreakdownRows),
        recent: recentUsers,
        dataQuality: {
          missingDepartment: missingUserDepartment
        }
      }
    };

    const output = formatJson(report, pretty);
    if (outPath) {
      fs.writeFileSync(outPath, output, 'utf8');
      console.log(formatJson({ success: true, writtenTo: outPath }, pretty));
    } else {
      console.log(output);
    }
  } catch (error) {
    console.error(formatJson({ success: false, error: error.message }, true));
    process.exitCode = 1;
  } finally {
    await closeDb(client);
  }
};

run();
