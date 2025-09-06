export const defaultCommands = [
  {
    name: 'invite',
    desc: 'Invite to private chat',
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
    name: 'report',
    desc: 'Report User',
    parameters: [
      {
        name: 'nick',
        type: 'user',
        required: true,
        desc: 'To be reported'
      },
      {
        name: 'reason',
        type: 'string',
        required: false,
        desc: 'Reason: [Spam, Violations]'
      }
    ]
  },
  {
    name: 'block',
    desc: 'Dont see this users msg',
    parameters: [
      {
        name: 'nick',
        type: 'user',
        required: true,
        desc: ''
      },
      {
        name: 'duration',
        type: 'number',
        required: false,
        desc: 'block period, in minutes'
      }
    ]
  },
  {
    name: 'help',
    desc: `
  Usages:
    /stat : Statistic info about current room. 
    /invite  + [nick] : Invite someone to join a private chat.
    /help : print this message.
    `,
    parameters: []
  },
  {
    name: 'clear',
    desc: 'Clear chat history',
    parameters: []
  },
  {
    name: 'leave',
    desc: 'Leave the current private chat',
    parameters: []
  },
  {
    name: 'quit',
    desc: 'Quit the joined room',
    parameters: [
      {
        name: 'room',
        type: 'room',
        required: true,
        desc: 'Target Room'
      }
    ]
  }
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
