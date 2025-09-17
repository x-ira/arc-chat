export const defaultCommands = [
  {
    name: 'invite',
    desc: 'Invite to private chat',
    scope: 0, // 0: room, 1: priv-chat, 2, all
    parameters: [
      {
        name: 'nick',
        type: 'user',
        required: true,
        desc: 'Target user'
      },
      {
        name: 'greeting',
        type: 'string',
        required: false,
        desc: 'Greeting message to sent. (Optional)'
      }
    ]
  },
  {
    name: 'wisper',
    desc: 'wisper to ...',
    scope: 0,
    parameters: [
      {
        name: 'nick',
        type: 'user',
        required: true,
        desc: 'Someone to talk to'
      },
      {
        name: 'msg',
        type: 'string',
        required: true,
        desc: 'Wisper message to sent'
      }
    ]
  },
  {
    name: 'remark',
    desc: 'set a alias for this chat',
    scope: 2,
    parameters: [
      {
        name: 'alias',
        type: 'string',
        required: true,
        desc: 'Alias'
      }
    ]
  },
  {
    name: 'block',
    desc: 'Put someone in your blacklist',
    scope: 0,
    parameters: [
      {
        name: 'nick',
        type: 'user',
        required: true,
        desc: ''
      },
    ]
  },
  {
    name: 'unblock',
    desc: 'Remove someone from your blacklist',
    scope: 0,
    parameters: [
      {
        name: 'nick',
        type: 'user',
        required: true,
        desc: ''
      },
    ]
  },
  {
    name: 'clear',
    desc: 'Clear Priv-Chat history',
    scope: 1,
    parameters: []
  },
  {
    name: 'leave',
    desc: 'Leave the current private chat',
    scope: 1,
    parameters: []
  },
  {
    name: 'quit',
    desc: 'Quit the joined room',
    scope: 0,
    parameters: []
  },
  {
    name: 'stat',
    desc: 'Statistic info of current room',
    scope: 0,
    parameters: []
  },
  {
    name: 'help',
    desc: 'Command usages',
    scope: 2,
    parameters: []
  },
  // {
  //   name: 'report',
  //   desc: 'Report User',
  //   scope: 0,
  //   parameters: [
  //     {
  //       name: 'nick',
  //       type: 'user',
  //       required: true,
  //       desc: 'To be reported'
  //     },
  //     {
  //       name: 'reason',
  //       type: 'string',
  //       required: false,
  //       desc: 'Reason: [Spam, Violations]'
  //     }
  //   ]
  // },
];

  // Create command suggestion item
export const createCmdSugg = (cmd) => ({
    type: 'command',
    val: cmd.name,
    desc: cmd.desc
  });

  // Get current parameter information
export const getCurrParamInfo = (input, inputParts) => {
    let currParamIdx;
    let currInputParam;
    
    if (input.endsWith(' ')) { // If input ends with space, it means entering the next parameter
      const nonEmptyParts = inputParts.filter(part => part.trim() !== '');
      currParamIdx = nonEmptyParts.length - 1; // Subtract the command itself
      currInputParam = '';
    } else { // If input doesn't end with space, it means currently entering a parameter
      const nonEmptyParts = inputParts.filter(part => part.trim() !== '');
      currParamIdx = Math.max(0, nonEmptyParts.length - 2); // Subtract the command itself
      currInputParam = inputParts[inputParts.length - 1] || '';
    }
    return { currParamIdx, currInputParam };
  };
  // Parse input content
export const parse_input = (input) => {
    if (!input.startsWith('/')) {  return { isCmd: false }; }
    const parts = input.slice(1).split(' ').filter(part => part.length > 0);
    if (parts.length === 0) {
      return { isCmd: true, cmdName: '', params: [] };
    }
    return { isCmd: true, cmdName: parts[0], params: parts.slice(1) };
  };
