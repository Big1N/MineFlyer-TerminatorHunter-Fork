const mineflayer = require('mineflayer')
const pvp = require('mineflayer-pvp').plugin
const { pathfinder, Movements, goals} = require('mineflayer-pathfinder')
const armorManager = require('mineflayer-armor-manager')
const toolPlugin = require('mineflayer-tool').plugin
const minecraftHawkEye = require('minecrafthawkeye');
const autoeat = require("mineflayer-auto-eat")
const radarPlugin = require('mineflayer-radar')(mineflayer);
const lumberjack = require('lumberjack');
const navigatePlugin = require('mineflayer-navigate')(mineflayer);
const scaffoldPlugin = require('mineflayer-scaffold')(mineflayer);
const blockFinderPlugin = require('mineflayer-blockfinder')(mineflayer);
const vec3 = require('vec3');
const Dutie = require('dutie');
const spiral = require('spiralloop');

const bot = mineflayer.createBot({
    host: 'Enter Server IP Here',             // minecraft server ip
    username: 'MC Username OR Email IF prenium', // minecraft username
    password: 'MC Prenium Account Password Optional If Not Using One',          // minecraft password, comment out if you want to log into online-mode=false servers
    port: 25565,                // only set if you need a port that isn't 25565
    version: false,             // only set if you need a specific version or snapshot (ie: "1.8.9" or "1.16.5"), otherwise it's set automatically
    auth: 'mojang'              // only set if you need microsoft auth, then set this to 'microsoft'
  })    

bot.loadPlugin(pvp)
bot.loadPlugin(armorManager)
bot.loadPlugin(pathfinder)
bot.loadPlugin(autoeat)
bot.loadPlugin(toolPlugin)
navigatePlugin(bot);
blockFinderPlugin(bot);
scaffoldPlugin(bot);

bot.on('playerCollect', (collector, itemDrop) => {
  if (collector !== bot.entity) return

  setTimeout(() => {
    const sword = bot.inventory.items().find(item => item.name.includes('sword'))
    if (sword) bot.equip(sword, 'hand')
  }, 267)
})

bot.on('playerCollect', (collector, itemDrop) => {
  if (collector !== bot.entity) return

  setTimeout(() => {
    const shield = bot.inventory.items().find(item => item.name.includes('shield'))
    if (shield) bot.equip(shield, 'off-hand')
  }, 250)
})

let guardPos = null

function guardArea (pos) {
  guardPos = pos.clone()

  if (!bot.pvp.target) {
    moveToGuardPos()
  }
}

function stopGuarding () {
  guardPos = null
  bot.pvp.stop()
  bot.pathfinder.setGoal(null)
}

function moveToGuardPos () {
  const mcData = require('minecraft-data')(bot.version)
  bot.pathfinder.setMovements(new Movements(bot, mcData))
  bot.pathfinder.setGoal(new goals.GoalBlock(guardPos.x, guardPos.y, guardPos.z))
}

bot.on('stoppedAttacking', () => {
  if (guardPos) {
    moveToGuardPos()
  }
})

bot.on('physicTick', () => {
  if (bot.pvp.target) return
  if (bot.pathfinder.isMoving()) return

  const entity = bot.nearestEntity()
  if (entity) bot.lookAt(entity.position.offset(0, entity.height, 0))
})

bot.on('physicTick', () => {
  if (!guardPos) return

  const filter = e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 32 &&
                      e.mobType !== 'Armor Stand' // Mojang classifies armor stands as mobs for some reason?

  const entity = bot.nearestEntity(filter)
  if (entity) {
    bot.pvp.attack(entity)
  }
})

