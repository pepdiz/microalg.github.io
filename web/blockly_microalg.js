var malg_url = 'http://microalg.info/doc.html';

// Un extrait des messages originaux:
// http://code.google.com/p/blockly/source/browse/trunk/msg/js/fr.js

Blockly.Msg.ADD_COMMENT = "Ajouter un commentaire";
Blockly.Msg.AUTH = "Veuillez autoriser cette application à permettre la sauvegarde de votre travail et à l’autoriser de le partager avec vous.";
Blockly.Msg.CHANGE_VALUE_TITLE = "Modifier la valeur :";
Blockly.Msg.CHAT = "Discuter avec votre collaborateur en tapant dans cette zone !";
Blockly.Msg.COLLAPSE_ALL = "Réduire les blocs";
Blockly.Msg.COLLAPSE_BLOCK = "Réduire le bloc";
Blockly.Msg.DELETE_BLOCK = "Supprimer le bloc";
Blockly.Msg.DELETE_X_BLOCKS = "Supprimer %1 blocs";
Blockly.Msg.DISABLE_BLOCK = "Désactiver le bloc";
Blockly.Msg.DUPLICATE_BLOCK = "Dupliquer";
Blockly.Msg.ENABLE_BLOCK = "Activer le bloc";
Blockly.Msg.EXPAND_ALL = "Développer les blocs";
Blockly.Msg.EXPAND_BLOCK = "Développer le bloc";
Blockly.Msg.EXTERNAL_INPUTS = "Entrées externes";
Blockly.Msg.HELP = "Aide";
Blockly.Msg.INLINE_INPUTS = "Entrées en ligne";
Blockly.Msg.NEW_VARIABLE = "Nouvelle variable…";
Blockly.Msg.NEW_VARIABLE_TITLE = "Nom de la nouvelle variable :";
Blockly.Msg.REMOVE_COMMENT = "Supprimer un commentaire";
Blockly.Msg.RENAME_VARIABLE = "Renommer la variable…";
Blockly.Msg.RENAME_VARIABLE_TITLE = "Renommer toutes les variables '%1' en :";

// Préparation du générateur de code basée sur
// http://code.google.com/p/blockly/source/browse/trunk/generators/python.js

Blockly.MicroAlg = new Blockly.Generator('MicroAlg');
Blockly.MicroAlg.INDENT = '  ';
Blockly.MicroAlg.addReservedWords(
    '=, =/, <, <=, >, >=, ' +
    'Affecter_a, Afficher, Aide, Bloc, Booleen?, Concatener, ' +
    'Demander, Faire, Faux, Faux?, Initialiser, Nombre, Nombre?, ' +
    'Rien, Si, Tant_que, Texte, Texte?, Type, Vrai, Vrai?');

// La suite, jusqu’au commentaire de fin, n’a pas été modifiée.

/**
 * Initialise the database of variable names.
 */
