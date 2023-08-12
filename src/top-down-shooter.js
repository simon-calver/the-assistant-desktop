
class TopDownShooter extends TiledScene { //Phaser.Scene {
	constructor(data) {
    super({ 
      key: data.key, 
      assetsPath: 'assets',
      mapName: data.map
    });
    this.map = data.map;
	}

  mainPreLoad() {
    // Load fonts 
    // this.load.bitmapFont('meyrin', 'assets/fonts/meyrin/meyrin.png', 'assets/fonts/meyrin/meyrin.xml');

    // The full sized doors are used for the highlight layer, is loading this twice the best idea?
    this.load.spritesheet('doors', 'assets/tilemaps/doors.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('doors-full', 'assets/tilemaps/doors.png', { frameWidth: 16, frameHeight: 32 });

    // Image effects
    this.load.plugin('rexoutlinepipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexoutlinepipelineplugin.min.js', true);
    this.load.plugin('rexshockwavepipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexshockwavepipelineplugin.min.js', true);

    // Enemy sprite sheets
    this.load.spritesheet('mantis', 'assets/sprites/enemies/MantisMove.png', {frameWidth: 32, frameHeight: 32});
    this.load.spritesheet('mantis-attack', 'assets/sprites/enemies/MantisAttack.png', {frameWidth: 32, frameHeight: 32});
    this.load.spritesheet('bug', 'assets/sprites/enemies/BeetleMove.png', {frameWidth: 32, frameHeight: 32});
    this.load.spritesheet('bug-attack', 'assets/sprites/enemies/BeetleAttack.png', {frameWidth: 32, frameHeight: 32});
    this.load.spritesheet('worm', 'assets/sprites/enemies/MaggotWalk.png', {frameWidth: 32, frameHeight: 32});
    this.load.spritesheet('worm-attack', 'assets/sprites/enemies/MaggotSpit.png', {frameWidth: 32, frameHeight: 32});

    // NPCs
    this.load.spritesheet('rat', 'assets/sprites/enemies/$Rat.png', {frameWidth: 26, frameHeight: 26});    

    // Player sprite
    this.load.spritesheet('assistant', 'assets/sprites/player/$Dr Frankenstien2.png', {frameWidth: 24, frameHeight: 32});

    // Sounds
    this.loadAudio();
    
    // Items
    this.load.multiatlas('weapons', 'assets/sprites/weapons/weapons.json', 'assets/sprites/weapons');
    this.load.multiatlas('items', 'assets/sprites/items/items.json', 'assets/sprites/items');
    
    // JSON files
    this.load.json('weaponParameters', 'assets/parameters/weapons.json'); 
  }

  loadAudio() {
    this.load.audio('door-open-2', 'assets/audio/door-open-2.mp3');
    this.load.audio('door-close-2', 'assets/audio/door-close-2.mp3');

    this.load.audio('footsteps', 'assets/audio/footsteps-1.mp3');

    // Weapon sounds
    this.load.audio('pistol-shot', 'assets/audio/weapons/pistol-shot.mp3');  
    this.load.audio('pistol-heavy-shot', 'assets/audio/weapons/pistol-heavy-shot.mp3');
    this.load.audio('pistol-silenced-shot', 'assets/audio/weapons/pistol-silenced-shot.mp3');
    this.load.audio('pistol-empty', 'assets/audio/weapons/pistol-empty.mp3');
    this.load.audio('rifle-shot', 'assets/audio/weapons/rifle-shot.mp3');  
    this.load.audio('rifle-empty', 'assets/audio/weapons/rifle-empty.mp3');  
    this.load.audio('sniper-shot', 'assets/audio/weapons/sniper-shot.mp3');      
    this.load.audio('shotgun-shot', 'assets/audio/weapons/shotgun-shot.mp3');      
    this.load.audio('shotgun-empty', 'assets/audio/weapons/shotgun-empty.mp3'); 
    this.load.audio('pulse-shot', 'assets/audio/weapons/pulse-shot.mp3');  
    this.load.audio('heavy-shot', 'assets/audio/weapons/heavy-shot.mp3');      
    
    // this.load.audio('pulse-empty', 'assets/audio/weapons/shotgun-empty.mp3'); 

    this.load.audio('bullet-body-hit', 'assets/audio/weapons/bullet-body-hit.mp3'); 
    this.load.audio('body-hit', 'assets/audio/weapons/body-hit.mp3'); 
  }
 
  addAudio() {
    // Adds all sounds to a dict, is this performant? Could also add them closer to where they are used
		this.audio = {};
  
    this.audio['door-open-2'] = this.sound.add('door-open-2');
    this.audio['door-close-2'] = this.sound.add('door-close-2');

    this.audio['footsteps'] = this.sound.add('footsteps', { volume: 0.4 });

    this.audio['pistol-shot'] = this.sound.add('pistol-shot');    
    this.audio['pistol-heavy-shot'] = this.sound.add('pistol-heavy-shot');
    this.audio['pistol-silenced-shot'] = this.sound.add('pistol-silenced-shot');
    this.audio['pistol-empty'] = this.sound.add('pistol-empty');
    this.audio['rifle-shot'] = this.sound.add('rifle-shot');    
    this.audio['rifle-empty'] = this.sound.add('rifle-empty');    
    this.audio['sniper-shot'] = this.sound.add('sniper-shot');    
    this.audio['shotgun-shot'] = this.sound.add('shotgun-shot');    
    this.audio['shotgun-empty'] = this.sound.add('shotgun-empty');  
    this.audio['pulse-shot'] = this.sound.add('pulse-shot');    
    this.audio['pulse-empty'] = this.sound.add('shotgun-empty');  
    this.audio['heavy-shot'] = this.sound.add('heavy-shot');    
    this.audio['heavy-empty'] = this.sound.add('shotgun-empty');  

    this.audio['bullet-body-hit'] = this.sound.add('bullet-body-hit');   
    this.audio['body-hit'] = this.sound.add('body-hit');  
	}

  mainCreate(mapData) {
    // Shader plugin to add outline (or glow)
    this.postFxPlugin = this.plugins.get('rexoutlinepipelineplugin');
    this.postFxPluginShockwave = this.plugins.get('rexshockwavepipelineplugin');
        
    this.addAudio();
    this.addCollisionGroups();
    this.createAnimations();

    this.player = new Player(this, mapData.objects.find(obj => obj.name == 'start').x, mapData.objects.find(obj => obj.name == 'start').y);

    // Add additional things from map meta data
    this.addDoors(mapData);
    if (useLighting) {
      this.addLights(mapData);
    }
    this.addItems(mapData); 
    this.addEnemies(mapData);

    this.addCollisionEvents();

    this.scene.launch('UIOverlay', {currentScene: this.scene, collectableTarget: this.collectableTarget});
  }

  addCollisionGroups() {
		// Add groups for interactable things, runChildUpdate means it updates using the update method in the class
    this.enemies = this.add.group().setDepth(2); // Make them the same depth as the player;
    this.enemies.add(this.physics.add.group({ classType: Mantis, runChildUpdate: true }).setName('Mantis')); // Use setName so the class can easiy be found later
    this.enemies.add(this.physics.add.group({ classType: BloodBug, runChildUpdate: true }).setName('BloodBug'));
    this.enemies.add(this.physics.add.group({ classType: CreepWorm, runChildUpdate: true }).setName('CreepWorm'));
    this.enemies.add(this.physics.add.group({ classType: Rat, runChildUpdate: true }).setName('Rat'));
    
    this.playerBullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
    
    this.doors = this.physics.add.staticGroup({ classType: Door });
    this.soundColliders = this.physics.add.staticGroup({ classType: SoundCollider });    
    this.lightSources = this.physics.add.staticGroup({ classType: Light }); 

    this.blood = this.physics.add.group();
	}

	addCollisionEvents() {
    // Player collision with obstacles
    this.physics.add.collider(this.player, this.collisionLayer);	
    this.physics.add.collider(this.player, this.doors);	

    // Enemy collision with obstacles, they don't change direction if using path finding
    this.physics.add.collider(this.enemies, this.collisionLayer, function(enemy, wall) {	
      enemy.changeDirection();
    });	
    this.physics.add.collider(this.enemies, this.doors, function(enemy, wall) {	
      enemy.changeDirection();
    });	
    this.physics.add.collider(this.enemies, this.enemies);	

    // Enemy behaviour
    this.physics.add.overlap(this.player, this.enemies, function(player, enemy) {	
      enemy.attack(player);		
    });	

    this.physics.add.overlap(this.lightSources, this.enemies, function(light, enemy) {	
      enemy.reactToLight(light);//.getCenter());
    });	
    this.physics.add.overlap(this.soundColliders, this.enemies, function (sound, enemy) {
      enemy.reactToSound(sound.getTargetLocation(), sound.volume); 
    });
    this.physics.add.overlap(this.blood, this.enemies, function (blood, enemy) {
      enemy.reactToBlood(blood); 
    });

    // Weapons
    this.physics.add.collider(this.playerBullets, this.enemies, function(bullet, enemy) {
      enemy.receiveDamage(bullet.damage);
      bullet.destroy();
    });
    this.physics.add.collider(this.playerBullets, this.collisionLayer, function(bullet, wall) {
      bullet.destroy();
    });
	}

	createAnimations() {	    
    const direction = ['down', 'right', 'left', 'up']; 
    
    // Enemy animations
    const enemyNames = ['mantis', 'bug', 'worm'];
    const attackAnimSize = [7, 6, 7] 
    for (var i = 0; i < enemyNames.length; i++) {	           
      for (var j = 0; j < 4; j++) {
        this.anims.create({
          key: `${enemyNames[i]}_move_${direction[j]}`,
          frames: this.anims.generateFrameNumbers(enemyNames[i], { start: 4*j, end: 4*j + 3 }),
          frameRate: 5
        });
        this.anims.create({
          key: `${enemyNames[i]}_attack_${direction[j]}`,
          frames: this.anims.generateFrameNumbers(`${enemyNames[i]}-attack`, { start: attackAnimSize[i]*j, end: attackAnimSize[i]*j + attackAnimSize[i] - 1 }),
          frameRate: 8,
          repeat: 0
        });
        this.anims.create({
          key: `${enemyNames[i]}_idle_${direction[j]}`,
          frames: this.anims.generateFrameNumbers(enemyNames[i], { frames: [4*j] }),
          frameRate: 8,
          repeat: 0
        });
      }
    }
    
    // NPC animations           
    for (var i = 0; i < 4; i++) {
      this.anims.create({
        key: `rat_move_${direction[i]}`,
        frames: this.anims.generateFrameNumbers('rat', {start: 3*i, end: 3*i + 2}),
        frameRate: 5
      });
      this.anims.create({
        key: `rat_idle_${direction[i]}`,
        frames: this.anims.generateFrameNumbers('rat', { frames: [3*i] }),
        frameRate: 8,
        repeat: 0
      });
    }
    
    // Door open animations, the upper and lower parts are animated separately so they can be at different depths, is this neccessary?
    const doorSpriteSheetWidth = 7; // It may be better to determine this from the spritesheet
    for (var i = 0; i < doorSpriteSheetWidth; i++) {
      this.anims.create({
        key: 'open_lower_' + i,
        frames: this.anims.generateFrameNumbers('doors', { frames: [i + doorSpriteSheetWidth, i + 3*doorSpriteSheetWidth, i + 5*doorSpriteSheetWidth] }),//, 1 + 84] }),
        frameRate: 5
      });
      this.anims.create({
        key: 'open_upper_' + i,
        frames: this.anims.generateFrameNumbers('doors', { frames: [i, i + 2*doorSpriteSheetWidth, i + 4*doorSpriteSheetWidth] }),//, 1 + 72] }), 1 + 12, 1 + 36, 1 + 60
        frameRate: 5
      });
    }

    // Player animations
    for (var i = 0; i < direction.length; i++) { 
      this.anims.create({
        key: `assistant_move_${direction[i]}`,
        frames: this.anims.generateFrameNumbers('assistant', {start: 3*i, end: 3*i + 2}),
        frameRate: 8
      });
    }
	}

  getObjectsByName(objects, objectName, objectType=null) {
    let itemList = objects.filter(function (object) { 
      if (objectType == null){
        return object.name == objectName;
      } else {
        return object.name == objectName && object.type == objectType;
      }
    });
    return itemList;
  }

  addDoors(mapData) {
    let doorObjects = this.getObjectsByName(mapData.objects, 'door'); 
    for (let doorObject of doorObjects) {
      let door = this.doors.create(
        doorObject.x + 1/2*tileSize, 
        doorObject.y + 3/2*tileSize, 
        parseInt(doorObject.type)
      ); 
      door.setParameters(
        doorObject.properties.find(obj => obj.name == 'Orientation').value,
        doorObject.properties.find(obj => obj.name == 'Key').value
      );
      door.pickupDistance = 1000;
    }
  }

  addLights(mapData) {
    let lightSources = this.getObjectsByName(mapData.objects, 'light');    
    for (var lightSource of lightSources) {
      this.lightSources.create(
        lightSource.x, 
        lightSource.y, 
        { 'radius': 100, 'colour': 0xffe65f, 'intensity': 0.8 }        
      )
      // this.lights.addLight(); //f0f0c2
    }
  }

  addItems(mapData) {
    // Get all collectable item locations from map
    const targetItems = this.getObjectsByName(mapData.objects, 'collectable');
    for (var targetItem of Phaser.Math.RND.shuffle(targetItems).slice(0, this.collectableTarget)) {
      new CollectableItem(this, targetItem.x, targetItem.y, 'items', `body-part-${Phaser.Math.RND.integerInRange(0, 2)}.png`);
    }
    
    // Make list of weapon names duplicating each element according to its rarity, then select randomly from this list
    const weaponParameters = this.cache.json.get('weaponParameters');
    let weaponsList = [];
    for (var i = 0; i < 4; i ++) {
      weaponsList[i] = [];
    }

    for (var weaponName of Object.keys(weaponParameters)) {
      for (var i = 0; i < weaponParameters[weaponName].rarity; i++) {
        weaponsList[weaponParameters[weaponName].tier].push(weaponName);
      }
    }

    for (var i = 0; i < weaponsList.length; i++) {
      const weaponItems = this.getObjectsByName(mapData.objects, 'weapon', i);
      for (var weaponItem of Phaser.Math.RND.shuffle(weaponItems).slice(0, Math.floor(2/3*weaponItems.length))) {      
        const weaponName = Phaser.Math.RND.pick(weaponsList[i]);  
        const ammoAmount = Phaser.Math.Between(0, weaponParameters[weaponName].capacity);
        new WeaponItem(this, weaponItem.x, weaponItem.y, weaponName, ammoAmount);
      }
    }
    // console.log(weaponsList.length);
    // const weaponItems = this.getObjectsByName(mapData.objects, 'weapon');
    // console.log(weaponItems)
    // for (var weaponItem of Phaser.Math.RND.shuffle(weaponItems).slice(0, Math.floor(2/3*weaponItems.length))) {      
    //   const weaponName = Phaser.Math.RND.pick(weaponsList[weaponItem.type]);      
    //   const ammoAmount = Phaser.Math.Between(0, weaponParameters[weaponName].capacity);
    //   new WeaponItem(this, weaponItem.x, weaponItem.y, weaponName, ammoAmount);
    // }
     
    // Ammo
    const ammoItems = this.getObjectsByName(mapData.objects, 'ammo');
    for (var ammoItem of Phaser.Math.RND.shuffle(ammoItems).slice(0, Math.floor(2/3*ammoItems.length))) {
      new AmmoItem(this, ammoItem.x, ammoItem.y);
    }

    // Place one of each type randomly
    for (var keyType = 0; keyType < 2; keyType++) {
      const keyItems = this.getObjectsByName(mapData.objects, 'key', keyType.toString()); // All keys locations for type
      const keyItem = Phaser.Math.RND.shuffle(keyItems)[0]; // One random key location
      new KeyItem(this, keyItem.x, keyItem.y, keyType);
    }

    this.addExit(mapData.objects.find(obj => obj.name == 'exit').x, mapData.objects.find(obj => obj.name == 'exit').y);
  }

  addExit(exitPointX, exitPointY) {        
    this.exitPortal = this.physics.add.sprite(exitPointX, exitPointY).setVisible(false);
    this.physics.add.overlap(this.player, this.exitPortal, function () {        
      this.scene.get('UIOverlay').launchSummaryScreen();
    }.bind(this)); 

    this.exitPortal.body.enable = false;
  }

  activateExit() {
    this.exitPortal.body.enable = true;
    var targetPointers = this.physics.add.group({ classType: TargetPointer, runChildUpdate: true });
    targetPointers.get(this.exitPortal.x, this.exitPortal.y); 
  }

  addEnemies(mapData) {
    let enemyZone = this.getObjectsByName(mapData.objects, 'enemies');

    for (var zone of enemyZone) {
      // Allowed locations are defined as a polygon in Tiled, the top left corner is at (0, 0) so translate it
      const allowedAreaPolygon = zone.polygon;  
      const polygonOriginX = zone.x;  
      const polygonOriginY = zone.y;  
      let xMax = 0;
      let yMax = 0;
      for (var point of allowedAreaPolygon) {
        point.x += polygonOriginX;
        point.y += polygonOriginY;
        xMax = Math.max(xMax, point.x);
        yMax = Math.max(yMax, point.y);
      }

      // Get enemies to spawn from polygon object
      // for (var zone of enemyZone){ //[i].properties) {
      for (var [index, enemyGroup] of this.enemies.getChildren().entries()) {  
        let enemyProperties = zone.properties.find(obj => obj.name == enemyGroup.name);

        if (enemyProperties != null) {
          for (var i = 0; i < enemyProperties.value; i++){          
            let randomX = Phaser.Math.RND.between(polygonOriginX, xMax);
            let randomY = Phaser.Math.RND.between(polygonOriginY, yMax);
            while (!this.insidePolygon(allowedAreaPolygon, randomX, randomY)) {
              randomX = Phaser.Math.RND.between(polygonOriginX, xMax);
              randomY = Phaser.Math.RND.between(polygonOriginY, yMax);
            }
            let enemy = enemyGroup.get();
            enemy.spawn(randomX, randomY, true);
          }
        }
      }
    }
  }

  insidePolygon(polygon, x, y) { 
    var inside = false;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      var xi = polygon[i].x, yi = polygon[i].y;
      var xj = polygon[j].x, yj = polygon[j].y;
      
      var intersect = ((yi > y) != (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

	update(time) {
		// The player movement etc is all in the player class, is it sensible to run the updates like this?
		this.player.update();
	}
}

class TargetPointer extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, targetX, targetY) {
    super(scene);
    this.targetX = targetX;
    this.targetY = targetY;
    
    this.arrow = scene.add.polygon(scene.player.getCenter.x, scene.player.y, this.getArrowVertices(), 0xfaeb16)
      .setOrigin(0, 0).setDepth(100).setStrokeStyle(2, 0xf0e878, 0.5);
  }

  getArrowVertices() {
    const halfWidth = 4;
    const length = 20;
    const headHalfWidth = 7;
    const headLength = 8;
    return [ -halfWidth,-length, -halfWidth,-headLength, -headHalfWidth,-headLength, 0,0, headHalfWidth,-headLength, halfWidth,-headLength, halfWidth,-length];
  }

  getTargetPoint() {
    var targetPoint = new Phaser.Math.Vector2();
    
    // If the target is beyond the screen edge the arrow point is at the edge of the screen. 
    // TODO: compute the distance to the edge in constructor 
    if (Math.abs(this.scene.player.x - this.targetX) > 100) {
      targetPoint.x = this.scene.player.x - Math.sign(this.scene.player.x - this.targetX) * 100;
    } else {
      targetPoint.x = this.targetX;
    }
    if (Math.abs(this.scene.player.y - this.targetY) > 50) {
      targetPoint.y = this.scene.player.y - Math.sign(this.scene.player.y - this.targetY) * 50;
    } else {
      targetPoint.y = this.targetY;
    }
    
    return targetPoint;
    }

    update() {
      this.arrow.angle = 180 - Phaser.Math.RadToDeg(Math.atan2((this.scene.player.x - this.targetX), (this.scene.player.y - this.targetY)));
      var position = this.getTargetPoint();
      this.arrow.setPosition(position.x, position.y);
    }
}
