export const parseArgs = (argv = []) => {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    } else {
      args._.push(token);
    }
  }
  return args;
};

export const boolFromArg = (value) => value === true || value === 'true' || value === '1';

export const formatJson = (data, pretty = true) => JSON.stringify(data, null, pretty ? 2 : 0);