Blockly.MicroAlg.init = function() {
  // Create a dictionary of definitions to be printed before the code.
  Blockly.MicroAlg.definitions_ = Object.create(null);
  // Create a dictionary mapping desired function names in definitions_
  // to actual function names (to avoid collisions with user functions).
  Blockly.MicroAlg.functionNames_ = Object.create(null);

  if (Blockly.Variables) {
    if (!Blockly.MicroAlg.variableDB_) {
      Blockly.MicroAlg.variableDB_ =
          new Blockly.Names(Blockly.MicroAlg.RESERVED_WORDS_);
    } else {
      Blockly.MicroAlg.variableDB_.reset();
    }

    var defvars = [];
    var variables = Blockly.Variables.allVariables();
    for (var x = 0; x < variables.length; x++) {
      defvars[x] = Blockly.MicroAlg.variableDB_.getName(variables[x],
          Blockly.Variables.NAME_TYPE) + ' = None';
    }
    Blockly.MicroAlg.definitions_['variables'] = defvars.join('\n');
  }
};

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
Blockly.MicroAlg.finish = function(code) {
  // Convert the definitions dictionary into a list.
  var imports = [];
  var definitions = [];
  for (var name in Blockly.MicroAlg.definitions_) {
    var def = Blockly.MicroAlg.definitions_[name];
    if (def.match(/^(from\s+\S+\s+)?import\s+\S+/)) {
      imports.push(def);
    } else {
      definitions.push(def);
    }
  }
  var allDefs = imports.join('\n') + '\n\n' + definitions.join('\n\n');
  return allDefs.replace(/\n\n+/g, '\n\n').replace(/\n*$/, '\n\n\n') + code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
Blockly.MicroAlg.scrubNakedValue = function(line) {
  return line + '\n';
};

/**
 * Encode a string as a properly escaped MicroAlg string, complete with quotes.
 * @param {string} string Text to encode.
 * @return {string} MicroAlg string.
 * @private
 */
Blockly.MicroAlg.quote_ = function(string) {
  // TODO: This is a quick hack.  Replace with goog.string.quote
  string = string.replace(/\\/g, '\\\\')
                 .replace(/\n/g, '\\\n')
                 .replace(/\%/g, '\\%')
                 .replace(/'/g, '\\\'');
  return '"' + string + '"';
};

/**
 * Common tasks for generating MicroAlg from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Blockly.Block} block The current block.
 * @param {string} code The MicroAlg code created for this block.
 * @return {string} MicroAlg code with comments and subsequent blocks added.
 * @private
 */
Blockly.MicroAlg.scrub_ = function(block, code) {
  var commentCode = '';
  // Only collect comments for blocks that aren't inline.
  if (!block.outputConnection || !block.outputConnection.targetConnection) {
    // Collect comment for this block.
    var comment = block.getCommentText();
    if (comment) {
      commentCode += this.prefixLines(comment, '# ') + '\n';
    }
    // Collect comments for all value arguments.
    // Don't collect comments for nested statements.
    for (var x = 0; x < block.inputList.length; x++) {
      if (block.inputList[x].type == Blockly.INPUT_VALUE) {
        var childBlock = block.inputList[x].connection.targetBlock();
        if (childBlock) {
          var comment = this.allNestedComments(childBlock);
          if (comment) {
            commentCode += this.prefixLines(comment, '# ');
          }
        }
      }
    }
  }
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  var nextCode = this.blockToCode(nextBlock);
  return commentCode + code + nextCode;
};

// Commentaire de fin (de section non modifiée).

// Blocs et générateurs (groupés, pas comme dans l’original).
// Basés sur:
// http://code.google.com/p/blockly/source/browse/trunk/blocks
// http://code.google.com/p/blockly/source/browse/trunk/generators/python

// Bloc Programme
Blockly.Blocks['programme'] = {
  init: function() {
    this.setHelpUrl(malg_url + '#blocprogramme');
    this.setColour(160);
    this.appendStatementInput('VALUE')
        .appendField('Programme');
    this.setPreviousStatement(false);
    this.setNextStatement(false);
    this.setTooltip('Contient le programme.');
    this.setDeletable(false);
  }
};

// Gen Programme
Blockly.MicroAlg['programme'] = function(block) {
  var arg = Blockly.MicroAlg.statementToCode(block, 'VALUE') || '';
  // Le slice neutralise l’indentation,
  // et on passe à la ligne entre les ) et les (.
  var src = arg.substring(2).replace(/\)\(/gm, ')\n(');
  // Ensuite on marque le début et la fin histoire de ne garder que le code des
  // blocs situés dans Programme.
  return '««««««««««' + src + '»»»»»»»»»»';
};

// Bloc Commentaire
Blockly.Blocks['commentaire'] = {
  init: function() {
    this.setHelpUrl(malg_url + '#cmd-!!!');
    this.setColour(160);
    this.appendDummyInput()
        .appendField('!!!')
        .appendField(this.newQuote_(true))
        .appendField(new Blockly.FieldTextInput(''), 'COMZ')
        .appendField(this.newQuote_(false));
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('Commentaire. Aucune action n’est réalisée.');
  },
  newQuote_: function(open) {
    if (open == Blockly.RTL) {
      var file = 'quote1.png';
    } else {
      var file = 'quote0.png';
    }
    return new Blockly.FieldImage(Blockly.pathToBlockly + 'media/' + file,
                                  12, 12, '"');
  }
};

// Gen Commentaire
Blockly.MicroAlg['commentaire'] = function(block) {
  var arg = Blockly.MicroAlg.quote_(block.getFieldValue('COMZ'));
  return '(!!! ' + arg + ')';
};

// Bloc Affecter_a
// Gen Affecter_a
// Bloc Aide
// Gen Aide

// Bloc Afficher
Blockly.Blocks['afficher'] = {
  init: function() {
    this.setHelpUrl(malg_url);
    this.setColour(160);
    this.appendValueInput('VALUE')
        .appendField('Afficher');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('Afficher une valeur à l’utilisateur.');
  }
};

// Gen Afficher
Blockly.MicroAlg['afficher'] = function(block) {
  var arg = Blockly.MicroAlg.statementToCode(block, 'VALUE') || '';
  if (arg === '') return '(Afficher)';
  var num_lines = arg.split('\n').length;
  if (num_lines == 1) {
    // Prevent indentation if we only have one line.
    return '(Afficher ' + arg.substring(Blockly.MicroAlg.INDENT.length) + ')';
  } else {
    return '(Afficher\n' + arg + '\n)';
  }
};

// Bloc Bloc
// Gen Bloc

// Bloc Concatener
Blockly.Blocks['concatener'] = {
  init: function() {
    this.setHelpUrl(malg_url);
    this.setColour(160);
    this.appendValueInput('ADD0')
        .appendField('Concaténer');
    this.appendValueInput('ADD1');
    this.setOutput(true, 'String');
    this.setMutator(new Blockly.Mutator(['text_create_join_item']));
    this.setTooltip('Mettre des textes bout à bout.');
    this.itemCount_ = 2;
  },
  mutationToDom: function() {
    var container = document.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },
  domToMutation: function(xmlElement) {
    for (var x = 0; x < this.itemCount_; x++) {
      this.removeInput('ADD' + x);
    }
    this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
    for (var x = 0; x < this.itemCount_; x++) {
      var input = this.appendValueInput('ADD' + x);
      if (x == 0) {
        input.appendField('Concaténer');
      }
    }
    if (this.itemCount_ == 0) {
      this.appendDummyInput('EMPTY')
          .appendField('Concaténer');
    }
  },
  decompose: function(workspace) {
    var containerBlock = Blockly.Block.obtain(workspace,
                                           'text_create_join_container');
    containerBlock.initSvg();
    var connection = containerBlock.getInput('STACK').connection;
    for (var x = 0; x < this.itemCount_; x++) {
      var itemBlock = Blockly.Block.obtain(workspace, 'text_create_join_item');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return containerBlock;
  },
  compose: function(containerBlock) {
    // Disconnect all input blocks and remove all inputs.
    if (this.itemCount_ == 0) {
      this.removeInput('EMPTY');
    } else {
      for (var x = this.itemCount_ - 1; x >= 0; x--) {
        this.removeInput('ADD' + x);
      }
    }
    this.itemCount_ = 0;
    // Rebuild the block's inputs.
    var itemBlock = containerBlock.getInputTargetBlock('STACK');
    while (itemBlock) {
      var input = this.appendValueInput('ADD' + this.itemCount_);
      if (this.itemCount_ == 0) {
        input.appendField('Concaténer');
      }
      // Reconnect any child blocks.
      if (itemBlock.valueConnection_) {
        input.connection.connect(itemBlock.valueConnection_);
      }
      this.itemCount_++;
      itemBlock = itemBlock.nextConnection &&
          itemBlock.nextConnection.targetBlock();
    }
    if (this.itemCount_ == 0) {
      this.appendDummyInput('EMPTY')
          .appendField('Concaténer');
    }
  },
  saveConnections: function(containerBlock) {
    var itemBlock = containerBlock.getInputTargetBlock('STACK');
    var x = 0;
    while (itemBlock) {
      var input = this.getInput('ADD' + x);
      itemBlock.valueConnection_ = input && input.connection.targetConnection;
      x++;
      itemBlock = itemBlock.nextConnection &&
          itemBlock.nextConnection.targetBlock();
    }
  }
};

// Conteneur pour le mutator de Concatener
Blockly.Blocks['text_create_join_container'] = {
  init: function() {
    this.setColour(160);
    this.appendDummyInput()
        .appendField('Nbre de paramètres');
    this.appendStatementInput('STACK');
    this.setTooltip('Mettre ici le bon nombre de paramètres.');
    this.contextMenu = false;
  }
};

// Élément pour le mutator de Concatener
Blockly.Blocks['text_create_join_item'] = {
  init: function() {
    this.setColour(160);
    this.appendDummyInput()
        .appendField('un paramètre');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('À placer autant de fois que nécessaire.');
    this.contextMenu = false;
  }
};

// Gen Concatener
Blockly.MicroAlg['concatener'] = function(block) {
  var cmd = 'Concatener';
  var code;
  if (block.itemCount_ == 0) {
    code ='(' + cmd + ')';
  } else if (block.itemCount_ == 1) {
    var argument0 = Blockly.MicroAlg.statementToCode(block, 'ADD0') || '""';
    code = '(' + cmd + ' ' + argument0 + ')';
  } else {
    var args = [];
    for (var n = 0; n < block.itemCount_; n++) {
      args[n] = Blockly.MicroAlg.statementToCode(block, 'ADD' + n) ||
             Blockly.MicroAlg.INDENT + '""';
    }
    code = '(' + cmd + '\n' + args.join('\n') + '\n)';
  }
  return code;
};

// Bloc Demander
Blockly.Blocks['demander'] = {
  init: function() {
    this.setHelpUrl(malg_url);
    this.setColour(160);
    this.appendDummyInput()
        .appendField('Demander');
    this.setOutput(true, 'String');
    this.setTooltip('Demander une valeur à l’utilisateur.');
  }
};

// Gen Demander
Blockly.MicroAlg['demander'] = function(block) {
  return '(Demander)';
};

// Bloc Faire
// Gen Faire
// Bloc Initialiser
// Gen Initialiser
// Bloc Nombre
// Gen Nombre
// Bloc Si
// Gen Si
// Bloc Tant_que
// Gen Tant_que
// Bloc Texte
// Gen Texte
// Bloc Type
// Gen Type

// Bloc <
// Gen <
// Bloc <=
// Gen <=
// Bloc =
// Gen =
// Bloc =/
// Gen =/
// Bloc >
// Gen >
// Bloc >=
// Gen >=
// Bloc Booleen?
// Gen Booleen?
// Bloc Faux?
// Gen Faux?
// Bloc Nombre?
// Gen Nombre?
// Bloc Texte?
// Gen Texte?
// Bloc Vrai?
// Gen Vrai?

// Bloc texte litéral
Blockly.Blocks['texte'] = {
  init: function() {
    this.setHelpUrl(malg_url);
    this.setColour(160);
    this.appendDummyInput()
        .appendField(this.newQuote_(true))
        .appendField(new Blockly.FieldTextInput(''), 'TEXT')
        .appendField(this.newQuote_(false));
    this.setOutput(true, 'String');
    this.setTooltip('Texte');
  },
  newQuote_: function(open) {
    if (open == Blockly.RTL) {
      var file = 'quote1.png';
    } else {
      var file = 'quote0.png';
    }
    return new Blockly.FieldImage(Blockly.pathToBlockly + 'media/' + file,
                                  12, 12, '"');
  }
};

// Gen texte litéral
Blockly.MicroAlg['texte'] = function(block) {
  var code = Blockly.MicroAlg.quote_(block.getFieldValue('TEXT'));
  return code;
};

// Bloc nombre litéral
Blockly.Blocks['nombre'] = {
  init: function() {
    this.setHelpUrl(malg_url);
    this.setColour(230);
    this.appendDummyInput()
        .appendField(new Blockly.FieldTextInput('0',
        Blockly.FieldTextInput.numberValidator), 'NUM');
    this.setOutput(true, 'Number');
    this.setTooltip("Nombre");
  }
};

// Gen nombre litéral
Blockly.MicroAlg['nombre'] = function(block) {
  return block.getFieldValue('NUM');
};

// Bloc opérations
Blockly.Blocks['operations'] = {
  init: function() {
    var OPERATORS =
        [['+', 'ADD'],
         ['-', 'MINUS'],
         ['×', 'MULTIPLY'],
         ['÷', 'DIVIDE']];
    this.setHelpUrl(malg_url);
    this.setColour(230);
    this.setOutput(true, 'Number');
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(OPERATORS), 'OP');
    this.appendValueInput('A')
        .setCheck('Number');
    this.appendValueInput('B')
        .setCheck('Number')
    this.setInputsInline(true);
    // Assign 'this' to a variable for use in the tooltip closure below.
    var thisBlock = this;
    this.setTooltip(function() {
      var mode = thisBlock.getFieldValue('OP');
      var TOOLTIPS = {
        'ADD'     : "Renvoie la somme des deux nombres.",
        'MINUS'   : "Renvoie le quotient des deux nombres.",
        'MULTIPLY': "Renvoie la différence des deux nombres.",
        'DIVIDE'  : "Renvoie le produit des deux nombres.",
      };
      return TOOLTIPS[mode];
    });
  }
};

// Gen opérations
Blockly.MicroAlg['operations'] = function(block) {
  var OPERATORS = {
    'ADD':      '+',
    'MINUS':    '-',
    'MULTIPLY': '*',
    'DIVIDE':   '/'
  };
  var operator = OPERATORS[block.getFieldValue('OP')];
  var inputA = Blockly.MicroAlg.statementToCode(block, 'A');
  var inputB = Blockly.MicroAlg.statementToCode(block, 'B');
  var argument0 = inputA.substring(Blockly.MicroAlg.INDENT.length) || '0';
  var argument1 = inputB.substring(Blockly.MicroAlg.INDENT.length) || '0';
  var code = '(' + operator + ' ' + argument0 + ' ' + argument1 + ')';
  return code;
};

// Bloc Faux
// Gen Faux
// Bloc Rien
// Gen Rien
// Bloc Vrai
// Gen Vrai