bot.on('chat', (username, message) => {
  if (message === 'follow') {
    const player = bot.players[username]

    if (!player) {
      bot.chat("Where are you?, You cant Hide Forever!")
      return
    }

    bot.chat('i will follow you now')
    goto(player.entity.position)
  }

  if (message === 'hunt me') {
    const player = bot.players[username] 
    maxDistance: 10000

    if (!player) {
      bot.chat("Where are you?, You cant Hide Forever!")
      return
    }

    bot.chat('Im Comming to hunt you now! >:)')
    bot.pvp.attack(player.entity)

  }

  if (message === 'stop') {
    bot.chat('I will not Hunt You anymore Your Safe For Now >:(')
    stopGuarding()
  }

   bot.once("spawn", () => {
    bot.autoEat.options = {
      priority: "foodPoints",
      startAt: 14,
      bannedFood: [],
    }
  })
  
  // The bot eats food automatically and emits these events when it starts eating and stops eating.
  
  bot.on("autoeat_started", () => {
    console.log("Auto Eat started!")
  })
  
  bot.on("autoeat_stopped", () => {
    console.log("Auto Eat stopped!")
  })
  let target = null

  bot.on('chat', (username, message) => {
    if (username === bot.username) return
    target = bot.players[username].entity
    let entity
    switch (message) {
      case 'forward':
        bot.setControlState('forward', true)
        break
      case 'back':
        bot.setControlState('back', true)
        break
      case 'left':
        bot.setControlState('left', true)
        break
      case 'right':
        bot.setControlState('right', true)
        break
      case 'sprint':
        bot.setControlState('sprint', true)
        break
      case 'stop':
        bot.clearControlStates()
        break
      case 'jump':
        bot.setControlState('jump', true)
        bot.setControlState('jump', false)
        break
      case 'jump a lot':
        bot.setControlState('jump', true)
        break
      case 'stop jumping':
        bot.setControlState('jump', false)
        break
      case 'attack':
        entity = bot.nearestEntity()
        if (entity) {
          bot.attack(entity, true)
        } else {
          bot.chat('no nearby entities')
        }
        break
      case 'mount':
        entity = bot.nearestEntity((entity) => { return entity.type === 'object' })
        if (entity) {
          bot.mount(entity)
        } else {
          bot.chat('no nearby objects')
        }
        break
      case 'dismount':
        bot.dismount()
        break
      case 'move vehicle forward':
        bot.moveVehicle(0.0, 1.0)
        break
      case 'move vehicle backward':
        bot.moveVehicle(0.0, -1.0)
        break
      case 'move vehicle left':
        bot.moveVehicle(1.0, 0.0)
        break
      case 'move vehicle right':
        bot.moveVehicle(-1.0, 0.0)
        break
      case 'tp':
        bot.entity.position.y += 10
        break
      case 'pos':
        bot.chat(bot.entity.position.toString())
        break
      case 'yp':
        bot.chat(`Yaw ${bot.entity.yaw}, pitch: ${bot.entity.pitch}`)
        break

        bot.on('mount', (vehicle) => {
          bot.chat(`mounted ${bot.vehicle.objectType}`)

        })
        
        bot.on('dismount', (vehicle) => {
          bot.chat(`dismounted ${vehicle.objectType}`)
        })  
    }
  })
  
function useInvsee (username, showEquipment) {
  bot.once('windowOpen', (window) => {
    const count = window.containerItems().length
    const what = showEquipment ? 'equipment' : 'inventory items'
    if (count) {
      bot.chat(`${username}'s ${what}:`)
      sayItems(window.containerItems())
    } else {
      bot.chat(`${username} has no ${what}`)
    }
  })
  if (showEquipment) {
    // any extra parameter triggers the easter egg
    // and shows the other player's equipment
    bot.chat(`/invsee ${username} 1`)
  } else {
    bot.chat(`/invsee ${username}`)
  }
}

function itemToString (item) {
  if (item) {
    return `${item.name} x ${item.count}`
  } else {
    return '(nothing)'
  }
}

function itemByType (items, type) {
  let item
  let i
  for (i = 0; i < items.length; ++i) {
    item = items[i]
    if (item && item.type === type) return item
  }
  return null
}

function itemByName (items, name) {
  let item
  let i
  for (i = 0; i < items.length; ++i) {
    item = items[i]
    if (item && item.name === name) return item
  }
  return null
}
  Task = Dutie.Task,
	CallTask = Dutie.CallTask,
	RunTask = Dutie.RunTask,
	ExecTask = Dutie.ExecTask;

main = new Dutie();

bot.on('chat', chatMessage);

bot.on('kicked', function(reason) {
	console.log('KICKED!',reason);
});

bot.on('end', function() {
	console.log('ENDED!');
});

/*bot.on('spawn', function() {
	setTimeout(function() {
		bot tools = new RunTask(getTools, [], { priority: 5, actPriority: 8 });
		main.add(tools);
		
		bot player = 'Your username';
		bot give = new RunTask(tossTools, [player], { priority: 3, actPriority: 4});
		main.add(give);
	},10*1000);
});*/

function chatMessage(username, message) {
	console.log(username + ': ' + message);
	if (message == 'tools') {
		tools = new RunTask(getTools, [], { priority: 5, actPriority: 8 });
		main.add(tools);
	} else if (message == 'list') {
		listInventory();
	} else if (message == 'give tools') {
		give = new RunTask(tossTools, [username], { priority: 3, actPriority: 4});
		main.add(give);
	} else if (message == 'toss all') {
		console.log('tossing all');
		toss = new RunTask(tossAll, [username], { priority: 1, actPriority: 2});
		main.add(toss);
	} else if (message == 'come') {
		entity = bot.players[username].entity;
		console.log(entity.position);
		path = bot.navigate.findPathSync(entity.position);
		come = new CallTask(bot.navigate.walk, [path.path], { priority: 2, actPriority: 3, complete: function() { console.log('done') }});
		main.add(come);
	}
	if (message == 'follow') {
		entity = bot.players[username].entity;
		//bot follow = new CallTask(bot.navigate.to, [entity.position], { priority: 2, actPriority: 3});
	}
	//////////// COPIED FROM INVENTORY.JS
	/*if (/^toss (\d+) /.test(message)) {
    words = message.split(" ");
    amount = parseInt(words[1], 10);
    name = words[2];
    item = itemByName(name);
    if (item) {
      bot entity = bot.players[username].entity;
      bot.lookAt(entity.position.offset(0, entity.height, 0));
      
      bot.toss(item.type, null, amount, function(err) {
        if (err) {
          bot.chat("unable to toss " + item.name);
          console.error(err.stack);
        } else {
          bot.chat("tossed " + amount + " " + item.name);
        }
      });
    } else {
      bot.chat("I have no " + name);
    }
  } else if (/^toss /.test(message)) {
    words = message.split(" ");
    name = words[1];
    item = itemByName(name);
    if (item) {
      bot entity = bot.players[username].entity;
      bot.lookAt(entity.position.offset(0, entity.height, 0));
      
      bot.tossStack(item, function(err) {
        if (err) {
          bot.chat("unable to toss " + item.name);
          console.error(err.stack);
        } else {
          bot.chat("tossed " + item.name);
        }
      });
    } else {
      bot.chat("I have no " + name);
    }
  }*/
  ////////////////////////
  ////////////////////////
}


function getTools(m) {
	lumb = lumberjack(4, bot);
	console.log('lumb');
	
	/*bot wood = bot.inventory.findInventoryItem(17, null);
	bot.lookAt(bot.entity.position.offset(-2, 0, 0));
    if (wood) bot.tossStack(wood);*/
	
	location = vec3(0, 0, 0);
	foundBench = { val: false};
	benchExists = new ExecTask(function() {
		spiral([7, 4, 7], function(x, y, z) {
			x += Math.floor(bot.entity.position.x) - 3;
			y += Math.floor(bot.entity.position.y) - 1;
			z += Math.floor(bot.entity.position.z) - 3;
			block = bot.blockAt(vec3(x, y, z)) || { name: null };
			if (block.name == 'workbench') {
				location.x = x;
				location.y = y;
				location.z = z;
				foundBench.val = true;
				console.log('FOUND BENCH');
				return true;
			}
		});
	});
  
	
	makePlanks = new RunTask(craftPlanks, [foundBench]);
	
	getBenchLocation = new ExecTask(function() { 
		if (foundBench.val) return;
		spiral([7, 6, 7], function(x, y, z) {
			if (x == 3 && z == 3) return;
			x += Math.floor(bot.entity.position.x) - 3;
			y += Math.floor(bot.entity.position.y) - 3;
			z += Math.floor(bot.entity.position.z) - 3;
			y -= 1; // Prefer feet height
			block = bot.blockAt(vec3(x, y, z));
			block_under = bot.blockAt(vec3(x, y-1, z));
			console.log(x + ', ' + y + ', ' + z + ' => ' + block.name + ', ' + block_under.name);
			if (block.name == 'air' && block_under.name != 'air') {
				location.x = x;
				location.y = y;
				location.z = z;
				return true;
			}
		}
  )}, [], { start: function() { if (foundBench.val) return true; }});
	
	centerTask = new ExecTask(function() {
		if (location.y == -1) return;
		bot.entity.position = center(bot.entity.position);
	});
	waitTask = new CallTask(setTimeout, [null, 200], { location: 0, start: function() { if (foundBench.val) return true; }});
	
	placeBench = new RunTask(placeCraftBench, [location], { start: function() {
		if (foundBench.val) return true;
	}});
	
	craftPick = new RunTask(craftPickaxe, [location]);
	
	stone = Array();
	safeStandLocation = vec3(0, 0, 0);
	
	findStone = new ExecTask(function() {
		console.log('searching for stone');
		safeStandLocation.x = bot.entity.position.x;
		safeStandLocation.y = bot.entity.position.y;
		safeStandLocation.z = bot.entity.position.z;
		
		spiral([40, 16, 40], function(x, y, z) {
			x += Math.floor(bot.entity.position.x) - 20;
			y += Math.floor(bot.entity.position.y) - 8;
			z += Math.floor(bot.entity.position.z) - 20;
			
			 block = bot.blockAt(vec3(x, y, z));
			if (block.name == 'stone' && block.metadata == 0) stone.push(block);
			if (stone.length > 35) return true; // Have plenty just in case some get destroyed.
		});
	});
	 switchPick = new RunTask(switchToPick);
	 mineStone = new RunTask(getStone, [stone]);
	 goBack = new RunTask(goBackToBench, [safeStandLocation]);
	 craftTools = new RunTask(craftStoneTools, [location]);
	
	lumb.dependBy(benchExists).dependBy(makePlanks).dependBy(getBenchLocation).dependBy(centerTask).dependBy(waitTask).dependBy(placeBench)
		.dependBy(craftPick).dependBy(findStone).dependBy(switchPick).dependBy(mineStone).dependBy(goBack).dependBy(craftTools);
	m.addAll(lumb);
}

function craftPlanks(m, b) {
	console.log('craft planks');
	 bench = b.val;
	 wood = bot.inventory.findInventoryItem(17, null);
	 plankRecipeList = bot.recipesFor(5, null, null, null);
	 plankRecipe;
	for (i = 0; i < plankRecipeList.length; i++) {
		 listmeta = plankRecipeList[i].ingredients[0].metadata
		if (wood.metadata == listmeta || !listmeta) plankRecipe = plankRecipeList[i];
	}
	if (!plankRecipe) {
		plankRecipe = plankRecipeList[0];
	}
	
	 benchRecipe = bot.recipesAll(58, null, null, null)[0];
	if (!bench) console.log('craft crafting bench');
	
	 craftTask = new CallTask(bot.craft, [plankRecipe, (bench ? 3 : 4), null]); // 3:4 => Don't need to make extra if we already have a crafting bench
	 benchTask = new CallTask(bot.craft, [benchRecipe, 1, null]);
	if (!bench) { // loc contains position of crafting table if one exists
		benchTask.dependOn(craftTask);
		m.addAll(craftTask);
	} else {
		m.add(craftTask); // Don't make crafting bench if we already have one nearby
	}

function placeCraftBench(m, loc) {
	console.log('place crafting bench');
	 bench = bot.inventory.findInventoryItem(58, null);
	 switchToBench = new CallTask(bot.equip, [bench, 'hand']);
	 wait = new CallTask(setTimeout, [null, 200], { location: 0});
	
	refBlock = bot.blockAt(loc.clone().minus(vec3(0, 1, 0)));
	console.log('refBlock',refBlock);
	 placeBench = new RunTask(bot.placeBlock, [refBlock, vec3(0, 1, 0)], { manager: false});
	switchToBench.dependBy(wait);
	wait.dependBy(placeBench);
	
	m.addAll(placeBench);
}

function center(p) {
	console.log('center on block');
	return p.floored().offset(0.5,0,0.5);
}

function craftPickaxe(m, location) {
	console.log('Craft sticks and pickaxe');
  stickRecipe = bot.recipesAll(280, null, false)[0];
	craftSticks = n
}

function switchToPick(m) {
	console.log('switch to pickaxe');
	pick = bot.inventory.findInventoryItem(270);
	switchToBench = new CallTask(bot.equip, [pick, 'hand']);
	m.add(switchToBench);
}

function getStone(m, stone) {
	
	finish = function() {
		if (this.currentTask.startFunc) { // If just bot.scaffold.to rather than digImmediate
			m.add(new RunTask(switchToPick));
		}
		stoneInv = bot.inventory.findInventoryItem(4, null) || { count: 0};
		if (stoneInv.count < 9) { // 9 is the exact amount needed for tools. Add more if needed.
			stone.splice(0, 1);
			
			sides = [vec3(1, 0, 0), vec3(-1, 0, 0), vec3(0, 0, 1), vec3(0, 0, -1)];
			found = false;
			for (y = 0; y < 2; y++) {
				for (s = 0; s < sides.length; s++) {
					location = bot.entity.position.clone().floor();
					location.add(sides[s]);
					location.add(vec3(0, y, 0));
					if (bot.blockAt(location).name == 'stone') {
						found = true;
						console.log('Location',location);
						digImmediate.reset([bot.blockAt(location)]);
						m.add(digImmediate);
						break;
					}
				}
				if (found) break;
			}
			
			if (!found) {
				if (!stone[0].position) return;
				digStone.reset([stone[0].position]);
				m.add(digStone);
			}
		} else console.log('collected all stone');
	}
	
	start = function() {
		if (bot.blockAt(stone[0].position).name != 'stone') {
			stone.splice(0, 1);
			m.add(digStone);
		}
	}
	
	digStone = new CallTask(bot.scaffold.to, [stone[0].position], { complete: finish, start: start });
	
	digImmediate = new CallTask(bot.dig, [stone[0].position], { complete: finish });
	
	m.add(digStone);
}

function goBackToBench(m, loc) {
	m.add(new CallTask(bot.scaffold.to, [loc]));
}

function craftStoneTools(m, loc) {
	bench = bot.blockAt(loc);
	
	stoneSwordRecipe = bot.recipesAll(272, null, true)[0];
	craftStoneSword = new CallTask(bot.craft, [stoneSwordRecipe, 1, bench]);
	
	stonePickRecipe = bot.recipesAll(274, null, true)[0];
	craftStonePick = new CallTask(bot.craft, [stonePickRecipe, 1, bench]);
	
	stoneAxeRecipe = bot.recipesAll(275, null, true)[0];
	craftStoneAxe = new CallTask(bot.craft, [stoneAxeRecipe, 1, bench]);
	
	stoneShovelRecipe = bot.recipesAll(273, null, true)[0];
	craftStoneShovel = new CallTask(bot.craft, [stoneShovelRecipe, 1, bench]);
	
	m.add(craftStoneSword).add(craftStonePick).add(craftStoneAxe).add(craftStoneShovel);
 } 

 
 function tossAll(m, username) {
 	entity;
	if (bot.players[username]) entity = bot.players[username].entity;
    if (entity) bot.lookAt(entity.position.offset(0, entity.height, 0));
    
    console.log(bot.inventory.slots);
     	
	for (i = 0; i < bot.inventory.slots.length; i++) {
		console.log(bot.inventory.slots[i]);
		item = bot.inventory.slots[i];
		if (item) {
			toss = new CallTask(bot.tossStack, [item]);
			m.add(toss);
		}
	}
 }

 function tossTools(m, player) {
	entity = bot.players[player].entity;
	bot.lookAt(entity.position.offset(0, entity.height, 0), true);
	wait = new CallTask(setTimeout, [null, 500], {location: 0, priority: 1});
	m.add(wait);
	
	for (i = 272; i <= 275; i++) {
		item = bot.inventory.findInventoryItem(i);
		if (item) {
			toss = new CallTask(bot.tossStack, [item]);
			m.add(toss);
		}
	}
 }

 function listInventory() {
  text = bot.inventory.items().map(itemStr).join(", ");
  if (text == '') bot.chat('(Nothing)');
 }

 function itemStr(item) {
  if (item) {
    return item.name + " x " + item.count;
  } else {
    return "(nothing)";
  }
 }

 function itemByName(name) {
  return bot.inventory.items().filter(function(item) {
    return item.name === name;
  })[0];
  }
 }
})
